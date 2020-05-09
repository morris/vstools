/**
 * WEP textures fixed by
 * Oliver Barraza - https://github.com/MercurialForge
 * Thanks!
 */
VSTOOLS.WEPTextureMap = function (reader) {
  reader.extend(this);

  this.read = function (numberOfPalettes, wep) {
    var u8 = this.u8,
      s8 = this.s8,
      u32 = this.u32,
      skip = this.skip;

    var size = (this.size = u32());
    skip(1); // unknown, always 1?
    var width = (this.width = u8() * 2);
    var height = (this.height = u8() * 2);
    var colorsPerPalette = (this.colorsPerPalette = u8());

    var palettes = (this.palettes = []);

    if (wep) {
      var handle = new VSTOOLS.WEPPalette(this.reader);
      handle.read(colorsPerPalette / 3);
    }

    for (var i = 0; i < numberOfPalettes; ++i) {
      var palette = new VSTOOLS.WEPPalette(this.reader);

      if (wep) {
        palette.push(handle.colors);
        palette.read((colorsPerPalette / 3) * 2);
      } else {
        palette.read(colorsPerPalette);
      }

      palettes.push(palette);
    }

    var map = (this.map = []);

    for (var y = 0; y < height; ++y) {
      for (var x = 0; x < width; ++x) {
        if (!map[x]) map[x] = [];

        map[x][y] = u8();
      }
    }
  };

  this.build = function () {
    this.textures = [];

    var width = this.width,
      height = this.height;
    var palettes = this.palettes,
      colorsPerPalette = this.colorsPerPalette;
    var map = this.map;

    for (var i = 0, l = palettes.length; i < l; ++i) {
      var palette = palettes[i];
      var buffer = [];

      for (var y = 0; y < height; ++y) {
        for (var x = 0; x < width; ++x) {
          var c = map[x][y];

          // TODO sometimes c >= colorsPerPalette?? set transparent, for now
          if (c < colorsPerPalette) {
            buffer.push(
              palette.colors[c][0],
              palette.colors[c][1],
              palette.colors[c][2],
              palette.colors[c][3]
            );
          } else {
            buffer.push(0, 0, 0, 0);
          }
        }
      }

      var texture = new THREE.DataTexture(
        new Uint8Array(buffer),
        width,
        height,
        THREE.RGBAFormat
      );
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;

      this.textures.push(texture);
    }
  };
};
