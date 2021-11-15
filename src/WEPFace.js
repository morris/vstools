import { hex } from './VSTOOLS.js';

// weird order of data is likely due to alignment in blocks of size 4

export class WEPFace {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    this.type = r.u8(); // 1

    if (this.type !== 0x24 && this.type !== 0x2c) {
      throw new Error('Unknown face type: ' + hex(this.type));
    }

    this.size = r.u8(); // 2
    this.info = r.u8(); // 3
    r.skip(1); // TODO whats this? 4

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

    // default vertex color is 0x80
    this.r1 = 0x80;
    this.g1 = 0x80;
    this.b1 = 0x80;
    this.r2 = 0x80;
    this.g2 = 0x80;
    this.b2 = 0x80;
    this.r3 = 0x80;
    this.g3 = 0x80;
    this.b3 = 0x80;

    if (this.quad()) {
      this.r4 = 0x80;
      this.g4 = 0x80;
      this.b4 = 0x80;
    }
  }

  readColored() {
    const r = this.reader;

    this.type = r.data[r.pos + 11];

    if (this.type === 0x34) {
      return this.readTriangleColored();
    } else if (this.type === 0x3c) {
      return this.readQuadColored();
    } else {
      throw new Error('Unknown face type: ' + hex(this.type));
    }
  }

  readTriangleColored() {
    const r = this.reader;

    this.vertex1 = r.u16() / 4;
    this.vertex2 = r.u16() / 4;

    this.vertex3 = r.u16() / 4;
    this.u1 = r.u8();
    this.v1 = r.u8();

    this.r1 = r.u8();
    this.g1 = r.u8();
    this.b1 = r.u8();
    r.constant([0x34]); // type

    this.r2 = r.u8();
    this.g2 = r.u8();
    this.b2 = r.u8();
    this.size = r.u8();

    this.r3 = r.u8();
    this.g3 = r.u8();
    this.b3 = r.u8();
    this.info = r.u8();

    this.u2 = r.u8();
    this.v2 = r.u8();
    this.u3 = r.u8();
    this.v3 = r.u8();

    // 28
  }

  readQuadColored() {
    const r = this.reader;

    this.vertex1 = r.u16() / 4;
    this.vertex2 = r.u16() / 4;

    this.vertex3 = r.u16() / 4;
    this.vertex4 = r.u16() / 4;

    this.r1 = r.u8();
    this.g1 = r.u8();
    this.b1 = r.u8();
    r.constant([0x3c]); // type

    this.r2 = r.u8();
    this.g2 = r.u8();
    this.b2 = r.u8();
    this.size = r.u8();

    this.r3 = r.u8();
    this.g3 = r.u8();
    this.b3 = r.u8();
    this.info = r.u8();

    this.r4 = r.u8();
    this.g4 = r.u8();
    this.b4 = r.u8();
    r.skip(1); // always 0x00 except for B1.SHP (0x01)

    this.u1 = r.u8();
    this.v1 = r.u8();
    this.u2 = r.u8();
    this.v2 = r.u8();

    this.u3 = r.u8();
    this.v3 = r.u8();
    this.u4 = r.u8();
    this.v4 = r.u8();

    // 36
  }

  quad() {
    return this.type === 0x2c || this.type === 0x3c;
  }

  double() {
    return this.info === 0x5;
  }
}
