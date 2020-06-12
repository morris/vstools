import { hex } from './VSTOOLS.js';

export class WEPFace {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    this.type = r.u8(); // 1

    if (this.type === 0x24) {
      // triangle
    } else if (this.type === 0x2c) {
      // quad
    } else {
      throw new Error('Unknown face type: ' + hex(this.type));
    }

    this.size = r.u8(); // 2
    this.info = r.u8(); // 3
    this.u = r.u8(); // TODO whats this? 4

    this.vertex1 = r.u16() / 4; // 6
    this.vertex2 = r.u16() / 4; // 8
    this.vertex3 = r.u16() / 4; // 10

    if (this.quad()) {
      this.vertex4 = r.u16() / 4; // + 2
    }

    this.u1 = r.u8(); // 11
    this.v1 = r.u8(); // 12
    this.u2 = r.u8(); // 13
    this.v2 = r.u8(); // 14
    this.u3 = r.u8(); // 15
    this.v3 = r.u8(); // 16

    if (this.quad()) {
      this.u4 = r.u8(); // + 3
      this.v4 = r.u8(); // + 4
    }

    // size of triangle is 16, quad is 20
  }

  quad() {
    return this.type === 0x2c;
  }

  double() {
    return this.info === 0x5;
  }
}
