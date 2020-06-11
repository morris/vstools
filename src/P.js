import { assert } from './VSTOOLS.js';

export function P(reader) {
  reader.extend(this);
}

P.prototype.read = function () {
  const u8 = this.u8,
    u16 = this.u16;

  this.len = u16();
  this.mode = u16();

  // header
  //console.log( this.mode );
  assert(this.mode >= 1 && this.mode <= 8);
  this.mode2 = u8();
  this.mode3 = u8();
  //console.log( this.mode2 );
  assert(this.mode2 >= 0 && this.mode2 <= 35);
  this.headerLength = u16();
  //console.log(this.headerLength);
  this.mode3 = u16();
  this.mode4 = u16();
  //console.log( this.mode3, this.mode4 );
  //assert( this.mode3 === 8 || this.mode3 === 12 );

  this.header = [];
  while (this.pos() < this.headerLength + 4) {
    const line = [u8(), u8(), u8(), u8()];
    //assert( line[ 1 ], 0 );
    //console.log( line );
    this.header.push(line);
  }

  u16();
};

P.prototype.build = function () {
  this.textures = [
    { image: { data: this.buffer, width: this.width, height: this.height } },
  ];
};
