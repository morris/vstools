import { MPDFace } from './MPDFace.js';
import { MPDMesh } from './MPDMesh.js';

export class MPDGroup {
  constructor(reader, mpd) {
    this.reader = reader;
    this.mpd = mpd;
  }

  read() {
    this.header();
    this.data();
  }

  header() {
    const r = this.reader;

    this.head = [];

    for (let i = 0; i < 64; ++i) {
      this.head[i] = r.u8();
    }

    // the header is not well understood
    // it seems that the bits in the second byte are flag bits

    // the following fixes the scaling issues in maps 001 and 002
    if ((this.head[1] & 0x08) > 0) {
      this.scale = 1;
    } else {
      this.scale = 8; // TODO is this the default?
    }
  }

  data() {
    const r = this.reader;

    this.triangleCount = r.u32();
    this.quadCount = r.u32();
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
  }

  build() {
    for (const id in this.meshes) {
      this.meshes[id].build();
    }
  }

  getMesh(textureId, clutId) {
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
  }
}
