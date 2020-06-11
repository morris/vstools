import { Object3D } from './three.js';
import { ARMRoom } from './ARMRoom.js';

export function ARM(reader) {
  reader.extend(this);
}

ARM.prototype.read = function () {
  const u32 = this.u32;

  this.numRooms = u32();
  this.rooms = [];

  // headers
  for (let i = 0; i < this.numRooms; ++i) {
    const room = new ARMRoom(this.reader);
    room.header();
    this.rooms.push(room);
  }

  // graphics
  for (let i = 0; i < this.numRooms; ++i) {
    this.rooms[i].graphics();
  }

  // names
  for (let i = 0; i < this.numRooms; ++i) {
    this.rooms[i].name();
  }
};

ARM.prototype.build = function () {
  this.object = new Object3D();

  for (let i = 0; i < this.numRooms; ++i) {
    const room = this.rooms[i];
    room.build();
    this.object.add(room.mesh);
    this.object.add(room.lines);
  }

  this.object.rotation.x = Math.PI;
};
