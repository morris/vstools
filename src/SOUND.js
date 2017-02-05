// SOUND/WAVEXXXX.DAT

VSTOOLS.SOUND = function ( reader ) {

	reader.extend( this );

};

VSTOOLS.SOUND.prototype.read = function () {

	if ( this.reader.length <= 1 ) return;

	this.header();
	this.articulationSection();
	this.sampleSection();

	//console.log( this.length - this.pos() );
	//VSTOOLS.assert( this.pos() === this.length );

};

VSTOOLS.SOUND.prototype.header = function () {

	var u8 = this.u8, s16 = this.s16, u16 = this.u16, u32 = this.u32;
	var assert = VSTOOLS.assert, hex = VSTOOLS.hex;

	assert( u32(), 0x4f414b41 ); // AKAO
	this.id = u16();
	assert( this.id <= 200 );

	assert( u8(), 0 );
	assert( u8(), 0 );

	assert( u32(), 0 );
	assert( u32(), 0 );

	this.a = u8();
	this.b = u8();
	this.c = u8();
	assert( u8(), 0 );

	//console.log( this.a, this.b, this.c );

	assert( this.a === 0 || this.a === 48 );
	assert( this.b === 16 || this.b === 49 || this.b === 81 );
	assert( this.c === 0 || this.c === 2 || this.c === 3 );

	//console.log( this.a );

	this.sampleSectionSize = u32();
	assert( this.sampleSectionSize < this.reader.length );

	this.articulationFirstId = u32();
	this.articulationCount = u32();

	assert( this.articulationFirstId === 0 || this.articulationFirstId === 32 || this.articulationFirstId === 64 );
	assert( this.articulationCount === 32 || this.articulationCount === 48 || this.articulationCount === 64 );

	if ( this.a === 48 ) this.articulationCount = 128;

	assert( u32(), 0 );
	assert( u32(), 0 );
	assert( u32(), 0 );
	assert( u32(), 0 );

	assert( u32(), 0 );
	assert( u32(), 0 );
	assert( u32(), 0 );
	assert( u32(), 0 );

	this.chunkCount = this.dataLength / 16;

};

VSTOOLS.SOUND.prototype.articulationSection = function () {

	var u8 = this.u8, s16 = this.s16, u16 = this.u16, u32 = this.u32;
	var assert = VSTOOLS.assert, hex = VSTOOLS.hex;

	this.articulation = [];
	for ( var i = 0; i < this.articulationCount; ++i ) {
		var entry = {
			sampleOffset: u32(),
			loopPoint: u32(),
			fineTune: s16(),
			unityKey: u16(),
			adsr1: s16(),
			adsr2: s16()
		};

		assert( entry.sampleOffset <= entry.loopPoint );

		this.articulation.push( entry );
	}

	console.log( this.articulation[0] );
	console.log( this.articulation[1] );
	console.log( this.articulation[2] );
	console.log( this.articulation[3] );

	assert( u32(), 0 );
	assert( u32(), 0 );
	assert( u32(), 0 );
	assert( u32(), 0 );

	this.skip( 16 );
};

VSTOOLS.SOUND.prototype.sampleSection = function () {
	this.chunks = [];
	for ( var i = 0; i < this.chunkCount - 5; ++i ) {
		this.chunks.push( this.chunk() );
	}
};

VSTOOLS.SOUND.prototype.chunk = function () {
	var u8 = this.u8, s8 = this.s8;
	var assert = VSTOOLS.assert;

	var a = u8();
	var b = u8();

	var chunk = {
		range: a & 0xF,
		filter: ( a & 0xF0 ) >> 4,
		end: b & 0x1,
		looping: b & 0x2,
		loop: b & 0x4
	};

	for ( var i = 0; i < 14; ++i ) {
		chunk.c.push( s8() );
	}

	return chunk;
};

VSTOOLS.AdpcmCoeff = [
  [ 0.0, 0.0 ],
  [ 60.0 / 64.0, 0.0 ],
  [ 115.0 / 64.0, 52.0 / 64.0 ],
  [ 98.0 / 64.0, 55.0 / 64.0 ],
  [ 122.0 / 64.0, 60.0 / 64.0 ]
];

// from https://github.com/vgmtrans/vgmtrans/blob/fe5b065ad7ebd2880b2428bd8a4fb485f63adf84/src/main/formats/PSXSPU.cpp
VSTOOLS.SOUND.prototype.decompress = function( sample, block, chunk, prev1, prev2 ) {
  var i;
  var t; // Temporary sample
  var f1, f2;
  var p1, p2;
  var coeff = VSTOOLS.AdpcmCoeff;

  var shift = chunk.range + 16; // Shift amount for compressed samples

  for ( i = 0; i < 14; i++ ) {
    pSmp[ i * 2 ] = ( pVBlk.brr[ i ] << 28 ) >> shift;
    pSmp[ i * 2 + 1 ] = ( ( pVBlk.brr[ i ] & 0xF0 ) << 24 ) >> shift;
  }

  // Apply ADPCM decompression
  i = pVBlk.filter;

  if ( i ) {
    f1 = coeff[ i ][ 0 ];
    f2 = coeff[ i ][ 1 ];
    p1 = prev1;
    p2 = prev2;

    for ( i = 0; i < 28; i++ ) {
      t = pSmp[i] + (p1 * f1) - (p2 * f2);
      pSmp[i] = t;
      p2 = p1;
      p1 = t;
    }

    prev1 = p1;
    prev2 = p2;
  }
  else {
    prev2 = pSmp[ 26 ];
    prev1 = pSmp[ 27 ];
  }
};
