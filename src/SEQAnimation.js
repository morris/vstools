VSTOOLS.SEQAnimation = function( reader, logger, seq ) {

	reader.extend( this );
	logger.extend( this );

	this.seq = seq;

};

VSTOOLS.SEQAnimation.prototype.header = function( id ) {

	var u8 = this.u8, s8 = this.s8, u16 = this.u16,
		skip = this.skip, hex = VSTOOLS.hex, log = this.log;

	var seq = this.seq;
	var i;

	this.id = id;
	this.numFrames = u16(); // not sure about this. 2

	// some animations use a different animation as base
	this.idOtherAnimation = s8(); // 3

	VSTOOLS.assert( this.idOtherAnimation >= -1 && this.idOtherAnimation < seq.numAnimations );

	this.mode = u8(); // unknown. has weird effects on mesh. 4

	// seems to point to an opcode block that controls looping
	this.ptr1 = u16(); // 6

	// points to a translation vector for the animated mesh
	this.ptrTranslation = u16(); // 8

	// points to an opcode block that controls movement
	this.ptrMove = u16(); // 10

	// just some logging
	log( 'animation ' + this.id );
	log( 'numFrames: ' + this.numFrames );
	log( 'idOtherPose: ' + this.idOtherAnimation );
	log( 'mode: ' + this.mode );
	log( 'ptr1: ' + hex( seq.ptrData( this.ptr1 ) ) + ' (' + this.ptr1 + ')' );
	log( 'ptrTranslation: ' + hex( seq.ptrData( this.ptrTranslation ) ) + ' (' + this.ptrTranslation + ')' );
	log('ptrMove: ' + hex( seq.ptrData( this.ptrMove ) ) + ' (' + this.ptrMove + ')' );

	// read pointers to rotations and opcodes for individual joints
	this.ptrJoints = [];

	for ( i = 0; i < seq.numJoints; ++i ) {

		var ptr = u16();
		this.ptrJoints.push( ptr );
		log( i + ' ' + hex( seq.ramPtr + seq.ptrData( ptr ) ) );

	} // 10 + numJoints * 2

	for ( i = 0; i < seq.numJoints; ++i ) {

		// TODO is this true for all SEQ?
		//VSTOOLS.assert( u16() === 0 );
		skip( 2 );

	} // 10 + numJoints * 4

};

VSTOOLS.SEQAnimation.prototype.compute = function() {

	var u8 = this.u8, s8 = this.s8, u16 = this.u16, s16big = this.s16big,
		skip = this.skip, seek = this.seek, hex = VSTOOLS.hex, log = this.log;

	var seq = this.seq;
	var shp = seq.shp;

	log( '----' );
	log( 'computing animation ' + this.id );

	// read translation
	// big endian
	seek( seq.ptrData( this.ptrTranslation ) );

	x = s16big();
	y = s16big();
	z = s16big();

	log( 'translation ' + x + ' ' + y + ' ' + z );

	// TODO implement move

	// initialize joint rotations
	this.quaternions = [];

	// set base animation
	this.base = this;
	if ( this.idOtherAnimation !== -1 ) {

		this.base = seq.animations[ this.idOtherAnimation ];

	}

	var tracks = this.tracks = [];

	// read base pose and opcodes
	// add to tracks for rotation bones
	for ( var i = 0; i < seq.numJoints; ++i ) {

		tracks.push( { keys: [] } );

		seek( seq.ptrData( this.base.ptrJoints[ i ] ) );

		this.pose( i );
		this.opcodes( i );

	}

	// root's translation bone
	tracks.push( {
		keys: [
			{
				time: 0,
				pos: [ 0, 0, 0 ],
				rot: [ 0, 0, 0, 1 ],
				scl: [ 1, 1, 1 ]
			}
		]
	} );

	// translation bones
	for ( var i = 1; i < seq.numJoints; ++i) {

		tracks.push( {
			keys: [
				{
					time: 0,
					pos: [ shp.joints[i].length, 0, 0 ],
					rot: [ 0, 0, 0, 1 ],
					scl: [ 1, 1, 1 ]
				}
			]
		} );

	}

	/*if ( this.id === 0 )
		console.log( this.tracks );*/

};

VSTOOLS.SEQAnimation.prototype.pose = function( i ) {

	var s16big = this.s16big, convert = VSTOOLS.rot13toRad, log = this.log;

	// big endian! but... WHY?!
	var rx = s16big(),
		ry = s16big(),
		rz = s16big();

	log( 'rotation ' + i + ': ' + rx + ' ' + ry + ' ' + rz );

	rx = convert( rx ),
	ry = convert( ry ),
	rz = convert( rz );

	var q = this.quaternions[i] = VSTOOLS.rot2quat( rx, ry, rz );

	this.tracks[i].keys.unshift( {
		time: 0,
		pos: [ 0, 0, 0 ],
		rot: [ q.x, q.y, q.z, q.w ],
		scl: [ 1, 1, 1, 1 ]
	} );

};

VSTOOLS.SEQAnimation.prototype.opcodes = function( i ) {

	var u8 = this.u8, s8 = this.s8, s16big = this.s16big,
		skip = this.skip, seek = this.seek, hex = VSTOOLS.hex, log = this.log;

	var f = 0, t;

	while ( true ) {

		var op = u8();
		var op2 = op;

		if ( op === 0 ) break;

		if ( op === 0x1c ) break; // most likely wrong

		// actual amount of rotation
		var rx = 0,
			ry = 0,
			rz = 0;

		if ( (op & 0xe0) > 0 ) {

			t = op & 0x1f;

			if ( t === 0x1f ) {

				t = u8();
				f += 0x20 + t;

			} else {

				f += 1 + t;

			}

		} else {

			t = op & 0x3;

			if (t === 0x3) {

				t = u8();
				f += 0x4 + t;

			} else {

				f += 1 + t;

			}

			op = op << 3;

			// half word rotation

			var h = s16big();

			if ( (h & 0x4) > 0 ) {

				rx = h >> 3;
				op = op & 0x60;

				if ( (h & 0x2) > 0 ) {

					ry = s16big();
					op = op & 0xa0;

				}

				if ( (h & 0x1) > 0 ) {

					rz = s16big();
					op = op & 0xc0;

				}

			} else if ( (h & 0x2) > 0 ) {

				ry = h >> 3;
				op = op & 0xa0;

				if ((h & 0x1) > 0 ) {

					rz = s16big();
					op = op & 0xc0;

				}

			} else if ( (h & 0x1) > 0 ) {

				rz = h >> 3;
				op = op & 0xc0;

			}

		}

		// byte rotation

		if ( (op & 0x80) > 0 ) {
			rx = s8();
		}

		if ( (op & 0x40) > 0 ) {
			ry = s8();
		}

		if ( (op & 0x20) > 0 ) {
			rz = s8();
		}

		var q = VSTOOLS.rot2quat( rx/95, ry/95, rz/95 );
		q = this.quaternions[ i ].multiply( q );

		//this.log( rx, ry, rz );

		this.tracks[ i ].keys.push( {
			time: f/20,
			pos: [ 0, 0, 0 ],
			rot: [ q.x, q.y, q.z, q.w ],
			scl: [ 1, 1, 1, 1 ]
		} );

	}

};

VSTOOLS.SEQAnimation.prototype.build = function() {

	var seq = this.seq;
	var shp = seq.shp;

	var data = {
		name: 'Animation' + this.id,
		fps: 30,
		length: 30/20,
		hierarchy: this.tracks
	};

	this.animation = new THREE.Animation( shp.mesh, data );

};
