import {
  DataTexture,
  RGBAFormat,
  NearestFilter,
  RepeatWrapping,
} from './three.js';
import { parseColor } from './VSTOOLS.js';

export class TIM {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    // 12 byte header

    // magic 10 00 00 00
    this.magic = r.buffer(4);

    this.bpp = r.u32(); // always 2
    this.imgLen = r.u32();

    this.dataLen = this.imgLen - 12;

    // frame buffer positioning
    this.fx = r.u16();
    this.fy = r.u16();
    this.width = r.u16(); // width in frame buffer
    this.height = r.u16(); // height in frame buffer

    this.dataPtr = r.pos;

    // skip data as we don't know what kind of texture this is
    // will read data on build
    r.skip(this.dataLen);
  }

  copyToFrameBuffer(fb) {
    const r = this.reader;

    const fx = this.fx,
      fy = this.fy;

    r.seek(this.dataPtr);

    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const c = parseColor(r.s16());
        fb.setPixel(fx + x, fy + y, c);
      }
    }
  }

  markFrameBuffer(fb) {
    const c = [
      255,
      Math.random() * 255,
      Math.random() * 255,
      Math.random() * 255,
    ];

    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        fb.setPixel(this.fx + x, this.fy + y, c);
      }
    }
  }

  buildCLUT(x, y) {
    const r = this.reader;

    const ox = x - this.fx;
    const oy = y - this.fy;

    r.seek(this.dataPtr + (oy * this.width + ox) * 2);

    const buffer = new Uint8Array(64);

    for (let i = 0; i < 64; i += 4) {
      const c = parseColor(r.s16());

      buffer[i + 0] = c[0];
      buffer[i + 1] = c[1];
      buffer[i + 2] = c[2];
      buffer[i + 3] = c[3];
    }

    return buffer;
  }

  build(clut) {
    const r = this.reader;

    const width = this.width;
    const height = this.height;

    r.seek(this.dataPtr);

    const size = width * height * 16;
    const buffer = new Uint8Array(size);

    for (let i = 0; i < size; i += 8) {
      const c = r.u8();

      const hi = ((c & 0xf0) >> 4) * 4;
      const lo = (c & 0x0f) * 4;

      buffer[i + 0] = clut[lo + 0];
      buffer[i + 1] = clut[lo + 1];
      buffer[i + 2] = clut[lo + 2];
      buffer[i + 3] = clut[lo + 3];

      buffer[i + 4] = clut[hi + 0];
      buffer[i + 5] = clut[hi + 1];
      buffer[i + 6] = clut[hi + 2];
      buffer[i + 7] = clut[hi + 3];
    }

    const texture = new DataTexture(buffer, width * 4, height, RGBAFormat);
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
  }
}
