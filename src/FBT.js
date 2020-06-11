export function FBT(reader, fbc) {
  reader.extend(this);
  this.fbc = fbc;
}

FBT.prototype.read = function () {
  const u8 = this.u8;

  const width = (this.width = 128);
  const height = (this.height = 256);
  const size = width * height;
  const palette = this.fbc.palette;
  const buffer = (this.buffer = new Uint8Array(size * 4));

  for (let i = 0, j = 0; i < size; ++i) {
    const p = u8();
    const c = palette[p];
    buffer[j + 0] = c[0];
    buffer[j + 1] = c[1];
    buffer[j + 2] = c[2];
    buffer[j + 3] = c[3];

    j += 4;
  }

  this.image = { data: this.buffer, width: this.width, height: this.height };
  this.textures = [{ image: this.image }];
};
