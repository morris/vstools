import { AnimationClip } from './three.js';
import { rot13toRad, rot2quat, TimeScale } from './VSTOOLS.js';

export class SEQAnimation {
  constructor(reader, seq) {
    this.reader = reader;
    this.seq = seq;
  }

  header(id) {
    const r = this.reader;

    this.id = id;
    this.length = r.u16(); // 2

    // some animations use a different animation as base
    this.idOtherAnimation = r.s8(); // 3

    this.mode = r.u8(); // unknown. has weird effects on mesh. 4

    // seems to point to a data block that controls looping
    this.ptr1 = r.u16(); // 6

    // points to a translation vector for the animated mesh
    this.ptrTranslation = r.u16(); // 8

    // points to a data block that controls movement
    this.ptrMove = r.u16(); // 10

    // read pointers to pose and keyframes for individual bones
    this.ptrRotation = [];

    for (let i = 0; i < this.seq.numBones; ++i) {
      this.ptrRotation.push(r.u16());
    } // 10 + numBones * 2

    this.ptrScale = [];

    for (let i = 0; i < this.seq.numBones; ++i) {
      this.ptrScale.push(r.u16());
    } // 10 + numBones * 4
  }

  data() {
    const r = this.reader;

    // read translation
    // big endian
    r.seek(this.seq.ptrData(this.ptrTranslation));

    this.tx = r.s16big();
    this.ty = r.s16big();
    this.tz = r.s16big();

    // TODO implement move

    // set base animation
    this.base =
      this.idOtherAnimation === -1
        ? this
        : this.seq.animations[this.idOtherAnimation];

    // this holds the initial rotation of bones,
    // i.e. the initial pose for the animation
    this.pose = [];
    this.keyframes = [];

    // read base pose and keyframes
    for (let i = 0; i < this.seq.numBones; ++i) {
      this.keyframes.push([[0, 0, 0, 0]]);

      r.seek(this.seq.ptrData(this.base.ptrRotation[i]));

      this.pose.push(this.readPose());
      this.readKeyframes(i);

      // TODO read ptrScale data
    }
  }

  readPose() {
    const r = this.reader;

    // big endian! but... WHY?!
    const rx = r.s16big();
    const ry = r.s16big();
    const rz = r.s16big();

    return [rx, ry, rz];
  }

  readKeyframes(i) {
    let f = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const op = this.readOpcode();

      if (!op) break;

      f += op[3];

      this.keyframes[i].push(op);

      if (f >= this.length - 1) break;
    }
  }

  // opcodes
  // this is basically 0xafe90 to 0xb0000
  // reads one opcode and its X, Y, Z, T values
  // this is actually used for rotations AND a few translations
  readOpcode() {
    const r = this.reader;

    let op = r.u8();

    if (op === 0) return;

    // results
    let x = null;
    let y = null;
    let z = null;
    let f = null;

    if ((op & 0xe0) > 0) {
      // number of frames, byte case

      f = op & 0x1f;

      if (f === 0x1f) {
        f = 0x20 + r.u8();
      } else {
        f = 1 + f;
      }
    } else {
      // number of frames, half word case

      f = op & 0x3;

      if (f === 0x3) {
        f = 4 + r.u8();
      } else {
        f = 1 + f;
      }

      // half word values

      op = op << 3;

      const h = r.s16big();

      if ((h & 0x4) > 0) {
        x = h >> 3;
        op = op & 0x60;

        if ((h & 0x2) > 0) {
          y = r.s16big();
          op = op & 0xa0;
        }

        if ((h & 0x1) > 0) {
          z = r.s16big();
          op = op & 0xc0;
        }
      } else if ((h & 0x2) > 0) {
        y = h >> 3;
        op = op & 0xa0;

        if ((h & 0x1) > 0) {
          z = r.s16big();
          op = op & 0xc0;
        }
      } else if ((h & 0x1) > 0) {
        z = h >> 3;
        op = op & 0xc0;
      }
    }

    // byte values (fallthrough)

    if ((op & 0x80) > 0) {
      x = r.s8();
    }

    if ((op & 0x40) > 0) {
      y = r.s8();
    }

    if ((op & 0x20) > 0) {
      z = r.s8();
    }

    return [x, y, z, f];
  }

  build() {
    const seq = this.seq;
    const shp = seq.shp;
    const numBones = seq.numBones;
    const hierarchy = [];
    let i;

    // rotation bones

    for (i = 0; i < numBones; ++i) {
      const keyframes = this.keyframes[i];
      const pose = this.pose[i];

      // multiplication by two at 0xad25c, 0xad274, 0xad28c
      let rx = pose[0] * 2;
      let ry = pose[1] * 2;
      let rz = pose[2] * 2;

      const keys = [];
      let t = 0;

      for (let j = 0, l = keyframes.length; j < l; ++j) {
        const keyframe = keyframes[j];

        const f = keyframe[3];

        t += f;

        if (keyframe[0] === null) keyframe[0] = keyframes[j - 1][0];
        if (keyframe[1] === null) keyframe[1] = keyframes[j - 1][1];
        if (keyframe[2] === null) keyframe[2] = keyframes[j - 1][2];

        rx += keyframe[0] * f;
        ry += keyframe[1] * f;
        rz += keyframe[2] * f;

        const q = rot2quat(rot13toRad(rx), rot13toRad(ry), rot13toRad(rz));

        keys.push({
          time: t * TimeScale,
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

    for (i = 1; i < numBones; ++i) {
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

    this.animationData = {
      name: 'Animation' + this.id,
      fps: 25,
      length: this.length * TimeScale,
      hierarchy,
    };

    this.animationClip = new AnimationClip.parseAnimation(
      this.animationData,
      shp.mesh.skeleton.bones
    );
  }
}
