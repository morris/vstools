import { MeshBasicMaterial, VertexColors } from './three.js';
import { FrameBuffer } from './FrameBuffer.js';
import { TIM } from './TIM.js';

export function ZND(reader) {
  reader.extend(this);

  this.materials = {};
  this.textures = [];
}

ZND.prototype.read = function () {
  this.header();
  this.data();
};

ZND.prototype.header = function () {
  const u8 = this.u8,
    u32 = this.u32,
    skip = this.skip;

  this.mpdPtr = u32();
  this.mpdLen = u32();
  this.mpdNum = this.mpdLen / 8;
  this.enemyPtr = u32();
  this.enemyLen = u32();
  this.timPtr = u32();
  this.timLen = u32();
  this.wave = u8();
  skip(7); // unknown
};

ZND.prototype.data = function () {
  this.mpdSection();
  this.enemiesSection();
  this.timSection();
};

ZND.prototype.mpdSection = function () {
  const u32 = this.u32;

  this.mpdLBAs = [];
  this.mpdSizes = [];

  for (let i = 0; i < this.mpdNum; ++i) {
    this.mpdLBAs.push(u32());
    this.mpdSizes.push(u32());
  }
};

ZND.prototype.enemiesSection = function () {
  this.skip(this.enemyLen);
};

ZND.prototype.timSection = function () {
  const u32 = this.u32,
    skip = this.skip;

  this.timLen2 = u32();
  skip(12); // TODO confirm this is 0 for all ZNDs
  this.timNum = u32();

  this.frameBuffer = new FrameBuffer();
  this.tims = [];

  for (let i = 0; i < this.timNum; ++i) {
    // tim length not technically part of tim, unused
    u32();

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
};

ZND.prototype.getTIM = function (id) {
  const x = (id * 64) % 1024;
  //const y = Math.floor((id * 64) / 1024);

  for (let i = 0; i < this.tims.length; ++i) {
    const tim = this.tims[i];

    if (tim.fx === x) {
      return tim;
    }
  }
};

ZND.prototype.getMaterial = function (textureId, clutId) {
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
    material = new MeshBasicMaterial({
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
};
