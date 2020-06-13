export class WEPVertex {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    this.x = r.s16();
    this.y = r.s16();
    this.z = r.s16();
    r.padding(2);
  }
}
