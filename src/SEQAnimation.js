import { AnimationClip, QuaternionKeyframeTrack } from './three.js';
import { rot13toRad, rot2quat, TimeScale, hex2 } from './VSTOOLS.js';

// TODO bug with 00_BT3 (action data and rotation data overlap?)

const ACTIONS = {
  0x01: ['loop', 0], // verified
  0x02: ['?', 0], // often at end
  0x04: ['?', 1], //
  0x0a: ['?', 1], // verified in 00_COM (no other options, 0x00 x00 follows)
  0x0b: ['?', 0], // pretty sure
  0x0c: ['?', 1],
  0x0d: ['?', 0],
  0x0f: ['?', 1], // first
  0x13: ['unlockBone', 1], // verified in emulation
  0x14: ['?', 1],
  0x15: ['?', 1], // verified 00_COM (no other options, 0x00 0x00 follows)
  0x16: ['?', 2], // first, verified 00_BT3
  0x17: ['?', 0], // + often at end
  0x18: ['?', 0], // + often at end
  0x19: ['?', 0], // first, verified 00_COM (no other options, 0x00 0x00 follows)
  0x1a: ['?', 1], // first, verified 00_BT1 (0x00 0x00 follows)
  0x1b: ['?', 1], // first, verified 00_BT1 (0x00 0x00 follows)
  0x1c: ['?', 1],
  0x1d: ['paralyze?', 0], // first, verified 1C_BT1
  0x24: ['?', 2], // first
  0x27: ['?', 4], // first, verified see 00_COM
  0x34: ['?', 3], // first
  0x35: ['?', 5], // first
  0x36: ['?', 3],
  0x37: ['?', 1], // pretty sure
  0x38: ['?', 1],
  0x39: ['?', 1],
  0x3a: ['disappear', 0],
  0x3b: ['land', 0],
  0x3c: ['adjustShadow', 1], // verified
  0x3f: ['?', 0], // first, pretty sure, often followed by 0x16
  0x40: ['?', 0], // often preceded by 0x1a, 0x1b, often at end
};

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

    // unknown. has weird effects on mesh.
    this.mode = r.u8(); // 4

    // points to special actions per frame, e.g. looping and special effects
    this.ptrActions = r.u16(); // 6

    // points to a translation vector for the animated mesh
    // plus translation keys
    this.ptrTranslation = r.u16(); // 8

    r.padding(2); // 10

    // pointers to pose and rotation keys for individual bones
    this.ptrBoneRotation = [];

    for (let i = 0; i < this.seq.numBones; ++i) {
      this.ptrBoneRotation[i] = r.u16();
    } // 10 + numBones * 2

    this.ptrSecondaryBoneRotation = [];

    // pointers to (optional) additional rotation keys for bones
    // mostly used for hair and cloth animation (01.SHP, 03.SHP)
    for (let i = 0; i < this.seq.numBones; ++i) {
      this.ptrSecondaryBoneRotation[i] = r.u16();
    } // 10 + numBones * 4
  }

  data() {
    const r = this.reader;

    // read translation
    r.seek(this.seq.ptrData(this.ptrTranslation));

    this.translation = this.readXYZ();
    this.translationKeys = this.readKeys();

    if (this.ptrActions > 0) {
      r.seek(this.seq.ptrData(this.ptrActions));
      this.readActions();
    }

    this.pose = []; // initial rotation per bone
    this.boneRotationKeys = [];
    this.secondaryPose = []; // TODO not too sure about this
    this.secondaryBoneRotationKeys = [];

    // read bone animation data
    for (let i = 0; i < this.seq.numBones; ++i) {
      r.seek(this.seq.ptrData(this.ptrBoneRotation[i]));

      if (this.idOtherAnimation === -1) {
        this.pose[i] = this.readXYZ();
      } // else use pose of other animation (at build)

      this.boneRotationKeys[i] = this.readKeys();

      // secondary is optional
      if (this.ptrSecondaryBoneRotation[i] > 0) {
        r.seek(this.seq.ptrData(this.ptrSecondaryBoneRotation[i])).mark(3);

        const x = r.s8();
        const y = r.s8();
        const z = r.s8();

        this.secondaryPose[i] = { x, y, z };
        //console.log(this.pose[i], this.secondaryPose[i]);
        this.secondaryBoneRotationKeys[i] = this.readKeys();
      }
    }
  }

  // read keyframes until 0x00-key is found
  // or animation length is exhausted
  readKeys() {
    const keys = [{ f: 0, x: 0, y: 0, z: 0 }];

    let f = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const key = this.readKey();

      if (!key) break;

      keys.push(key);
      f += key.f;

      if (f >= this.length - 1) break;
    }

    return keys;
  }

  // read one compressed keyframe into F, X?, Y?, Z? values
  // used for translation keys and bone rotation keys
  // this is basically reverse engineered from 0xafe90 to 0xb0000
  readKey() {
    const r = this.reader;

    let code = r.u8();

    if (code === 0x00) return;

    let f = null;
    let x = null;
    let y = null;
    let z = null;

    if ((code & 0xe0) > 0) {
      // number of frames, byte case

      f = code & 0x1f;

      if (f === 0x1f) {
        f = 0x20 + r.u8();
      } else {
        f = 1 + f;
      }
    } else {
      // number of frames, half word case

      f = code & 0x3;

      if (f === 0x3) {
        f = 4 + r.u8();
      } else {
        f = 1 + f;
      }

      // half word values

      code = code << 3;

      const h = r.s16big();

      if ((h & 0x4) > 0) {
        x = h >> 3;
        code = code & 0x60;

        if ((h & 0x2) > 0) {
          y = r.s16big();
          code = code & 0xa0;
        }

        if ((h & 0x1) > 0) {
          z = r.s16big();
          code = code & 0xc0;
        }
      } else if ((h & 0x2) > 0) {
        y = h >> 3;
        code = code & 0xa0;

        if ((h & 0x1) > 0) {
          z = r.s16big();
          code = code & 0xc0;
        }
      } else if ((h & 0x1) > 0) {
        z = h >> 3;
        code = code & 0xc0;
      }
    }

    // byte values (fallthrough)

    if ((code & 0x80) > 0) {
      if (x !== null) {
        throw new Error('Expected undefined x in SEQ animation data');
      }

      x = r.s8();
    }

    if ((code & 0x40) > 0) {
      if (y !== null) {
        throw new Error('Expected undefined y in SEQ animation data');
      }

      y = r.s8();
    }

    if ((code & 0x20) > 0) {
      if (z !== null) {
        throw new Error('Expected undefined z in SEQ animation data');
      }

      z = r.s8();
    }

    return { f, x, y, z };
  }

  readActions() {
    const r = this.reader;
    this.actions = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const f = r.u8(); // frame number or 0xff

      // TODO probably wrong to break here
      if (f === 0xff) break;

      if (f > this.length) {
        throw new Error(
          `Unexpected frame number ${hex2(f)} > ${
            this.length
          } in SEQ action section`
        );
      }

      const a = r.mark(1).u8(); // action

      if (a === 0x00) return;

      const action = ACTIONS[a];

      if (!action) {
        throw new Error(`Unknown SEQ action ${hex2(a)} at frame ${f}`);
      }

      const [name, paramCount] = action;
      const params = [];

      for (let i = 0; i < paramCount; ++i) {
        params.push(r.u8());
      }

      this.actions.push({
        f,
        name,
        params,
      });
    }
  }

  readXYZ() {
    const r = this.reader;

    // big endian! but... WHY?!
    const x = r.s16big();
    const y = r.s16big();
    const z = r.s16big();

    return { x, y, z };
  }

  //

  build() {
    const tracks = [];

    // TODO use secondary rotations, too

    // rotation bones

    for (let i = 0; i < this.seq.numBones; ++i) {
      const pose =
        this.idOtherAnimation === -1
          ? this.pose[i]
          : this.seq.animations[this.idOtherAnimation].pose[i];
      const boneRotationKeys = this.boneRotationKeys[i];

      // multiplication by two at 0xad25c, 0xad274, 0xad28c
      let rx = pose.x * 2;
      let ry = pose.y * 2;
      let rz = pose.z * 2;

      const times = [];
      const values = [];

      let t = 0;

      for (let j = 0, l = boneRotationKeys.length; j < l; ++j) {
        const key = boneRotationKeys[j];
        const f = key.f;

        if (key.x === null) key.x = boneRotationKeys[j - 1].x;
        if (key.y === null) key.y = boneRotationKeys[j - 1].y;
        if (key.z === null) key.z = boneRotationKeys[j - 1].z;

        t += f;
        rx += key.x * f;
        ry += key.y * f;
        rz += key.z * f;

        const q = rot2quat(rot13toRad(rx), rot13toRad(ry), rot13toRad(rz));

        times.push(t * TimeScale);
        values.push(q.x, q.y, q.z, q.w);
      }

      tracks.push(
        new QuaternionKeyframeTrack(`.bones[${i}].quaternion`, times, values)
      );
    }

    this.animationClip = new AnimationClip(
      this.id.toString(),
      this.length * TimeScale,
      tracks
    );
  }
}
