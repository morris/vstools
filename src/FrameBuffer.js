import {
  DataTexture,
  NearestFilter,
  MeshBasicMaterial,
  Mesh,
  BoxGeometry,
  RGBAFormat,
} from './three.js';

export function FrameBuffer() {
  const width = 1024;
  const height = 512;

  this.buffer = new Uint8Array(width * height * 4);

  this.texture = new DataTexture(this.buffer, width, height, RGBAFormat);
  this.texture.magFilter = NearestFilter;
  this.texture.minFilter = NearestFilter;

  this.setPixel = function (x, y, c) {
    const buffer = this.buffer;
    const i = (y * width + x) * 4;

    buffer[i + 0] = c[0];
    buffer[i + 1] = c[1];
    buffer[i + 2] = c[2];
    buffer[i + 3] = c[3];

    this.texture.needsUpdate = true;
  };

  this.build = function () {
    this.material = new MeshBasicMaterial({
      map: this.texture,
      flatShading: true,
      transparent: false,
    });

    //this.material = new MeshNormalMaterial();

    this.mesh = new Mesh(new BoxGeometry(500, 250, 1), this.material);
    this.mesh.position.z = -120;
  };

  // debug

  this.markCLUT = function (id) {
    const buffer = this.buffer;
    const ilo = id * 64;
    //const ihi = ilo + 64;

    for (let i = ilo; i < ilo + 4; i += 4) {
      buffer[i + 0] = 255;
      buffer[i + 1] = 0;
      buffer[i + 2] = 0;
      buffer[i + 3] = 255;
    }

    this.texture.needsUpdate = true;
  };
}
