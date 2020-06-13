/**
 * WEP textures fixed by
 * Oliver Barraza - https://github.com/MercurialForge
 * Thanks!
 */
import { DataTexture, RGBAFormat, NearestFilter } from './three.js';
import { WEPPalette } from './WEPPalette.js';

export class WEPTextureMap {
  constructor(reader) {
    this.reader = reader;
  }

  read(numberOfPalettes, wep) {
    const r = this.reader;

    this.size = r.u32();
    r.skip(1); // TODO unknown, always 1 for WEP; SHP and ZUD may have different values
    this.width = r.u8() * 2;
    this.height = r.u8() * 2;
    this.colorsPerPalette = r.u8();

    this.palettes = [];

    let handle;

    if (wep) {
      handle = new WEPPalette(this.reader);
      handle.read(this.colorsPerPalette / 3);
    }

    for (let i = 0; i < numberOfPalettes; ++i) {
      const palette = new WEPPalette(this.reader);

      if (wep) {
        palette.add(handle.colors);
        palette.read((this.colorsPerPalette / 3) * 2);
      } else {
        palette.read(this.colorsPerPalette);
      }

      this.palettes.push(palette);
    }

    this.map = [];

    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        if (!this.map[x]) this.map[x] = [];

        this.map[x][y] = r.u8();
      }
    }
  }

  build() {
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
  }
}
