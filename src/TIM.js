import {
  DataTexture,
  RGBAFormat,
  NearestFilter,
  RepeatWrapping,
} from './three.js';
import { color } from './VSTOOLS.js';

export function TIM(reader) {
  reader.extend(this);
}

TIM.prototype.read = function () {
  const u16 = this.u16,
    u32 = this.u32,
    buf = this.buffer,
    skip = this.skip;

  // 12 byte header

  // magic 10 00 00 00
  this.magic = buf(4);

  this.bpp = u32(); // always 2
  this.imgLen = u32();

  this.dataLen = this.imgLen - 12;

  // frame buffer positioning
  this.fx = u16();
  this.fy = u16();
  this.width = u16(); // width in frame buffer
  this.height = u16(); // height in frame buffer

  this.dataPtr = this.reader.pos();

  // skip data as we don't know what kind of texture this is
  // will read data on build
  skip(this.dataLen);
};

TIM.prototype.copyToFrameBuffer = function (fb) {
  const s16 = this.s16,
    seek = this.seek;

  const fx = this.fx,
    fy = this.fy;

  seek(this.dataPtr);

  for (let y = 0; y < this.height; ++y) {
    for (let x = 0; x < this.width; ++x) {
      const c = color(s16());
      fb.setPixel(fx + x, fy + y, c);
    }
  }
};

TIM.prototype.markFrameBuffer = function (fb) {
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
};

TIM.prototype.buildCLUT = function (x, y) {
  const s16 = this.s16,
    seek = this.seek;

  const ox = x - this.fx;
  const oy = y - this.fy;

  seek(this.dataPtr + (oy * this.width + ox) * 2);

  const buffer = new Uint8Array(64);

  for (let i = 0; i < 64; i += 4) {
    const c = color(s16());

    buffer[i + 0] = c[0];
    buffer[i + 1] = c[1];
    buffer[i + 2] = c[2];
    buffer[i + 3] = c[3];
  }

  return buffer;
};

TIM.prototype.build = function (clut) {
  const u8 = this.u8;
  const seek = this.seek;

  const width = this.width;
  const height = this.height;

  seek(this.dataPtr);

  const size = width * height * 16;
  const buffer = new Uint8Array(size);

  for (let i = 0; i < size; i += 8) {
    const c = u8();

    const l = ((c & 0xf0) >> 4) * 4;
    const r = (c & 0x0f) * 4;

    buffer[i + 0] = clut[r + 0];
    buffer[i + 1] = clut[r + 1];
    buffer[i + 2] = clut[r + 2];
    buffer[i + 3] = clut[r + 3];

    buffer[i + 4] = clut[l + 0];
    buffer[i + 5] = clut[l + 1];
    buffer[i + 6] = clut[l + 2];
    buffer[i + 7] = clut[l + 3];
  }

  const texture = new DataTexture(buffer, width * 4, height, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
};
