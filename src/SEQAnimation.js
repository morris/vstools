VSTOOLS.SEQAnimation = function (reader, seq) {
  reader.extend(this);

  this.seq = seq;
};

VSTOOLS.SEQAnimation.prototype.header = function (id) {
  var u8 = this.u8,
    s8 = this.s8,
    u16 = this.u16,
    skip = this.skip;
  var seq = this.seq;

  this.id = id;
  this.length = u16(); // 2

  // some animations use a different animation as base
  this.idOtherAnimation = s8(); // 3

  this.mode = u8(); // unknown. has weird effects on mesh. 4

  // seems to point to a data block that controls looping
  this.ptr1 = u16(); // 6

  // points to a translation vector for the animated mesh
  this.ptrTranslation = u16(); // 8

  // points to a data block that controls movement
  this.ptrMove = u16(); // 10

  // read pointers to pose and keyframes for individual bones
  this.ptrBones = [];

  for (var i = 0; i < seq.numBones; ++i) {
    var ptr = u16();
    this.ptrBones.push(ptr);
  } // 10 + numBones * 2

  for (var i = 0; i < seq.numBones; ++i) {
    // TODO is this 0 for all SEQ?
    skip(2);
  } // 10 + numBones * 4
};

VSTOOLS.SEQAnimation.prototype.data = function () {
  var u8 = this.u8,
    s8 = this.s8,
    u16 = this.u16,
    s16big = this.s16big,
    skip = this.skip,
    seek = this.seek;

  var seq = this.seq;
  var shp = seq.shp;

  // read translation
  // big endian
  seek(seq.ptrData(this.ptrTranslation));

  var x = s16big();
  var y = s16big();
  var z = s16big();

  // TODO implement move

  // set base animation
  this.base = this;
  if (this.idOtherAnimation !== -1) {
    this.base = seq.animations[this.idOtherAnimation];
  }

  // this holds the initial rotation of bones,
  // i.e. the initial pose for the animation
  this.pose = [];

  this.keyframes = [];

  // read base pose and keyframes
  for (var i = 0; i < seq.numBones; ++i) {
    this.keyframes.push([[0, 0, 0, 0]]);

    seek(seq.ptrData(this.base.ptrBones[i]));

    this.readPose(i);
    this.readKeyframes(i);
  }
};

VSTOOLS.SEQAnimation.prototype.readPose = function (i) {
  var s16big = this.s16big;

  // big endian! but... WHY?!
  var rx = s16big(),
    ry = s16big(),
    rz = s16big();

  this.pose[i] = [rx, ry, rz];
};

VSTOOLS.SEQAnimation.prototype.readKeyframes = function (i) {
  var u8 = this.u8,
    s8 = this.s8,
    s16big = this.s16big,
    skip = this.skip,
    seek = this.seek;

  var f = 0,
    t;

  while (true) {
    var op = this.readOpcode();

    if (!op) break;

    f += op[3];

    this.keyframes[i].push(op);

    if (f >= this.length - 1) break;
  }
};

// opcodes
// this is basically 0xafe90 to 0xb0000
// reads one opcode and its X, Y, Z, T values
// this is actually used for rotations AND a few translations
VSTOOLS.SEQAnimation.prototype.readOpcode = function () {
  var u8 = this.u8,
    s8 = this.s8,
    s16big = this.s16big;

  var op = u8();
  var op0 = op;

  if (op === 0) return null;

  // results
  var x = null,
    y = null,
    z = null,
    f = null;

  if ((op & 0xe0) > 0) {
    // number of frames, byte case

    f = op & 0x1f;

    if (f === 0x1f) {
      f = 0x20 + u8();
    } else {
      f = 1 + f;
    }
  } else {
    // number of frames, half word case

    f = op & 0x3;

    if (f === 0x3) {
      f = 4 + u8();
    } else {
      f = 1 + f;
    }

    // half word values

    op = op << 3;

    var h = s16big();

    if ((h & 0x4) > 0) {
      x = h >> 3;
      op = op & 0x60;

      if ((h & 0x2) > 0) {
        y = s16big();
        op = op & 0xa0;
      }

      if ((h & 0x1) > 0) {
        z = s16big();
        op = op & 0xc0;
      }
    } else if ((h & 0x2) > 0) {
      y = h >> 3;
      op = op & 0xa0;

      if ((h & 0x1) > 0) {
        z = s16big();
        op = op & 0xc0;
      }
    } else if ((h & 0x1) > 0) {
      z = h >> 3;
      op = op & 0xc0;
    }
  }

  // byte values (fallthrough)

  if ((op & 0x80) > 0) {
    x = s8();
  }

  if ((op & 0x40) > 0) {
    y = s8();
  }

  if ((op & 0x20) > 0) {
    z = s8();
  }

  return [x, y, z, f];
};

VSTOOLS.SEQAnimation.prototype.build = function () {
  var seq = this.seq;
  var shp = seq.shp;
  var numBones = seq.numBones;
  var hierarchy = [];
  var rad = VSTOOLS.rot13toRad;

  // rotation bones

  for (var i = 0; i < numBones; ++i) {
    var keyframes = this.keyframes[i];
    var pose = this.pose[i];

    // multiplication by two at 0xad25c, 0xad274, 0xad28c
    var rx = pose[0] * 2;
    var ry = pose[1] * 2;
    var rz = pose[2] * 2;

    var keys = [];
    var t = 0;

    for (var j = 0, l = keyframes.length; j < l; ++j) {
      var keyframe = keyframes[j];

      var f = keyframe[3];

      t += f;

      if (keyframe[0] === null) keyframe[0] = keyframes[j - 1][0];
      if (keyframe[1] === null) keyframe[1] = keyframes[j - 1][1];
      if (keyframe[2] === null) keyframe[2] = keyframes[j - 1][2];

      rx += keyframe[0] * f;
      ry += keyframe[1] * f;
      rz += keyframe[2] * f;

      var q = VSTOOLS.rot2quat(rad(rx), rad(ry), rad(rz));

      keys.push({
        time: t * VSTOOLS.TimeScale,
        pos: [0, 0, 0],
        rot: [q.x, q.y, q.z, q.w],
        scl: [1, 1, 1],
      });
    }

    hierarchy.push({ keys: keys });
  }

  // root's translation bone

  hierarchy.push({
    keys: [
      {
        time: 0,
        pos: [0, 0, 0],
        rot: [0, 0, 0, 1],
        scl: [1, 1, 1],
      },
    ],
  });

  // translation bones

  for (var i = 1; i < numBones; ++i) {
    hierarchy.push({
      keys: [
        {
          time: 0,
          pos: [shp.bones[i].length, 0, 0],
          rot: [0, 0, 0, 1],
          scl: [1, 1, 1],
        },
      ],
    });
  }

  var data = (this.animationData = {
    name: 'Animation' + this.id,
    fps: 25,
    length: this.length * VSTOOLS.TimeScale,
    hierarchy: hierarchy,
  });

  this.animationClip = new THREE.AnimationClip.parseAnimation(
    data,
    shp.mesh.skeleton.bones
  );
};
