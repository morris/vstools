import {
  BufferGeometry,
  Skeleton,
  Float32BufferAttribute,
  MeshBasicMaterial,
  SkinnedMesh,
  Bone,
} from './three.js';
import { WEPVertex } from './WEPVertex.js';
import { WEPBone } from './WEPBone.js';
import { WEPFace } from './WEPFace.js';
import { WEPGroup } from './WEPGroup.js';
import { WEPTextureMap } from './WEPTextureMap.js';

export class WEP {
  constructor(reader) {
    this.reader = reader;
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
      this.bones.push(bone);
    }

    for (let i = 0; i < this.numBones; ++i) {
      let bone = this.bones[i];

      // set parent bone
      if (bone.parentId < this.numBones) {
        bone.parentBone = this.bones[bone.parentId];
      }
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
      vertex.group = this.groups[g];
      vertex.boneId = this.groups[g].boneId;

      this.vertices.push(vertex);
    }
  }

  faceSection() {
    const r = this.reader;

    this.faces = [];

    for (let i = 0; i < this.numAllPolygons; ++i) {
      const face = new WEPFace(r);
      face.read();

      this.faces.push(face);
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
    this.buildBones();
    this.buildMesh();
  }

  buildGeometry() {
    const tw = this.textureMap.width;
    const th = this.textureMap.height;

    let iv = 0;
    const index = [];
    const position = [];
    const uv = [];
    const skinWeight = [];
    const skinIndex = [];

    for (let i = 0, l = this.faces.length; i < l; ++i) {
      const f = this.faces[i];

      if (f.quad()) {
        const v1 = this.vertices[f.vertex1];
        const v2 = this.vertices[f.vertex2];
        const v3 = this.vertices[f.vertex3];
        const v4 = this.vertices[f.vertex4];

        position.push(v1.x, v1.y, v1.z);
        position.push(v2.x, v2.y, v2.z);
        position.push(v3.x, v3.y, v3.z);
        position.push(v4.x, v4.y, v4.z);

        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);

        skinIndex.push(v1.boneId, 0, 0, 0);
        skinIndex.push(v2.boneId, 0, 0, 0);
        skinIndex.push(v3.boneId, 0, 0, 0);
        skinIndex.push(v4.boneId, 0, 0, 0);

        uv.push(f.u1 / tw, f.v1 / th);
        uv.push(f.u2 / tw, f.v2 / th);
        uv.push(f.u3 / tw, f.v3 / th);
        uv.push(f.u4 / tw, f.v4 / th);

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

        position.push(v1.x, v1.y, v1.z);
        position.push(v2.x, v2.y, v2.z);
        position.push(v3.x, v3.y, v3.z);

        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);
        skinWeight.push(1, 0, 0, 0);

        skinIndex.push(v1.boneId, 0, 0, 0);
        skinIndex.push(v2.boneId, 0, 0, 0);
        skinIndex.push(v3.boneId, 0, 0, 0);

        uv.push(f.u2 / tw, f.v2 / th);
        uv.push(f.u3 / tw, f.v3 / th);
        uv.push(f.u1 / tw, f.v1 / th);

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
    geometry.computeBoundingSphere();
    geometry.computeVertexNormals();

    this.geometry = geometry;
  }

  buildMaterial() {
    this.textureMap.build();

    this.material = new MeshBasicMaterial({
      map: this.textureMap.textures[0],
      flatShading: true,
      skinning: true,
      transparent: true,
    });
  }

  buildBones() {
    this.skeletonBones = [];

    // binding pose is identity

    // rotation bones
    for (let i = 0; i < this.numBones; ++i) {
      const bone = new Bone();
      bone.name = 'rbone' + i;

      this.skeletonBones.push(bone);
    }

    // translation bones
    for (let i = this.numBones; i < this.numBones * 2; ++i) {
      const bone = new Bone();
      bone.name = 'tbone' + i;

      this.skeletonBones[i - this.numBones].add(bone);
      this.skeletonBones.push(bone);
    }

    // set rotation bone parents
    for (let i = 0; i < this.numBones; ++i) {
      const parentId = this.bones[i].parentId;

      if (parentId < this.numBones) {
        this.skeletonBones[parentId + this.numBones].add(this.skeletonBones[i]);
      }
    }
  }

  buildMesh() {
    this.mesh = new SkinnedMesh(this.geometry, this.material);
    this.skeleton = new Skeleton(this.skeletonBones);

    this.mesh.add(this.skeleton.bones[0]);
    this.mesh.bind(this.skeleton);

    this.mesh.rotation.x = Math.PI;

    // sets length of bones. just for WEP.
    // SHP's animations will override this

    for (let i = 0; i < this.numBones; ++i) {
      const bone = this.bones[i];
      this.mesh.skeleton.bones[i + this.numBones].position.x = bone.length;
    }
  }
}
