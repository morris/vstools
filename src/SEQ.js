import { SEQAnimation } from './SEQAnimation.js';

export function SEQ(reader, shp) {
  reader.extend(this);

  this.shp = shp;
}

SEQ.prototype.read = function () {
  this.header();
  this.data();
};

SEQ.prototype.header = function () {
  const u8 = this.u8,
    u16 = this.u16,
    u32 = this.u32,
    skip = this.skip;

  this.ramPtr = 0x125e9e; // TODO fix this for ashley?
  this.ramPtr = 0;

  // base ptr needed because seq may be embedded
  this.basePtr = this.reader.pos();

  this.numSlots = u16(); // 'slots' is just some random name, purpose unknown
  this.numBones = u8();
  skip(1); // padding

  this.size = u32(); // file size
  this.h3 = u32(); // unknown
  this.slotPtr = u32() + 8; // ptr to slots
  this.dataPtr = this.slotPtr + this.numSlots; // ptr to rotation and keyframe data
};

SEQ.prototype.data = function () {
  const s8 = this.s8;

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
    slots[i] = s8();
  }

  // read animation data
  for (let i = 0; i < numAnimations; ++i) {
    animations[i].data();
  }
};

SEQ.prototype.build = function () {
  const numAnimations = this.numAnimations,
    animations = this.animations;

  for (let i = 0; i < numAnimations; ++i) {
    animations[i].build();
  }
};

SEQ.prototype.ptrData = function (i) {
  return i + this.dataPtr + this.basePtr;
};
