VSTOOLS.WEPPalette = function (reader) {
  this.colors = [];

  this.read = function (num) {
    for (var i = 0; i < num; ++i) {
      this.colors.push(VSTOOLS.color(reader.u16()));
    }
  };

  this.push = function (colors) {
    this.colors.push.apply(this.colors, colors);
  };
};
