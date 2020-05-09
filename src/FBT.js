VSTOOLS.FBT = function (reader, fbc) {
  reader.extend(this);
  this.fbc = fbc;
};

VSTOOLS.FBT.prototype.read = function () {
  var u8 = this.u8;

  var width = (this.width = 128);
  var height = (this.height = 256);
  var size = width * height;
  var palette = this.fbc.palette;
  var buffer = (this.buffer = new Uint8Array(size * 4));

  for (var i = 0, j = 0; i < size; ++i) {
    var p = u8();
    var c = palette[p];
    buffer[j + 0] = c[0];
    buffer[j + 1] = c[1];
    buffer[j + 2] = c[2];
    buffer[j + 3] = c[3];

    j += 4;
  }

  this.image = { data: this.buffer, width: this.width, height: this.height };
  this.textures = [{ image: this.image }];
};
