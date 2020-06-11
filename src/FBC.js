export function FBC(reader) {
  reader.extend(this);
}

FBC.prototype.read = function () {
  const u16 = this.u16;

  const palette = (this.palette = []);

  for (let i = 0; i < 256; ++i) {
    const c = this.color(u16());
    palette.push(c);
  }
};

FBC.prototype.color = function (c) {
  //const a = (c & 0x8000) >> 15;
  const b = (c & 0x7c00) >> 10;
  const g = (c & 0x03e0) >> 5;
  const r = c & 0x001f;

  // 5bit -> 8bit is factor 2^3 = 8
  const f = 8;
  return [r * f, g * f, b * f, 255];
};
