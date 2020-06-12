import { assert } from './VSTOOLS.js';

export class P {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    this.len = r.u16();
    this.mode = r.u16();

    // header
    //console.log( this.mode );
    assert(this.mode >= 1 && this.mode <= 8);
    this.mode2 = r.u8();
    this.mode3 = r.u8();
    //console.log( this.mode2 );
    assert(this.mode2 >= 0 && this.mode2 <= 35);
    this.headerLength = r.u16();
    //console.log(this.headerLength);
    this.mode3 = r.u16();
    this.mode4 = r.u16();
    //console.log( this.mode3, this.mode4 );
    //assert( this.mode3 === 8 || this.mode3 === 12 );

    this.header = [];
    while (r.pos < this.headerLength + 4) {
      const line = [r.u8(), r.u8(), r.u8(), r.u8()];
      //assert( line[ 1 ], 0 );
      //console.log( line );
      this.header.push(line);
    }

    r.u16();
  }

  build() {
    this.textures = [
      { image: { data: this.buffer, width: this.width, height: this.height } },
    ];
  }
}
