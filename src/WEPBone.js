export class WEPBone {
  constructor(reader, id) {
    this.reader = reader;
    this.id = id;
  }

  read() {
    const r = this.reader;

    this.length = r.s32();
    this.parentId = r.s8();
    this.groupId = r.s8(); // doubly linked (groups reference bones as well)
    this.mountId = r.u8(); // for mounting weapons etc.
    this.bodyPartId = r.u8();

    // TODO mode
    // 0 - 2 normal ?
    // 3 - 6 normal + roll 90 degrees
    // 7 - 255 absolute, different angles
    // values found in the game: 0, 1, 2, 3, 4, 5, 6, 7, 8
    this.mode = r.s8();

    //console.log(this.id, this.mode, this.length, this.parentId);

    this.u1 = r.u8(); // TODO unknown
    this.u2 = r.u8(); // TODO unknown
    this.u3 = r.u8(); // TODO unknown
    r.padding(4);

    if (this.u1 !== 0 || this.u2 !== 0 || this.u3 !== 0) {
      //console.log(this.id, this.mode, this.u1, this.u2, this.u3);
    }
  }
}
