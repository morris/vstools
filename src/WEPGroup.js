export class WEPGroup {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;
    this.boneId = r.s16();
    this.lastVertex = r.u16();
  }
}
