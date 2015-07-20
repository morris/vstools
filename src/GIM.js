VSTOOLS.GIM = function ( reader ) {

	reader.extend( this );

};

VSTOOLS.GIM.prototype.read = function () {

	var u8 = this.u8, u16 = this.u16, s16big = this.s16big, u32 = this.u32, skip = this.skip;

	skip( 120 );

	console.log( this.reader.length );

	var width = this.width = 128; // 128 * 92
	var height = this.height = 64;
	var buffer = this.buffer = [];

	for ( var i = 0; i < width * height; ++i ) {

		//var c = VSTOOLS.color( u16() );
		//buffer.push( c[ 0 ], c[ 1 ], c[ 2 ], c[ 3 ] );
		var c = u8();
		buffer.push( c, c, c, 255 );

	}

};

VSTOOLS.GIM.prototype.build = function () {

	this.textures = [
		{ image: { data: this.buffer, width: this.width, height: this.height } }
	];

};
