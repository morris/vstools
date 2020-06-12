export class Reader {
  constructor(data) {
    this.data = data;
    this.pos = 0;
  }

  seek(i) {
    this.pos = i;

    return this;
  }

  skip(i) {
    this.pos += i;

    return this;
  }

  u8() {
    if (this.pos >= this.data.length) throw new Error('Out of bounds');

    this.pos += 1;
    return this.data[this.pos - 1];
  }

  s8() {
    return (this.u8() << 24) >> 24;
  }

  s16() {
    return this.u8() | (this.s8() << 8);
  }

  s16big() {
    return (this.s8() << 8) | this.u8();
  }

  u16() {
    return this.s16() & 0xffff;
  }

  s32() {
    return this.u8() | (this.u8() << 8) | (this.u8() << 16) | (this.u8() << 24);
  }

  u32() {
    // TODO only works if u32 are really all smaller than 0x7fffffff
    return this.s32();
  }

  buffer(len) {
    const arr = new Array(len);

    for (let i = 0; i < len; ++i) {
      arr[i] = this.u8();
    }

    return arr;
  }
}
