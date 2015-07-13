VSTOOLS.WEPFace = function ( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

	this.read = function () {

		var u8 = this.u8, u16 = this.u16, log = this.log;

		var type = this.type = u8(); // 1

		if ( type === 0x24 ) {

			// triangle

		} else if ( type === 0x2C ) {

			// quad

		} else {

			throw new Error( 'Unknown face type: ' + VSTOOLS.hex( type ) );

		}

		this.size = u8(); // 2
		this.info = u8(); // 3
		this.u = u8(); // TODO whats this? 4

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

		}

		// size of triangle is 16, quad is 20

	};

	this.quad = function () {

		return this.type === 0x2C;

	};

	this.double = function () {

		return this.info === 0x5;

	};

};
