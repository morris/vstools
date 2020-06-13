import { SEQAnimation } from './SEQAnimation.js';

// 00_COM.SEQ is at 0x80125ea0 in RAM

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

    // base ptr needed because SEQ may be embedded
    this.baseOffset = r.pos;

    this.numSlots = r.u16(); // 'slots' is just some random name, purpose unknown
    this.numBones = r.u8();
    r.padding(1);

    this.size = r.u32(); // file size
    this.dataOffset = r.u32() + 8; // offset to animation data
    this.slotOffset = r.u32() + 8; // offset to slots
    this.headerOffset = this.slotOffset + this.numSlots; // offset to rotation and keyframe data
  }

  data() {
    const r = this.reader;

    const headerOffset = this.headerOffset;

    // number of animations has to be computed
    // length of all headers / length of one animation header
    this.numAnimations =
      (headerOffset - this.numSlots - 16) / (this.numBones * 4 + 10);

    // read animation headers
    this.animations = [];

    for (let i = 0; i < this.numAnimations; ++i) {
      const animation = new SEQAnimation(this.reader, this);
      animation.header(i);

      this.animations.push(animation);
    }

    // read 'slots'
    // these are animation ids, can be used as in this.animations[ id ].
    // purpose unknown
    this.slots = [];

    for (let i = 0; i < this.numSlots; ++i) {
      this.slots[i] = r.s8();
    }

    // read animation data
    for (let i = 0; i < this.numAnimations; ++i) {
      this.animations[i].data();
    }
  }

  build() {
    for (let i = 0; i < this.numAnimations; ++i) {
      this.animations[i].build();
    }
  }

  ptrData(i) {
    return i + this.headerOffset + this.baseOffset;
  }
}
