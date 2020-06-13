import { hex2 } from './VSTOOLS.js';

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
    const u = this.s32();

    // TODO if we see this error, need to switch to BigInt?
    if (u < 0) throw new Error('Got unsigned int > 0x7fffffff');

    return u;
  }

  buffer(len) {
    const arr = new Array(len);

    for (let i = 0; i < len; ++i) {
      arr[i] = this.u8();
    }

    return arr;
  }

  constant(bytes) {
    const actual = this.buffer(bytes.length);

    for (let i = 0; i < bytes.length; ++i) {
      if (actual[i] !== bytes[i]) {
        throw new Error(`Expected ${bytes.join(' ')}, got ${actual.join(' ')}`);
      }
    }
  }

  padding(length, byte = 0) {
    const actual = this.buffer(length);

    for (let i = 0; i < length; ++i) {
      if (actual[i] !== byte) {
        throw new Error(
          `Expected ${hex2(byte)}-padding (${length}), got ${actual
            .map(hex2)
            .join(' ')}`
        );
      }
    }
  }
}
