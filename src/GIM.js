export class GIM {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    r.skip(120); // TODO

    this.width = 128; // 128 * 92
    this.height = 64;
    this.buffer = [];

    for (let i = 0; i < this.width * this.height; ++i) {
      const c = r.u8();
      this.buffer.push(c, c, c, 255);
    }
  }

  build() {
    this.textures = [
      { image: { data: this.buffer, width: this.width, height: this.height } },
    ];
  }
}
