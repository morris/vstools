import { hex2 } from './VSTOOLS.js';

export class Reader {
  constructor(data) {
    this.data = data;
    this.pos = 0;
    this.type = new Int8Array(data.length);
    this.info = new Int8Array(data.length);
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

    const r = this.data[this.pos++];
    this.type[this.pos - 1] = 1;

    return r;
  }

  s8() {
    const r = (this.u8() << 24) >> 24;
    this.type[this.pos - 1] = -1;

    return r;
  }

  s16() {
    const r = this.u8() | (this.s8() << 8);
    this.type[this.pos - 1] = -2;
    this.type[this.pos - 2] = -2;

    return r;
  }

  s16big() {
    const r = (this.s8() << 8) | this.u8();
    this.type[this.pos - 1] = -20;
    this.type[this.pos - 2] = -20;

    return r;
  }

  u16() {
    const r = this.s16() & 0xffff;
    this.type[this.pos - 1] = 2;
    this.type[this.pos - 2] = 2;

    return r;
  }

  s32() {
    const r =
      this.u8() | (this.u8() << 8) | (this.u8() << 16) | (this.u8() << 24);
    this.type[this.pos - 1] = -4;
    this.type[this.pos - 2] = -4;
    this.type[this.pos - 3] = -4;
    this.type[this.pos - 4] = -4;

    return r;
  }

  u32() {
    const r = this.s32();

    // TODO if we see this error, need to switch to BigInt?
    if (r < 0) throw new Error('Got unsigned int > 0x7fffffff');

    this.type[this.pos - 1] = 4;
    this.type[this.pos - 2] = 4;
    this.type[this.pos - 3] = 4;
    this.type[this.pos - 4] = 4;

    return r;
  }

  buffer(len) {
    const arr = new Array(len);

    for (let i = 0; i < len; ++i) {
      arr[i] = this.u8();
      this.type[this.pos - 1] = 3;
    }

    return arr;
  }

  constant(bytes) {
    const actual = this.buffer(bytes.length);

    for (let i = 0; i < bytes.length; ++i) {
      if (actual[i] !== bytes[i]) {
        throw new Error(`Expected ${bytes.join(' ')}, got ${actual.join(' ')}`);
      }

      this.type[this.pos - i - 1] = 5;
    }

    return this;
  }

  padding(length, byte = 0) {
    const actual = this.buffer(length);

    for (let i = 0; i < length; ++i) {
      if (actual[i] !== byte) {
        throw new Error(
          `Expected ${hex2(byte)} padding (${length}), got ${actual
            .map(hex2)
            .join(' ')}`
        );
      }

      this.type[this.pos - i - 1] = 7;
    }

    return this;
  }

  mark(i = 1, offset = 0) {
    this.info[this.pos + offset] = i;

    return this;
  }
}
