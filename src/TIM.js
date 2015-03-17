VSTOOLS.TIM = function( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

};

VSTOOLS.TIM.prototype.type = 'TIM';

VSTOOLS.TIM.prototype.read = function() {

	var u32 = this.u32, var buf = this.buffer

	log('-- TIM header');

	// 12 byte header

	// magic 10 00 00 00
	this.magic = buf(4);
	//assert Arrays.equals(magic, new int[] { 0x10, 0, 0, 0 });

	this.bpp = u32();
	this.imgLen = u32();

	this.dataLen = imgLen - 12;

	// frame buffer positioning
	this.fx = u16();
	this.fy = u16();
	this.width = u16(); // width in frame buffer
	this.height = u16(); // height in frame buffer

	this.dataPtr = this.reader.pos();

	log( 'bpp: ' + this.bpp );
	log( 'position: ' + this.fx + ',' + this.fy );
	log( 'size: ' + this.width + 'x' + this.height );

	// skip data as we don't know what kind of texture this is
	// will read data on build
	skip( this.dataLen );
};

VSTOOLS.TIM.prototype.copyToFrameBuffer = function( fb ) {

	this.seek( this.dataPtr );

	for ( var y = 0; y < this.height; ++y ) {

		for ( var x = 0; x < this.width; ++x ) {

			Color c = color();
			fb.setPixel( fx + x, fy + y, c );

		}

	}
};

VSTOOLS.TIM.prototype.markFrameBuffer = function( fb ) {

	for ( var y = 0; y < this.height; ++y ) {

		for ( var x = 0; x < this.width; ++x ) {

			fb.setPixel( this.fx + x, this.fy + y, [ 255, 0, 0, 255 ] );

		}

	}

};

VSTOOLS.TIM.prototype.buildCLUT = function( x, y ) {

	var log = this.log, seek = this.seek;

	var ox = x - this.fx;
	var oy = y - this.fy;

	log( 'clut' );
	log( ox + ', ' + oy );

	seek( this.dataPtr + ( oy * this.width + ox ) * 2 );

	var buffer = new Uint8Array( 64 );

	for ( var i = 0; i < 64; i += 4) {

		var c = color();

		log( c );

		buffer[ i + 0 ] = c[ 0 ];
		buffer[ i + 1 ] = c[ 1 ];
		buffer[ i + 2 ] = c[ 2 ];
		buffer[ i + 3 ] = c[ 3 ];

	}

	return buffer;

};

VSTOOLS.TIM.prototype.buildTexture4 = function( clut ) {

	var s8 = this.s8, seek = this.seek;

	seek( this.dataPtr );

	var size = width * height * 16;
	var buffer = new Uint8Array( size );

	for ( var i = 0; i < size; i += 8 ) {

		var c = s8();

		var l = ( ( c & 0xF0 ) >> 4 ) * 4;
		var r = ( c & 0x0F ) * 4;

		buffer[ i + 0 ] = clut[ r + 0 ];
		buffer[ i + 1 ] = clut[ r + 1 ];
		buffer[ i + 2 ] = clut[ r + 2 ];
		buffer[ i + 3 ] = clut[ r + 3 ];

		buffer[ i + 4 ] = clut[ l + 0 ];
		buffer[ i + 5 ] = clut[ l + 1 ];
		buffer[ i + 6 ] = clut[ l + 2 ];
		buffer[ i + 7 ] = clut[ l + 3 ];

	}

	this.texture = new THREE.DataTexture( buffer, this.width, this.height, THREE.RGBAFormat );
	this.texture.magFilter = THREE.NearestFilter;
	this.texture.minFilter = THREE.NearestFilter;

};
