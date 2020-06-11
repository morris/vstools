import {
  Vector3,
  Float32BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshNormalMaterial,
  LineBasicMaterial,
  LineSegments,
} from './three.js';

export function ARMRoom(reader) {
  reader.extend(this);
}

ARMRoom.prototype.header = function () {
  const u16 = this.u16,
    u32 = this.u32;

  this.u1 = u32();
  this.mapLength = u32();
  this.zoneNumber = u16();
  this.mapNumber = u16();
};

ARMRoom.prototype.graphics = function () {
  const u8 = this.u8,
    s16 = this.s16,
    u32 = this.u32,
    skip = this.skip;

  this.numVertices = u32();
  this.vertices = [];

  for (let i = 0; i < this.numVertices; ++i) {
    this.vertices.push(new Vector3(s16(), s16(), s16()));
    skip(2); // zero padding
  }

  this.numTriangles = u32();
  this.triangles = [];

  for (let i = 0; i < this.numTriangles; ++i) {
    this.triangles.push(readIndices());
  }

  this.numQuads = u32();
  this.quads = [];

  for (let i = 0; i < this.numQuads; ++i) {
    this.quads.push(readIndices());
  }

  this.numFloorLines = u32();
  this.floorLines = [];

  for (let i = 0; i < this.numFloorLines; ++i) {
    this.floorLines.push(readIndices());
  }

  this.numWallLines = u32();
  this.wallLines = [];

  for (let i = 0; i < this.numWallLines; ++i) {
    this.wallLines.push(readIndices());
  }

  this.numDoors = u32();
  this.doors = [];

  for (let i = 0; i < this.numDoors; ++i) {
    this.doors.push(readIndices());
  }

  function readIndices() {
    return [u8(), u8(), u8(), u8()];
  }
};

ARMRoom.prototype.name = function () {
  this.skip(0x24);
  //this.name = text( 0x24 );
};

ARMRoom.prototype.build = function () {
  this.buildMesh();
  this.buildLines();
};

ARMRoom.prototype.buildMesh = function () {
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
};

ARMRoom.prototype.buildLines = function () {
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
};
