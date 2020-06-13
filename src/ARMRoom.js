import {
  Vector3,
  Float32BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshNormalMaterial,
  LineBasicMaterial,
  LineSegments,
} from './three.js';

export class ARMRoom {
  constructor(reader) {
    this.reader = reader;
  }

  header() {
    const r = this.reader;

    this.u1 = r.u32();
    this.mapLength = r.u32();
    this.zoneNumber = r.u16();
    this.mapNumber = r.u16();
  }

  graphics() {
    const r = this.reader;

    this.numVertices = r.u32();
    this.vertices = [];

    for (let i = 0; i < this.numVertices; ++i) {
      this.vertices.push(new Vector3(r.s16(), r.s16(), r.s16()));
      r.padding(2);
    }

    this.numTriangles = r.u32();
    this.triangles = [];

    for (let i = 0; i < this.numTriangles; ++i) {
      this.triangles.push(readIndices());
    }

    this.numQuads = r.u32();
    this.quads = [];

    for (let i = 0; i < this.numQuads; ++i) {
      this.quads.push(readIndices());
    }

    this.numFloorLines = r.u32();
    this.floorLines = [];

    for (let i = 0; i < this.numFloorLines; ++i) {
      this.floorLines.push(readIndices());
    }

    this.numWallLines = r.u32();
    this.wallLines = [];

    for (let i = 0; i < this.numWallLines; ++i) {
      this.wallLines.push(readIndices());
    }

    this.numDoors = r.u32();
    this.doors = [];

    for (let i = 0; i < this.numDoors; ++i) {
      this.doors.push(readIndices());
    }

    function readIndices() {
      return [r.u8(), r.u8(), r.u8(), r.u8()];
    }
  }

  name() {
    this.reader.skip(0x24); // TODO
    //this.name = text( 0x24 );
  }

  build() {
    this.buildMesh();
    this.buildLines();
  }

  buildMesh() {
    const position = [];
    const normal = [];
    const index = [];

    let iv = 0;

    for (let i = 0; i < this.numTriangles; ++i) {
      const p = this.triangles[i];

      const v1 = this.vertices[p[0]];
      const v2 = this.vertices[p[1]];
      const v3 = this.vertices[p[2]];

      position.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);

      const n = new Vector3().subVectors(v2, v1);
      n.cross(new Vector3().subVectors(v3, v1));
      n.normalize();
      n.negate();

      normal.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);

      index.push(iv + 2, iv + 1, iv + 0);

      iv += 3;
    }

    for (let i = 0; i < this.numQuads; ++i) {
      const p = this.quads[i];

      const v1 = this.vertices[p[0]];
      const v2 = this.vertices[p[1]];
      const v3 = this.vertices[p[2]];
      const v4 = this.vertices[p[3]];

      position.push(
        v1.x,
        v1.y,
        v1.z,
        v2.x,
        v2.y,
        v2.z,
        v3.x,
        v3.y,
        v3.z,
        v4.x,
        v4.y,
        v4.z
      );

      const n = new Vector3().subVectors(v2, v1);
      n.cross(new Vector3().subVectors(v3, v1));
      n.normalize();
      n.negate();

      normal.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);

      index.push(iv + 2, iv + 1, iv + 0);
      index.push(iv + 0, iv + 3, iv + 2);

      iv += 4;
    }

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(position, 3)
    );
    this.geometry.setAttribute('normal', new Float32BufferAttribute(normal, 3));
    this.geometry.setIndex(index);

    this.material = new MeshNormalMaterial();
    this.mesh = new Mesh(this.geometry, this.material);
  }

  buildLines() {
    const position = [];
    const index = [];

    let iv = 0;

    for (let i = 0; i < this.numFloorLines; ++i) {
      const p = this.floorLines[i];

      const v1 = this.vertices[p[0]];
      const v2 = this.vertices[p[1]];

      position.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

      index.push(iv + 0, iv + 1);

      iv += 2;
    }

    for (let i = 0; i < this.numWallLines; ++i) {
      const p = this.wallLines[i];

      const v1 = this.vertices[p[0]];
      const v2 = this.vertices[p[1]];

      position.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

      index.push(iv + 0, iv + 1);

      iv += 2;
    }

    this.lineGeometry = new BufferGeometry();
    this.lineGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(position, 3)
    );
    this.lineGeometry.setIndex(index);

    this.lineMaterial = new LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
    });
    this.lines = new LineSegments(this.lineGeometry, this.lineMaterial);
  }
}
