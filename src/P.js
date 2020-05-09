VSTOOLS.P = function (reader) {
  reader.extend(this);
};

VSTOOLS.P.prototype.read = function () {
  var u8 = this.u8,
    u16 = this.u16,
    s16big = this.s16big,
    u32 = this.u32,
    skip = this.skip;

  this.len = u16();
  this.mode = u16();

  // header
  //console.log( this.mode );
  VSTOOLS.assert(this.mode >= 1 && this.mode <= 8);
  this.mode2 = u8();
  this.mode3 = u8();
  //console.log( this.mode2 );
  VSTOOLS.assert(this.mode2 >= 0 && this.mode2 <= 35);
  this.headerLength = u16();
  console.log(this.headerLength);
  this.mode3 = u16();
  this.mode4 = u16();
  //console.log( this.mode3, this.mode4 );
  //VSTOOLS.assert( this.mode3 === 8 || this.mode3 === 12 );

  this.header = [];
  while (this.pos() < this.headerLength + 4) {
    var line = [u8(), u8(), u8(), u8()];
    //VSTOOLS.assert( line[ 1 ], 0 );
    //console.log( line );
    this.header.push(line);
  }

  console.log(u16());
};

VSTOOLS.P.prototype.build = function () {
  this.textures = [
    { image: { data: this.buffer, width: this.width, height: this.height } },
  ];
};
