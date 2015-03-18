VSTOOLS.MPDFace = function( reader, logger, group ) {

	reader.extend( this );
	logger.extend( this );

	this.group = group;

	this.read = function( quad ) {

		var s8 = this.s8, u8 = this.u8, s16 = this.s16, u16 = this.u16;

		this.quad = quad;

		// two bytes per axis
		this.p1x = s16();
		this.p1y = s16();
		this.p1z = s16();

		// p2, p3, p4 are stored as offset vectors from p1
		// one byte per axis
		this.p2x = s8();
		this.p2y = s8();
		this.p2z = s8();

		this.p3x = s8();
		this.p3y = s8();
		this.p3z = s8();

		this.r1 = u8();
		this.g1 = u8();
		this.b1 = u8();

		// type
		// 52, 54 triangles
		// 60, 62 quads
		this.type = u8();

		this.r2 = u8();
		this.g2 = u8();
		this.b2 = u8();

		this.u1 = u8();

		this.r3 = u8();
		this.g3 = u8();
		this.b3 = u8();

		this.v1 = u8();
		this.u2 = u8();
		this.v2 = u8();

		this.clutId = u16();

		this.u3 = u8();
		this.v3 = u8();

		this.textureId = s16();

		this.log( this.textureId );

		if ( this.quad ) {

			this.p4x = s8();
			this.p4y = s8();
			this.p4z = s8();

			this.u4 = u8();

			this.r4 = u8();
			this.g4 = u8();
			this.b4 = u8();

			this.v4 = u8();

		}

	};

	this.build = function() {

		this.p1 = new THREE.Vector3( this.p1x, this.p1y, this.p1z );

		this.p2 = new THREE.Vector3(
			this.p2x * this.group.scale + this.p1x,
			this.p2y * this.group.scale + this.p1y,
			this.p2z * this.group.scale + this.p1z
		);

		this.p3 = new THREE.Vector3(
			this.p3x * this.group.scale + this.p1x,
			this.p3y * this.group.scale + this.p1y,
			this.p3z * this.group.scale + this.p1z
		);

		if ( this.quad ) {

			this.p4 = new THREE.Vector3(
				this.p4x * this.group.scale + this.p1x,
				this.p4y * this.group.scale + this.p1y,
				this.p4z * this.group.scale + this.p1z
			);

		}

		var n = this.n = new THREE.Vector3( this.p2x, this.p2y, this.p2z );
		n.cross( new THREE.Vector3( this.p3x, this.p3y, this.p3z ) );
		n.normalize();
		n.negate();

	};

};
