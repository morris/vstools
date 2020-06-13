export class WEPGroup {
  constructor(reader, id) {
    this.reader = reader;
    this.id = id;
  }

  read() {
    const r = this.reader;
    this.boneId = r.s16();
    this.lastVertex = r.u16();
  }
}
