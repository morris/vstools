import { Object3D } from './three.js';
import { MPDGroup } from './MPDGroup.js';

export class MPD {
  constructor(reader, znd) {
    this.reader = reader;
    this.znd = znd;
  }

  read() {
    this.header();
    this.roomHeader();
    this.roomSection();
    //this.clearedSection();
    //this.scriptSection();
  }

  header() {
    const r = this.reader;

    this.ptrRoomSection = r.u32();
    this.lenRoomSection = r.u32();
    this.ptrClearedSection = r.u32();
    this.lenClearedSection = r.u32();
    this.ptrScriptSection = r.u32();
    this.lenScriptSection = r.u32();
    this.ptrDoorSection = r.u32();
    this.lenDoorSection = r.u32();
    this.ptrEnemySection = r.u32();
    this.lenEnemySection = r.u32();
    this.ptrTreasureSection = r.u32();
    this.lenTreasureSection = r.u32();
  }

  roomHeader() {
    const r = this.reader;

    this.lenGeometrySection = r.u32();
    this.lenCollisionSection = r.u32();
    this.lenSubSection03 = r.u32();
    this.lenDoorSectionRoom = r.u32();
    this.lenLightingSection = r.u32();

    this.lenSubSection06 = r.u32();
    this.lenSubSection07 = r.u32();
    this.lenSubSection08 = r.u32();
    this.lenSubSection09 = r.u32();
    this.lenSubSection0A = r.u32();
    this.lenSubSection0B = r.u32();

    this.lenTextureEffectsSection = r.u32();

    this.lenSubSection0D = r.u32();
    this.lenSubSection0E = r.u32();
    this.lenSubSection0F = r.u32();
    this.lenSubSection10 = r.u32();
    this.lenSubSection11 = r.u32();
    this.lenSubSection12 = r.u32();
    this.lenSubSection13 = r.u32();

    this.lenAKAOSubSection = r.u32();

    this.lenSubSection15 = r.u32();
    this.lenSubSection16 = r.u32();
    this.lenSubSection17 = r.u32();
    this.lenSubSection18 = r.u32();
  }

  roomSection() {
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
  }

  geometrySection() {
    const r = this.reader;

    this.numGroups = r.u32();
    this.groups = [];

    for (let i = 0; i < this.numGroups; ++i) {
      this.groups[i] = new MPDGroup(this.reader, this);
      this.groups[i].header();
    }

    for (let i = 0; i < this.numGroups; ++i) {
      this.groups[i].data();
    }
  }

  collisionSection() {
    this.reader.skip(this.lenCollisionSection);
  }

  SubSection03() {
    this.reader.skip(this.lenSubSection03);
  }

  doorSectionRoom() {
    this.reader.skip(this.lenDoorSectionRoom);
  }

  lightingSection() {
    this.reader.skip(this.lenLightingSection);
  }

  SubSection06() {
    this.reader.skip(this.lenSubSection06);
  }

  SubSection07() {
    this.reader.skip(this.lenSubSection07);
  }

  SubSection08() {
    this.reader.skip(this.lenSubSection08);
  }

  SubSection09() {
    this.reader.skip(this.lenSubSection09);
  }

  SubSection0A() {
    this.reader.skip(this.lenSubSection0A);
  }

  SubSection0B() {
    this.reader.skip(this.lenSubSection0B);
  }

  textureEffectsSection() {
    this.reader.skip(this.lenTextureEffectsSection);
  }

  SubSection0D() {
    this.reader.skip(this.lenSubSection0D);
  }

  SubSection0E() {
    this.reader.skip(this.lenSubSection0E);
  }

  SubSection0F() {
    this.reader.skip(this.lenSubSection0F);
  }

  SubSection10() {
    this.reader.skip(this.lenSubSection10);
  }

  SubSection11() {
    this.reader.skip(this.lenSubSection11);
  }

  SubSection12() {
    this.reader.skip(this.lenSubSection12);
  }

  SubSection13() {
    this.reader.skip(this.lenSubSection13);
  }

  akaoSubSection() {
    this.reader.skip(this.lenAKAOSubSection);
  }

  SubSection15() {
    this.reader.skip(this.lenSubSection15);
  }

  SubSection16() {
    this.reader.skip(this.lenSubSection16);
  }

  SubSection17() {
    this.reader.skip(this.lenSubSection17);
  }

  SubSection18() {
    this.reader.skip(this.lenSubSection18);
  }

  clearedSection() {
    this.reader.skip(this.lenClearedSection);
  }

  scriptSection() {
    const r = this.reader;

    r.u16(); // len

    this.ptrDialogText = r.u16();

    r.skip(this.ptrDialogText);

    const s = r.buffer(700);
    Text.convert(s, 700); // text
  }

  //

  build() {
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
  }

  setMaterial(mat) {
    const groups = this.groups,
      numGroups = this.numGroups;

    for (let i = 0; i < numGroups; ++i) {
      const group = groups[i];

      for (const id in group.meshes) {
        group.meshes[id].mesh.material = mat;
      }
    }
  }
}
