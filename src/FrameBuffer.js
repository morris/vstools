import {
  DataTexture,
  NearestFilter,
  MeshBasicMaterial,
  Mesh,
  BoxGeometry,
  RGBAFormat,
} from './three.js';

const WIDTH = 1024;
const HEIGHT = 512;

export class FrameBuffer {
  constructor() {
    this.buffer = new Uint8Array(WIDTH * HEIGHT * 4);
    this.texture = new DataTexture(this.buffer, WIDTH, HEIGHT, RGBAFormat);
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
  }

  setPixel(x, y, c) {
    const i = (y * WIDTH + x) * 4;

    this.buffer[i + 0] = c[0];
    this.buffer[i + 1] = c[1];
    this.buffer[i + 2] = c[2];
    this.buffer[i + 3] = c[3];

    this.texture.needsUpdate = true;
  }

  build() {
    this.material = new MeshBasicMaterial({
      map: this.texture,
      flatShading: true,
      transparent: false,
    });

    this.mesh = new Mesh(new BoxGeometry(500, 250, 1), this.material);
    this.mesh.position.z = -120;
  }

  // debug

  markCLUT(id) {
    const ilo = id * 64;
    //const ihi = ilo + 64;

    for (let i = ilo; i < ilo + 4; i += 4) {
      this.buffer[i + 0] = 255;
      this.buffer[i + 1] = 0;
      this.buffer[i + 2] = 0;
      this.buffer[i + 3] = 255;
    }

    this.texture.needsUpdate = true;
  }
}
