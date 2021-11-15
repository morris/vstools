import {
  BufferGeometry,
  Skeleton,
  Float32BufferAttribute,
  SkinnedMesh,
  Bone,
  VertexColors,
  MeshNormalMaterial,
} from './three.js';
import { newVSMaterial } from './VSTOOLS.js';
import { WEPVertex } from './WEPVertex.js';
import { WEPBone } from './WEPBone.js';
import { WEPFace } from './WEPFace.js';
import { WEPGroup } from './WEPGroup.js';
import { WEPTextureMap } from './WEPTextureMap.js';

export class WEP {
  constructor(reader) {
    this.reader = reader;
    this.version = 1;
  }

  read() {
    this.header();
    this.data();
  }

  header() {
    const r = this.reader;

    this.header1();

    this.texturePtr1 = r.u32() + 0x10;
    r.padding(0x30);
    this.texturePtr = r.u32() + 0x10;
    this.groupPtr = r.u32() + 0x10;
    this.vertexPtr = r.u32() + 0x10;
    this.facePtr = r.u32() + 0x10;
  }

  header1() {
    const r = this.reader;

    // magic 'H01' + 0x00
    r.constant([0x48, 0x30, 0x31, 0x00]);

    this.numBones = r.u8();
    this.numGroups = r.u8();
    this.numTriangles = r.u16();
    this.numQuads = r.u16();
    this.numPolygons = r.u16();
    this.numAllPolygons = this.numTriangles + this.numQuads + this.numPolygons;
  }

  data() {
    this.boneSection();
    this.groupSection();
    this.vertexSection();
    this.faceSection();
    this.textureSection(7, true); // 7 palettes with WEP handle palette
  }

  boneSection() {
    this.bones = [];

    for (let i = 0; i < this.numBones; ++i) {
      let bone = new WEPBone(this.reader, i);
      bone.read();

      this.bones[i] = bone;
    }
  }

  groupSection() {
    this.groups = [];

    for (let i = 0; i < this.numGroups; ++i) {
      const group = new WEPGroup(this.reader, i);
      group.read();

      const bone = this.bones[group.boneId];

      if (group.id !== bone.groupId) {
        throw new Error(`Unexpected group/bone reference`, group, bone);
      }

      this.groups.push(group);
    }
  }

  vertexSection() {
    this.vertices = [];
    this.numVertices = this.groups[this.numGroups - 1].lastVertex;

    let g = 0;

    for (let i = 0; i < this.numVertices; ++i) {
      if (i >= this.groups[g].lastVertex) ++g;

      const vertex = new WEPVertex(this.reader);
      vertex.read();
      vertex.groupId = g;

      this.vertices.push(vertex);
    }
  }

  faceSection() {
    const r = this.reader;
    const pos = r.pos;

    try {
      this.faces = [];

      for (let i = 0; i < this.numAllPolygons; ++i) {
        const face = new WEPFace(r);
        face.read();

        this.faces.push(face);
      }
    } catch (err) {
      if (!err.message.match(/Unknown face type/)) throw err;

      r.seek(pos);
      this.faces = [];
      this.version = 2;

      for (let i = 0; i < this.numAllPolygons; ++i) {
        const face = new WEPFace(r);
        face.readColored();

        this.faces.push(face);
      }
    }
  }

  textureSection(numPalettes, wep) {
    this.textureMap = new WEPTextureMap(this.reader);
    this.textureMap.read(numPalettes, wep);
  }

  //

  build() {
    this.buildGeometry();
    this.buildMaterial();
    this.buildSkeleton();
    this.buildMesh();
  }

