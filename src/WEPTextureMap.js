/**
 * WEP textures fixed by
 * Oliver Barraza - https://github.com/MercurialForge
 * Thanks!
 */
import {
  DataTexture,
  RGBAFormat,
  NearestFilter,
  RepeatWrapping,
} from './three.js';
import { WEPPalette } from './WEPPalette.js';

export class WEPTextureMap {
  constructor(reader) {
    this.reader = reader;
  }

  read(numberOfPalettes, wep) {
    const r = this.reader;

    this.size = r.u32();

    // version
    // always 1 for WEP
    // SHP and ZUD may have different values
    // 16 is notably used for SHPs with vertex colors, e.g. 3A.SHP (Wyvern)
    // other values usually imply width = height = cpp = 0
    this.version = r.u8();

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
      const texture =
        this.version === 1
          ? this.buildV1(palette)
          : this.version === 16
          ? this.buildV16(palette)
          : null; // TODO

      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.needsUpdate = true;

      this.textures.push(texture);
    }
  }

  buildV1(palette) {
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

    return new DataTexture(
      new Uint8Array(buffer),
      this.width,
      this.height,
      RGBAFormat
    );
  }

  buildV16(palette) {
    const buffer = [];

    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const c = this.map[x][y];

        const hi = c >> 4;
        const lo = c & 0xf;

        // TODO sometimes c >= colorsPerPalette?? set transparent, for now
        if (lo < this.colorsPerPalette) {
          buffer.push(
            palette.colors[lo][0],
            palette.colors[lo][1],
            palette.colors[lo][2],
            palette.colors[lo][3]
          );
        } else {
          buffer.push(0, 0, 0, 0);
        }

        if (hi < this.colorsPerPalette) {
          buffer.push(
            palette.colors[hi][0],
            palette.colors[hi][1],
            palette.colors[hi][2],
            palette.colors[hi][3]
          );
        } else {
          buffer.push(0, 0, 0, 0);
        }
      }
    }

    return new DataTexture(
      new Uint8Array(buffer),
      this.width * 2,
      this.height,
      RGBAFormat
    );
  }

  getWidth() {
    return this.version === 16 ? this.width * 2 : this.width;
  }
}
