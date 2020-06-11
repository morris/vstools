import { Object3D } from './three.js';
import { MPDGroup } from './MPDGroup.js';

export function MPD(reader, znd) {
  reader.extend(this);

  this.znd = znd;
}

MPD.prototype.read = function () {
  this.header();
  this.roomHeader();
  this.roomSection();
  //this.clearedSection();
  //this.scriptSection();
};

MPD.prototype.header = function () {
  const u32 = this.u32;

  this.ptrRoomSection = u32();
  this.lenRoomSection = u32();
  this.ptrClearedSection = u32();
  this.lenClearedSection = u32();
  this.ptrScriptSection = u32();
  this.lenScriptSection = u32();
  this.ptrDoorSection = u32();
  this.lenDoorSection = u32();
  this.ptrEnemySection = u32();
  this.lenEnemySection = u32();
  this.ptrTreasureSection = u32();
  this.lenTreasureSection = u32();
};

MPD.prototype.roomHeader = function () {
  const u32 = this.u32;

  this.lenGeometrySection = u32();
  this.lenCollisionSection = u32();
  this.lenSubSection03 = u32();
  this.lenDoorSectionRoom = u32();
  this.lenLightingSection = u32();

  this.lenSubSection06 = u32();
  this.lenSubSection07 = u32();
  this.lenSubSection08 = u32();
  this.lenSubSection09 = u32();
  this.lenSubSection0A = u32();
  this.lenSubSection0B = u32();

  this.lenTextureEffectsSection = u32();

  this.lenSubSection0D = u32();
  this.lenSubSection0E = u32();
  this.lenSubSection0F = u32();
  this.lenSubSection10 = u32();
  this.lenSubSection11 = u32();
  this.lenSubSection12 = u32();
  this.lenSubSection13 = u32();

  this.lenAKAOSubSection = u32();

  this.lenSubSection15 = u32();
  this.lenSubSection16 = u32();
  this.lenSubSection17 = u32();
  this.lenSubSection18 = u32();
};

MPD.prototype.roomSection = function () {
  this.geometrySection();
  this.collisionSection();
  this.SubSection03();
  this.doorSectionRoom();
  this.lightingSection();
  this.SubSection06();
  this.SubSection07();
  this.SubSection08();
  this.SubSection09();
  this.SubSection0A();
  this.SubSection0B();
  this.textureEffectsSection();
  this.SubSection0D();
  this.SubSection0E();
  this.SubSection0F();
  this.SubSection10();
  this.SubSection11();
  this.SubSection12();
  this.SubSection13();
  this.akaoSubSection();
  this.SubSection15();
  this.SubSection16();
  this.SubSection17();
  this.SubSection18();
};

MPD.prototype.geometrySection = function () {
  const u32 = this.u32;

  this.numGroups = u32();
  this.groups = [];

  for (let i = 0; i < this.numGroups; ++i) {
    this.groups[i] = new MPDGroup(this.reader, this);
    this.groups[i].header();
  }

  for (let i = 0; i < this.numGroups; ++i) {
    this.groups[i].data();
  }
};

MPD.prototype.collisionSection = function () {
  this.skip(this.lenCollisionSection);
};

MPD.prototype.SubSection03 = function () {
  this.skip(this.lenSubSection03);
};

MPD.prototype.doorSectionRoom = function () {
  this.skip(this.lenDoorSectionRoom);
};

MPD.prototype.lightingSection = function () {
  this.skip(this.lenLightingSection);
};

MPD.prototype.SubSection06 = function () {
  this.skip(this.lenSubSection06);
};

MPD.prototype.SubSection07 = function () {
  this.skip(this.lenSubSection07);
};

MPD.prototype.SubSection08 = function () {
  this.skip(this.lenSubSection08);
};

MPD.prototype.SubSection09 = function () {
  this.skip(this.lenSubSection09);
};

MPD.prototype.SubSection0A = function () {
  this.skip(this.lenSubSection0A);
};

MPD.prototype.SubSection0B = function () {
  this.skip(this.lenSubSection0B);
};

MPD.prototype.textureEffectsSection = function () {
  this.skip(this.lenTextureEffectsSection);
};

MPD.prototype.SubSection0D = function () {
  this.skip(this.lenSubSection0D);
};

MPD.prototype.SubSection0E = function () {
  this.skip(this.lenSubSection0E);
};

MPD.prototype.SubSection0F = function () {
  this.skip(this.lenSubSection0F);
};

MPD.prototype.SubSection10 = function () {
  this.skip(this.lenSubSection10);
};

MPD.prototype.SubSection11 = function () {
  this.skip(this.lenSubSection11);
};

MPD.prototype.SubSection12 = function () {
  this.skip(this.lenSubSection12);
};

MPD.prototype.SubSection13 = function () {
  this.skip(this.lenSubSection13);
};

MPD.prototype.akaoSubSection = function () {
  this.skip(this.lenAKAOSubSection);
};

MPD.prototype.SubSection15 = function () {
  this.skip(this.lenSubSection15);
};

MPD.prototype.SubSection16 = function () {
  this.skip(this.lenSubSection16);
};

MPD.prototype.SubSection17 = function () {
  this.skip(this.lenSubSection17);
};

MPD.prototype.SubSection18 = function () {
  this.skip(this.lenSubSection18);
};

MPD.prototype.clearedSection = function () {
  this.skip(this.lenClearedSection);
};

MPD.prototype.scriptSection = function () {
  const u16 = this.u16,
    buffer = this.buffer;

  u16(); // len

  this.ptrDialogText = u16();

  this.skip(this.ptrDialogText);

  const s = buffer(700);
  Text.convert(s, 700); // text
};

//

MPD.prototype.build = function () {
  const groups = this.groups,
    numGroups = this.numGroups;

  this.mesh = new Object3D();

  for (let i = 0; i < numGroups; ++i) {
    const group = groups[i];
    group.build();

    for (const id in group.meshes) {
      this.mesh.add(group.meshes[id].mesh);
    }
  }
};

MPD.prototype.setMaterial = function (mat) {
  const groups = this.groups,
    numGroups = this.numGroups;

  for (let i = 0; i < numGroups; ++i) {
    const group = groups[i];

    for (const id in group.meshes) {
      group.meshes[id].mesh.material = mat;
    }
  }
};
