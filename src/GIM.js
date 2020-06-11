export function GIM(reader) {
  reader.extend(this);
}

GIM.prototype.read = function () {
  const u8 = this.u8,
    skip = this.skip;

  skip(120);

  console.log(this.reader.length);

  const width = (this.width = 128); // 128 * 92
  const height = (this.height = 64);
  const buffer = (this.buffer = []);

  for (let i = 0; i < width * height; ++i) {
    const c = u8();
    buffer.push(c, c, c, 255);
  }
};

GIM.prototype.build = function () {
  this.textures = [
    { image: { data: this.buffer, width: this.width, height: this.height } },
  ];
};
