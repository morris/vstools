VSTOOLS.WEPPolygon = function( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

	this.read = function() {

		var u8 = this.u8, u16 = this.u16, log = this.log;

		var type = this.type = u8();

		if ( type === 0x2C ) {
			// quad
		} else if ( type === 0x24 ) {
			// triangle
		} else {
			this.log( "unknown poly: " + VSTOOLS.hex( type ) );
		}

		this.size = u8();
		this.info = u8();
		this.skip( 1 ); // always 0

		this.vertex1 = u16() / 4;
		this.vertex2 = u16() / 4;
		this.vertex3 = u16() / 4;

		if ( this.quad() ) {

			this.vertex4 = u16() / 4;

		}

		this.u1 = u8();
		this.v1 = u8();
		this.u2 = u8();
		this.v2 = u8();
		this.u3 = u8();
		this.v3 = u8();

		if ( this.quad() ) {

			this.u4 = u8();
			this.v4 = u8();

			//log("  quad(" + this.vertex1 + "," + this.vertex2 + "," + this.vertex3 + "," + this.vertex4 + ")");
			//log("  quad.uv(" + u1 + "," + v1 + "/" + u2 + "," + v2 + "/" + u3 + "," + v3 + "/" + u4 + "," + v4 + ")");
		} else {
			//log("  triangle(" + this.vertex1 + "," + this.vertex2 + "," + this.vertex3 +")");
			// log("  triangle.uv(" + u1 + "," + v1 + "/" + u2 + "," + v2 + "/" + u3 + "," + v3 + ")");
		}

	};

	this.quad = function() {

		return this.type === 0x2C;

	};

	this.double = function() {

		return this.info === 0x5;

	};

};
