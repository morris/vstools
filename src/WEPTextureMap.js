/**
 * WEP textures fixed by
 * Oliver Barraza - https://github.com/MercurialForge
 * Thanks!
 */
import { DataTexture, RGBAFormat, NearestFilter } from './three.js';
import { WEPPalette } from './WEPPalette.js';

export function WEPTextureMap(reader) {
  reader.extend(this);

  this.read = function (numberOfPalettes, wep) {
    const u8 = this.u8,
      u32 = this.u32,
      skip = this.skip;

    this.size = u32();
    skip(1); // unknown, always 1?
    const width = (this.width = u8() * 2);
    const height = (this.height = u8() * 2);
    const colorsPerPalette = (this.colorsPerPalette = u8());

    const palettes = (this.palettes = []);

    let handle;

    if (wep) {
      handle = new WEPPalette(this.reader);
      handle.read(colorsPerPalette / 3);
    }

    for (let i = 0; i < numberOfPalettes; ++i) {
      const palette = new WEPPalette(this.reader);

      if (wep) {
        palette.push(handle.colors);
        palette.read((colorsPerPalette / 3) * 2);
      } else {
        palette.read(colorsPerPalette);
      }

      palettes.push(palette);
    }

    this.map = [];

    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        if (!this.map[x]) this.map[x] = [];

        this.map[x][y] = u8();
      }
    }
  };

  this.build = function () {
    this.textures = [];

    for (let i = 0, l = this.palettes.length; i < l; ++i) {
      const palette = this.palettes[i];
      const buffer = [];

      for (let y = 0; y < this.height; ++y) {
        for (let x = 0; x < this.width; ++x) {
          const c = this.map[x][y];

          // TODO sometimes c >= colorsPerPalette?? set transparent, for now
          if (c < this.colorsPerPalette) {
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

      const texture = new DataTexture(
        new Uint8Array(buffer),
        this.width,
        this.height,
        RGBAFormat
      );
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.needsUpdate = true;

      this.textures.push(texture);
    }
  };
}
