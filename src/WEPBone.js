export class WEPBone {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    this.length = -r.s16(); // negative

    r.skip(2); // TODO always 0xFFFF? no effect on bone size or model

    this.parentBoneId = r.s8();

    // TODO unused??
    this.x = r.s8();
    this.y = r.s8();
    this.z = r.s8();

    this.mode = r.s8();

    // TODO mode
    // 0 - 2 normal ?
    // 3 - 6 normal + roll 90 degrees
    // 7 - 255 absolute, different angles

    r.skip(1); // TODO unknown
    r.skip(6); // TODO always 0? padding?
  }
}