  buildGeometry() {
    const tw = this.textureMap.getWidth();
    const th = this.textureMap.height;

    let iv = 0;
    const index = [];
    const position = [];
    const uv = [];
    const skinWeight = [];
    const skinIndex = [];
    const color = [];

    const getOffset = (vertex) => {
      let offset = 0;
      let bone = this.getParentBone(this.groups[vertex.groupId].boneId);

      while (bone) {
        offset += -bone.length;
        bone = this.getParentBone(bone.id);
      }

      return offset;
    };

    const getBoneId = (vertex) => {
      return this.groups[vertex.groupId].boneId;
    };

    for (let i = 0, l = this.faces.length; i < l; ++i) {
      const f = this.faces[i];

      if (f.quad()) {
        const v1 = this.vertices[f.vertex1];
        const v2 = this.vertices[f.vertex2];
        const v3 = this.vertices[f.vertex3];
        const v4 = this.vertices[f.vertex4];

        position.push(v1.x + getOffset(v1), v1.y, v1.z);
        position.push(v2.x + getOffset(v2), v2.y, v2.z);
        position.push(v3.x + getOffset(v3), v3.y, v3.z);
        position.push(v4.x + getOffset(v4), v4.y, v4.z);

        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);

        skinIndex.push(getBoneId(v1), 0, 0, 0);
        skinIndex.push(getBoneId(v2), 0, 0, 0);
        skinIndex.push(getBoneId(v3), 0, 0, 0);
        skinIndex.push(getBoneId(v4), 0, 0, 0);

        uv.push(f.u1 / tw, f.v1 / th);
        uv.push(f.u2 / tw, f.v2 / th);
        uv.push(f.u3 / tw, f.v3 / th);
        uv.push(f.u4 / tw, f.v4 / th);

        color.push(f.r1 / 255, f.g1 / 255, f.b1 / 255);
        color.push(f.r2 / 255, f.g2 / 255, f.b2 / 255);
        color.push(f.r3 / 255, f.g3 / 255, f.b3 / 255);
        color.push(f.r4 / 255, f.g4 / 255, f.b4 / 255);

        index.push(iv + 2, iv + 1, iv + 0);
        index.push(iv + 1, iv + 2, iv + 3);

        if (f.double()) {
          index.push(iv + 0, iv + 1, iv + 2);
          index.push(iv + 3, iv + 2, iv + 1);
        }

        iv += 4;
      } else {
        const v1 = this.vertices[f.vertex1];
        const v2 = this.vertices[f.vertex2];
        const v3 = this.vertices[f.vertex3];

        position.push(v1.x + getOffset(v1), v1.y, v1.z);
        position.push(v2.x + getOffset(v2), v2.y, v2.z);
        position.push(v3.x + getOffset(v3), v3.y, v3.z);

        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);

        skinIndex.push(getBoneId(v1), 0, 0, 0);
        skinIndex.push(getBoneId(v2), 0, 0, 0);
        skinIndex.push(getBoneId(v3), 0, 0, 0);

        uv.push(f.u2 / tw, f.v2 / th);
        uv.push(f.u3 / tw, f.v3 / th);
        uv.push(f.u1 / tw, f.v1 / th);

        color.push(f.r1 / 255, f.g1 / 255, f.b1 / 255);
        color.push(f.r2 / 255, f.g2 / 255, f.b2 / 255);
        color.push(f.r3 / 255, f.g3 / 255, f.b3 / 255);

        index.push(iv + 2, iv + 1, iv + 0);

        if (f.double()) {
          index.push(iv + 0, iv + 1, iv + 2);
        }

        iv += 3;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setIndex(index);
    geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
    geometry.setAttribute(
      'skinWeight',
      new Float32BufferAttribute(skinWeight, 4)
    );
    geometry.setAttribute(
      'skinIndex',
      new Float32BufferAttribute(skinIndex, 4)
    );
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    geometry.setAttribute('color', new Float32BufferAttribute(color, 3));
    geometry.computeBoundingSphere();
    geometry.computeVertexNormals();

    this.geometry = geometry;
  }

  buildMaterial() {
    this.textureMap.build();

    if (!this.textureMap.textures[0]) {
      this.material = new MeshNormalMaterial({
        skinning: true,
      });

      return;
    }

    this.material = newVSMaterial({
      map: this.textureMap.textures[0],
      flatShading: true,
      skinning: true,
      transparent: true,
      alphaTest: 0.1,
      vertexColors: VertexColors,
    });
  }

  buildSkeleton() {
    const skeletonBones = [];

    // create bones
    for (let i = 0; i < this.numBones; ++i) {
      const bone = new Bone();
      bone.name = 'bone' + i;

      skeletonBones.push(bone);
    }

    // set parents and lengths
    for (let i = 0; i < this.numBones; ++i) {
      const parent = this.getParentBone(i);

      if (parent) {
        skeletonBones[parent.id].add(skeletonBones[i]);
        skeletonBones[i].position.x = -parent.length;
      }
    }

    this.skeleton = new Skeleton(skeletonBones);
  }

  buildMesh() {
    this.mesh = new SkinnedMesh(this.geometry, this.material);
    this.mesh.add(this.skeleton.bones[0]);
    this.mesh.bind(this.skeleton);

    // TODO why?
    this.mesh.rotation.x = Math.PI;
  }

  getParentBone(id) {
    const bone = this.bones[id];

    return bone.parentId < this.numBones
      ? this.bones[bone.parentId]
      : undefined;
  }
}
