import { Vector3 } from './three.js';

export class MPDFace {
  constructor(reader, group) {
    this.reader = reader;
    this.group = group;
  }

  read(quad) {
    const r = this.reader;

    this.quad = quad;

    // two bytes per axis
    this.p1x = r.s16();
    this.p1y = r.s16();
    this.p1z = r.s16();

    // p2, p3, p4 are stored as offset vectors from p1
    // one byte per axis
    this.p2x = r.s8();
    this.p2y = r.s8();
    this.p2z = r.s8();

    this.p3x = r.s8();
    this.p3y = r.s8();
    this.p3z = r.s8();

    this.r1 = r.u8();
    this.g1 = r.u8();
    this.b1 = r.u8();

    // type
    // 52, 54 triangles
    // 60, 62 quads
    this.type = r.u8();
    // TODO assert

    this.r2 = r.u8();
    this.g2 = r.u8();
    this.b2 = r.u8();

    this.u1 = r.u8();

    this.r3 = r.u8();
    this.g3 = r.u8();
    this.b3 = r.u8();

    this.v1 = r.u8();
    this.u2 = r.u8();
    this.v2 = r.u8();

    this.clutId = r.u16();

    this.u3 = r.u8();
    this.v3 = r.u8();

    this.textureId = r.s16();

    if (this.quad) {
      this.p4x = r.s8();
      this.p4y = r.s8();
      this.p4z = r.s8();

      this.u4 = r.u8();

      this.r4 = r.u8();
      this.g4 = r.u8();
      this.b4 = r.u8();

      this.v4 = r.u8();
    }
  }

  build() {
    this.p1 = new Vector3(this.p1x, this.p1y, this.p1z);

    this.p2 = new Vector3(
      this.p2x * this.group.scale + this.p1x,
      this.p2y * this.group.scale + this.p1y,
      this.p2z * this.group.scale + this.p1z
    );

    this.p3 = new Vector3(
      this.p3x * this.group.scale + this.p1x,
      this.p3y * this.group.scale + this.p1y,
      this.p3z * this.group.scale + this.p1z
    );

    if (this.quad) {
      this.p4 = new Vector3(
        this.p4x * this.group.scale + this.p1x,
        this.p4y * this.group.scale + this.p1y,
        this.p4z * this.group.scale + this.p1z
      );
    }

    this.n = new Vector3(this.p2x, this.p2y, this.p2z);
    this.n.cross(new Vector3(this.p3x, this.p3y, this.p3z));
    this.n.normalize();
    this.n.negate();
  }
}
