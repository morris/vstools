VSTOOLS.WEPPolygon = function( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

	this.read = function() {

		var u8 = this.u8, u16 = this.u16, log = this.log;

		var type = this.type = u8(); // 1

		if ( type === 0x2C ) {
			// quad
		} else if ( type === 0x24 ) {
			// triangle
		} else {
			throw new Error( 'unknown poly: ' + VSTOOLS.hex( type ) );
		}

		this.size = u8(); // 2
		this.info = u8(); // 3
		this.skip( 1 ); // always 0; 4

		this.vertex1 = u16() / 4; // 6
		this.vertex2 = u16() / 4; // 8
		this.vertex3 = u16() / 4; // 10

		if ( this.quad() ) {

			this.vertex4 = u16() / 4; // + 2

		}

		this.u1 = u8(); // 11
		this.v1 = u8(); // 12
		this.u2 = u8(); // 13
		this.v2 = u8(); // 14
		this.u3 = u8(); // 15
		this.v3 = u8(); // 16

		if ( this.quad() ) {

			this.u4 = u8(); // + 3
			this.v4 = u8(); // + 4

			//log('  quad(' + this.vertex1 + ',' + this.vertex2 + ',' + this.vertex3 + ',' + this.vertex4 + ')');
			//log('  quad.uv(' + u1 + ',' + v1 + '/' + u2 + ',' + v2 + '/' + u3 + ',' + v3 + '/' + u4 + ',' + v4 + ')');
		} else {
			//log('  triangle(' + this.vertex1 + ',' + this.vertex2 + ',' + this.vertex3 +')');
			// log('  triangle.uv(' + u1 + ',' + v1 + '/' + u2 + ',' + v2 + '/' + u3 + ',' + v3 + ')');
		}

		// tri is 16, quad is 20

	};

	this.quad = function() {

		return this.type === 0x2C;

	};

	this.double = function() {

		return this.info === 0x5;

	};

};
