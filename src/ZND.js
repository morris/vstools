import { VertexColors } from './three.js';
import { newVSMaterial } from './VSTOOLS.js';
import { FrameBuffer } from './FrameBuffer.js';
import { TIM } from './TIM.js';

export class ZND {
  constructor(reader) {
    this.reader = reader;
    this.materials = {};
    this.textures = [];
  }

  read() {
    this.header();
    this.data();
  }

  header() {
    const r = this.reader;

    this.mpdPtr = r.u32();
    this.mpdLen = r.u32();
    this.mpdNum = this.mpdLen / 8;
    this.enemyPtr = r.u32();
    this.enemyLen = r.u32();
    this.timPtr = r.u32();
    this.timLen = r.u32();
    this.wave = r.u8();
    r.skip(7); // unknown
  }

  data() {
    this.mpdSection();
    this.enemiesSection();
    this.timSection();
  }

  mpdSection() {
    const r = this.reader;

    this.mpdLBAs = [];
    this.mpdSizes = [];

    for (let i = 0; i < this.mpdNum; ++i) {
      this.mpdLBAs.push(r.u32());
      this.mpdSizes.push(r.u32());
    }
  }

  enemiesSection() {
    this.reader.skip(this.enemyLen);
  }

  timSection() {
    const r = this.reader;

    this.timLen2 = r.u32();
    r.skip(12); // TODO confirm this is 0 for all ZNDs
    this.timNum = r.u32();

    this.frameBuffer = new FrameBuffer();
    this.tims = [];

    for (let i = 0; i < this.timNum; ++i) {
      // tim length not technically part of tim, unused
      r.u32();

      const tim = new TIM(this.reader);
      tim.read();
      tim.id = i;

      //console.log( 'tim', i, ':', tim.width, 'x', tim.height, 'at', tim.fx, tim.fy );

      if (tim.height < 5) {
        tim.copyToFrameBuffer(this.frameBuffer);
      }

      tim.copyToFrameBuffer(this.frameBuffer);

      this.tims.push(tim);
    }
  }

  getTIM(id) {
    const x = (id * 64) % 1024;
    //const y = Math.floor((id * 64) / 1024);

    for (let i = 0; i < this.tims.length; ++i) {
      const tim = this.tims[i];

      if (tim.fx === x) {
        return tim;
      }
    }
  }

  getMaterial(textureId, clutId) {
    const tims = this.tims;
    const id = textureId + '-' + clutId;

    const materials = this.materials;
    let material = materials[id];

    if (material) {
      return material;
    } else {
      // find texture
      const textureTIM = this.getTIM(textureId);

      this.frameBuffer.markCLUT(clutId);

      // find CLUT
      const x = (clutId * 16) % 1024;
      const y = Math.floor((clutId * 16) / 1024);

      //console.log( x, y );

      let clut = null;

      for (let i = 0, l = tims.length; i < l; ++i) {
        const tim = tims[i];

        if (
          tim.fx <= x &&
          tim.fx + tim.width > x &&
          tim.fy <= y &&
          tim.fy + tim.height > y
        ) {
          // we found the CLUT
          clut = tim.buildCLUT(x, y);
          break;
        }
      }

      const texture = textureTIM.build(clut);
      texture.title = id;

      this.textures.push(texture);

      // build texture
      material = newVSMaterial({
        map: texture,
        flatShading: true,
        transparent: true,
        vertexColors: VertexColors,
        alphaTest: 0.1,
      });

      // cache
      materials[id] = material;

      return material;
    }
  }
}
