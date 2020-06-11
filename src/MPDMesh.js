import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshNormalMaterial,
} from './three.js';

export function MPDMesh(reader, group, textureId, clutId) {
  reader.extend(this);

  this.group = group;
  this.textureId = textureId;
  this.clutId = clutId;
  this.faces = [];

  this.add = function (face) {
    this.faces.push(face);
  };

  this.build = function () {
    const tw = 256;
    const th = 256;

    const position = [];
    const color = [];
    const uv = [];
    const normal = [];
    const index = [];

    let iv = 0;

    for (let i = 0, l = this.faces.length; i < l; ++i) {
      const f = this.faces[i];

      f.build();

      if (f.quad) {
        position.push(
          f.p1.x,
          f.p1.y,
          f.p1.z,
          f.p2.x,
          f.p2.y,
          f.p2.z,
          f.p3.x,
          f.p3.y,
          f.p3.z,
          f.p4.x,
          f.p4.y,
          f.p4.z
        );

        color.push(
          f.r1 / 255,
          f.g1 / 255,
          f.b1 / 255,
          f.r2 / 255,
          f.g2 / 255,
          f.b2 / 255,
          f.r3 / 255,
          f.g3 / 255,
          f.b3 / 255,
          f.r4 / 255,
          f.g4 / 255,
          f.b4 / 255
        );

        uv.push(
          f.u2 / tw,
          f.v2 / th,
          f.u3 / tw,
          f.v3 / th,
          f.u1 / tw,
          f.v1 / th,
          f.u4 / tw,
          f.v4 / th
        );

        normal.push(
          f.n.x,
          f.n.y,
          f.n.z,
          f.n.x,
          f.n.y,
          f.n.z,
          f.n.x,
          f.n.y,
          f.n.z,
          f.n.x,
          f.n.y,
          f.n.z
        );

        index.push(iv + 2, iv + 1, iv + 0);
        index.push(iv + 1, iv + 2, iv + 3);

        iv += 4;
      } else {
        position.push(
          f.p1.x,
          f.p1.y,
          f.p1.z,
          f.p2.x,
          f.p2.y,
          f.p2.z,
          f.p3.x,
          f.p3.y,
          f.p3.z
        );

        color.push(
          f.r1 / 255,
          f.g1 / 255,
          f.b1 / 255,
          f.r2 / 255,
          f.g2 / 255,
          f.b2 / 255,
          f.r3 / 255,
          f.g3 / 255,
          f.b3 / 255
        );

        uv.push(
          f.u2 / tw,
          f.v2 / th,
          f.u3 / tw,
          f.v3 / th,
          f.u1 / tw,
          f.v1 / th
        );

        normal.push(
          f.n.x,
          f.n.y,
          f.n.z,
          f.n.x,
          f.n.y,
          f.n.z,
          f.n.x,
          f.n.y,
          f.n.z
        );

        index.push(iv + 2, iv + 1, iv + 0);

        iv += 3;
      }
    }

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(position, 3)
    );
    this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3));
    this.geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    this.geometry.setAttribute('normal', new Float32BufferAttribute(normal, 3));
    this.geometry.setIndex(index);

    if (this.group && this.group.mpd && this.group.mpd.znd) {
      this.material = this.group.mpd.znd.getMaterial(
        this.textureId,
        this.clutId
      );
    } else {
      this.material = new MeshNormalMaterial();
    }

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.rotation.x = Math.PI;
    this.mesh.scale.set(0.1, 0.1, 0.1);
  };
}
