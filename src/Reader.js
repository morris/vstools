VSTOOLS.Reader = function( data ) {

	var pos = 0;

	function seek( i ) {

		pos = i;

	}

	function skip( i ) {

		pos += i;

	}

	function s8() {

		if ( pos >= data.length ) throw new Error( 'Out of bounds' );

		pos += 1;
		return data[ pos - 1 ];

	}

	function u8() {

		return s8() & 0xff;

	}

	function s16() {

		return u8() | s8() << 8;

	}

	function s16big() {

		return s8() << 8 | u8();

	}

	function u16() {

		return s16() & 0xffff;

	}

	function s32() {

		return u8() | u8() << 8 | u8() << 16 | u8() << 24;

	}

	function u32() {

		// TODO only works if u32 are really all smaller than 0x7fffffff
		return s32();

	}

	function buffer( len ) {

		var arr = new Array( len );

		for ( var i  = 0; i < len; ++i ) {

			arr[ i ] = u8();

		}

		return arr;

	}

	this.extend = function( obj ) {

		obj.reader = this;
		obj.seek = seek;
		obj.skip = skip;
		obj.s8 = s8;
		obj.u8 = u8;
		obj.s16 = s16;
		obj.s16big = s16big;
		obj.u16 = u16;
		obj.s32 = s32;
		obj.u32 = u32;
		obj.buffer = buffer;
		obj.pos = function() { return pos; };

	};

	this.extend( this );

};

VSTOOLS.Reader.test = function() {

	// TODO this test should be more exhaustive. i'm worried there might
	// still be a few bugs here...
	var data = new Int8Array( [ 0x01, 0xff ] );
	var reader = new Reader( data );

	console.log( reader.u8() );
	console.log( reader.s8() );
	reader.seek( 1 );
	console.log( reader.u8() );

	reader.seek( 0 );
	console.log( reader.s16() );

	reader.seek( 0 );
	console.log( reader.s16big() );

	reader.seek( 0 );
	console.log( reader.u16() );

};
