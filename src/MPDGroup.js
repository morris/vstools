import { MPDFace } from './MPDFace.js';
import { MPDMesh } from './MPDMesh.js';

export function MPDGroup(reader, mpd) {
  reader.extend(this);

  this.mpd = mpd;

  this.read = function () {
    this.header();
    this.data();
  };

  this.header = function () {
    const u8 = this.u8;

    this.head = [];

    for (let i = 0; i < 64; ++i) {
      this.head[i] = u8();
    }

    // the header is not well understood
    // it seems that the bits in the second byte are flag bits

    // the following fixes the scaling issues in maps 001 and 002
    if ((this.head[1] & 0x08) > 0) {
      this.scale = 1;
    } else {
      this.scale = 8; // TODO is this the default?
    }
  };

  this.data = function () {
    const u32 = this.u32;

    this.triangleCount = u32();
    this.quadCount = u32();
    this.faceCount = this.triangleCount + this.quadCount;

    this.meshes = {};

    for (let i = 0; i < this.triangleCount; ++i) {
      const face = new MPDFace(this.reader, this);
      face.read(false);

      const mesh = this.getMesh(face.textureId, face.clutId);
      mesh.add(face);
    }

    for (let i = this.triangleCount; i < this.faceCount; ++i) {
      const face = new MPDFace(this.reader, this);
      face.read(true); // quad

      const mesh = this.getMesh(face.textureId, face.clutId);
      mesh.add(face);
    }
  };

  this.build = function () {
    for (const id in this.meshes) {
      this.meshes[id].build();
    }
  };

  this.getMesh = function (textureId, clutId) {
    const meshes = this.meshes;
    const id = textureId + '-' + clutId;

    let mesh = meshes[id];

    if (mesh) {
      return mesh;
    } else {
      mesh = new MPDMesh(this.reader, this, textureId, clutId);
      meshes[id] = mesh;
      return mesh;
    }
  };
}
