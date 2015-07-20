VSTOOLS.FBT = function ( reader, fbc ) {

	reader.extend( this );
	this.fbc = fbc;

};

VSTOOLS.FBT.prototype.read = function () {

	var u8 = this.u8;

	var width = this.width = 256;
	var height = this.height = 128;
	var size = width * height;
	var palette = this.fbc.palette;
	var buffer = this.buffer = new Uint8Array( size * 4 );

	var j = 0;
	for ( var i = 0; i < size; ++i ) {

		var p = u8();
		var c = palette[ p ];
		//c[ 0 ] = c[ 1 ] = c[ 2 ] = p;
		buffer[ j + 0 ] = c[ 0 ] * 4;
		buffer[ j + 1 ] = c[ 1 ] * 4;
		buffer[ j + 2 ] = c[ 2 ] * 4;
		buffer[ j + 3 ] = c[ 3 ] * 4;

		j += 4;

	}

	this.textures = [
		{ image: { data: this.buffer, width: this.width, height: this.height } }
	];

};
