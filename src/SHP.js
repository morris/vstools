import { WEP } from './WEP.js';

export class SHP extends WEP {
  constructor(reader) {
    super(reader);
  }

  header() {
    const r = this.reader;

    this.header1(); // inherited from WEP

    this.overlayX = [];
    this.overlayY = [];
    this.width = [];
    this.height = [];

    for (let i = 0; i < 8; ++i) {
      this.overlayX.push(r.u8());
      this.overlayY.push(r.u8());
      this.width.push(r.u8());
      this.height.push(r.u8());
    }

    r.skip(0x24); // TODO unknown
    r.skip(0x6); // TODO collision? not sure about this

    this.menuPositionY = r.s16();
    r.skip(0xc); // TODO unknown
    this.shadowRadius = r.s16();
    this.shadowSizeIncrease = r.s16();
    this.shadowSizeDecrease = r.s16();
    r.skip(4); // TODO

    this.menuScale = r.s16();
    r.skip(2); // TODO
    this.targetSpherePositionY = r.s16();
    r.skip(8); // TODO

    this.animLBAs = [];
    for (let i = 0; i < 0xc; ++i) {
      this.animLBAs.push(r.u32());
    }

    this.chainIds = [];
    for (let i = 0; i < 0xc; ++i) {
      this.chainIds.push(r.u16());
    }

    this.specialLBAs = [];
    for (let i = 0; i < 4; ++i) {
      this.specialLBAs.push(r.u32());
    }

    r.skip(0x20); // TODO unknown, more lbas?

    this.magicPtr = r.u32() + 0xf8;
    r.skip(0x30); // TODO whats this?
    this.akaoPtr = r.u32() + 0xf8;
    this.groupPtr = r.u32() + 0xf8;
    this.vertexPtr = r.u32() + 0xf8;
    this.facePtr = r.u32() + 0xf8;
  }

  data() {
    const r = this.reader;

    // inherited
    this.boneSection();
    this.groupSection();
    this.vertexSection();
    this.faceSection();

    // TODO skip akao
    r.skip(this.magicPtr - this.akaoPtr);

    // TODO skip magic section
    r.skip(4);
    const length = r.u32();
    r.skip(length);

    // inherited
    this.textureSection(2); // 2 palettes
  }
}
