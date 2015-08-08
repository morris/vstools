VSTOOLS.TIM = function ( reader ) {

	reader.extend( this );

};

VSTOOLS.TIM.prototype.read = function () {

	var u16 = this.u16, u32 = this.u32, buf = this.buffer, skip = this.skip;

	// 12 byte header

	// magic 10 00 00 00
	this.magic = buf( 4 );

	this.bpp = u32(); // always 2
	this.imgLen = u32();

	this.dataLen = this.imgLen - 12;

	// frame buffer positioning
	this.fx = u16();
	this.fy = u16();
	this.width = u16(); // width in frame buffer
	this.height = u16(); // height in frame buffer

	this.dataPtr = this.reader.pos();

	// skip data as we don't know what kind of texture this is
	// will read data on build
	skip( this.dataLen );

};

VSTOOLS.TIM.prototype.copyToFrameBuffer = function ( fb ) {

	var s16 = this.s16, seek = this.seek;

	var fx = this.fx, fy = this.fy;

	seek( this.dataPtr );

	for ( var y = 0; y < this.height; ++y ) {

		for ( var x = 0; x < this.width; ++x ) {

			var c = VSTOOLS.color( s16() );
			fb.setPixel( fx + x, fy + y, c );

		}

	}
};

VSTOOLS.TIM.prototype.markFrameBuffer = function ( fb ) {

	var c = [ 255, Math.random() * 255, Math.random() * 255, Math.random() * 255 ];

	for ( var y = 0; y < this.height; ++y ) {

		for ( var x = 0; x < this.width; ++x ) {

			fb.setPixel( this.fx + x, this.fy + y, c );

		}

	}

};

VSTOOLS.TIM.prototype.buildCLUT = function ( x, y ) {

	var s16 = this.s16, seek = this.seek;

	var ox = x - this.fx;
	var oy = y - this.fy;

	seek( this.dataPtr + ( oy * this.width + ox ) * 2 );

	var buffer = new Uint8Array( 64 );

	for ( var i = 0; i < 64; i += 4 ) {

		var c = VSTOOLS.color( s16() );

		buffer[ i + 0 ] = c[ 0 ];
		buffer[ i + 1 ] = c[ 1 ];
		buffer[ i + 2 ] = c[ 2 ];
		buffer[ i + 3 ] = c[ 3 ];

	}

	return buffer;

};

VSTOOLS.TIM.prototype.build = function ( clut ) {

	var u8 = this.u8, seek = this.seek;

	var width = this.width, height = this.height;

	seek( this.dataPtr );

	var size = width * height * 16;
	var buffer = new Uint8Array( size );

	for ( var i = 0; i < size; i += 8 ) {

		var c = u8();

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

	var texture = new THREE.DataTexture( buffer, width * 4, height, THREE.RGBAFormat );
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.needsUpdate = true;

	return texture;

};
