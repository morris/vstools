import { SEQAnimation } from './SEQAnimation.js';

export class SEQ {
  constructor(reader, shp) {
    this.reader = reader;
    this.shp = shp;
  }

  read() {
    this.header();
    this.data();
  }

  header() {
    const r = this.reader;

    this.ramPtr = 0x125e9e; // TODO fix this for ashley?
    this.ramPtr = 0;

    // base ptr needed because seq may be embedded
    this.basePtr = r.pos;

    this.numSlots = r.u16(); // 'slots' is just some random name, purpose unknown
    this.numBones = r.u8();
    r.skip(1); // padding

    this.size = r.u32(); // file size
    this.h3 = r.u32(); // unknown
    this.slotPtr = r.u32() + 8; // ptr to slots
    this.dataPtr = this.slotPtr + this.numSlots; // ptr to rotation and keyframe data
  }

  data() {
    const r = this.reader;

    const dataPtr = this.dataPtr,
      numBones = this.numBones,
      numSlots = this.numSlots;

    // number of animations has to be computed
    // length of all headers / length of one animation header
    const numAnimations = (this.numAnimations =
      (dataPtr - numSlots - 16) / (numBones * 4 + 10));

    // read animation headers
    const animations = (this.animations = []);

    for (let i = 0; i < numAnimations; ++i) {
      const animation = new SEQAnimation(this.reader, this);
      animation.header(i);

      animations.push(animation);
    }

    // read 'slots'
    // these are animation ids, can be used as in this.animations[ id ].
    // purpose unknown
    const slots = (this.slots = []);

    for (let i = 0; i < numSlots; ++i) {
      slots[i] = r.s8();
    }

    // read animation data
    for (let i = 0; i < numAnimations; ++i) {
      animations[i].data();
    }
  }

  build() {
    const numAnimations = this.numAnimations,
      animations = this.animations;

    for (let i = 0; i < numAnimations; ++i) {
      animations[i].build();
    }
  }

  ptrData(i) {
    return i + this.dataPtr + this.basePtr;
  }
}
