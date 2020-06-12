export class FBT {
  constructor(reader, fbc) {
    this.reader = reader;
    this.fbc = fbc;
  }

  read() {
    const r = this.reader;

    this.width = 128;
    this.height = 256;
    const size = this.width * this.height;
    this.buffer = new Uint8Array(size * 4);

    for (let i = 0, j = 0; i < size; ++i) {
      const p = r.u8();
      const c = this.fbc.palette[p];
      this.buffer[j + 0] = c[0];
      this.buffer[j + 1] = c[1];
      this.buffer[j + 2] = c[2];
      this.buffer[j + 3] = c[3];

      j += 4;
    }

    this.image = { data: this.buffer, width: this.width, height: this.height };
    this.textures = [{ image: this.image }];
  }
}
