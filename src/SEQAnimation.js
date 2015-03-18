VSTOOLS.SEQAnimation = function( reader, logger, seq ) {

	reader.extend( this );
	logger.extend( this );

	this.seq = seq;

};

VSTOOLS.SEQAnimation.prototype.header = function( id ) {

	var u8 = this.u8, s8 = this.s8, u16 = this.u16,
		skip = this.skip, hex = VSTOOLS.hex, log = this.log;

	var seq = this.seq;

	this.id = id;
	this.length = u16(); // 2

	// some animations use a different animation as base
	this.idOtherAnimation = s8(); // 3

	VSTOOLS.assert( this.idOtherAnimation >= -1 && this.idOtherAnimation < seq.numAnimations );

	this.mode = u8(); // unknown. has weird effects on mesh. 4

	// seems to point to a data block that controls looping
	this.ptr1 = u16(); // 6

	// points to a translation vector for the animated mesh
	this.ptrTranslation = u16(); // 8

	// points to a data block that controls movement
	this.ptrMove = u16(); // 10

	// just some logging
	log( 'animation ' + this.id );
	log( 'length: ' + this.length );
	log( 'idOtherPose: ' + this.idOtherAnimation );
	log( 'mode: ' + this.mode );
	log( 'ptr1: ' + hex( seq.ptrData( this.ptr1 ) ) + ' (' + this.ptr1 + ')' );
	log( 'ptrTranslation: ' + hex( seq.ptrData( this.ptrTranslation ) ) + ' (' + this.ptrTranslation + ')' );
	log( 'ptrMove: ' + hex( seq.ptrData( this.ptrMove ) ) + ' (' + this.ptrMove + ')' );

	// read pointers to pose and keyframes for individual bones
	this.ptrBones = [];

	for ( var i = 0; i < seq.numBones; ++i ) {

		var ptr = u16();
		this.ptrBones.push( ptr );
		log( i + ' ' + hex( seq.ramPtr + seq.ptrData( ptr ) ) );

	} // 10 + numBones * 2

	for ( var i = 0; i < seq.numBones; ++i ) {

		// TODO is this true for all SEQ?
		//VSTOOLS.assert( u16() === 0 );
		skip( 2 );

	} // 10 + numBones * 4

};

VSTOOLS.SEQAnimation.prototype.data = function() {

	var u8 = this.u8, s8 = this.s8, u16 = this.u16, s16big = this.s16big,
		skip = this.skip, seek = this.seek, hex = VSTOOLS.hex, log = this.log;

	var seq = this.seq;
	var shp = seq.shp;

	log( '----' );
	log( 'computing animation ' + this.id );

	// read translation
	// big endian
	seek( seq.ptrData( this.ptrTranslation ) );

	var x = s16big();
	var y = s16big();
	var z = s16big();

	log( 'translation ' + x + ' ' + y + ' ' + z );

	log( 'length', this.length );

	// TODO implement move

	// set base animation
	this.base = this;
	if ( this.idOtherAnimation !== -1 ) {

		this.base = seq.animations[ this.idOtherAnimation ];

	}

	// this holds the initial rotation of bones,
	// i.e. the initial pose for the animation
	this.pose = [];

	this.keyframes = [];

	// read base pose and keyframes
	for ( var i = 0; i < seq.numBones; ++i ) {

		this.keyframes.push( [ [ 0, 0, 0, 0 ] ] );

		seek( seq.ptrData( this.base.ptrBones[ i ] ) );

		this.readPose( i );
		this.readKeyframes( i );

	}

};

VSTOOLS.SEQAnimation.prototype.readPose = function( i ) {

	var s16big = this.s16big, log = this.log;

	// big endian! but... WHY?!
	var rx = s16big(),
		ry = s16big(),
		rz = s16big();

	log( 'pose ' + i + ': ' + rx + ' ' + ry + ' ' + rz );

	this.pose[ i ] = [ rx, ry, rz ];

};

VSTOOLS.SEQAnimation.prototype.readKeyframes = function( i ) {

	if ( !VSTOOLS.enableKeyframes ) return;

	var u8 = this.u8, s8 = this.s8, s16big = this.s16big,
		skip = this.skip, seek = this.seek, hex = VSTOOLS.hex, log = this.log;

	var f = 0, t;

	while ( true ) {

		var op = u8();
		var op2 = op;

		if ( op === 0 ) break;

		if ( op === 0x1c ) break; // most likely wrong

		// rotation speed
		var rx = 0,
			ry = 0,
			rz = 0;

		if ( ( op & 0xe0 ) > 0 ) {

			t = op & 0x1f;

			if ( t === 0x1f ) {

				t = u8();
				f += 0x20 + t;

			} else {

				f += 1 + t;

			}

		} else {

			var half = true;

			t = op & 0x3;

			if ( t === 0x3 ) {

				t = u8();
				f += 0x4 + t;

			} else {

				f += 1 + t;

			}

			op = op << 3;

			// half word rotation

			var h = s16big();

			if ( ( h & 0x4 ) > 0 ) {

				rx = h >> 3;
				op = op & 0x60;

				if ( ( h & 0x2 ) > 0 ) {

					ry = s16big();
					op = op & 0xa0;

				}

				if ( ( h & 0x1 ) > 0 ) {

					rz = s16big();
					op = op & 0xc0;

				}

			} else if ( ( h & 0x2 ) > 0 ) {

				ry = h >> 3;
				op = op & 0xa0;

				if ( ( h & 0x1 ) > 0 ) {

					rz = s16big();
					op = op & 0xc0;

				}

			} else if ( ( h & 0x1 ) > 0 ) {

				rz = h >> 3;
				op = op & 0xc0;

			}

		}

		// byte rotation

		if ( ( op & 0x80 ) > 0 ) {

			rx = s8();

		}

		if ( ( op & 0x40 ) > 0 ) {

			ry = s8();

		}

		if ( ( op & 0x20 ) > 0 ) {

			rz = s8();

		}

		this.keyframes[ i ].push( [ rx, ry, rz, f ] );

		this.log( 'key', f, rx, ry, rz, half ? 'H' : ' ' );

		if ( f >= this.length - 1 ) break;

	}

};

VSTOOLS.SEQAnimation.prototype.build = function() {

	var seq = this.seq;
	var shp = seq.shp;

	var numBones = seq.numBones;

	var hierarchy = [];

	var rad = VSTOOLS.rot13toRad;

	// rotation bones

	for ( var i = 0; i < numBones; ++i ) {

		var keyframes = this.keyframes[ i ];
		var pose = this.pose[ i ];

		var rx = pose[ 0 ];
		var ry = pose[ 1 ];
		var rz = pose[ 2 ];

		var keys = [];

		this.log( 'bone', i );

		var f0 = 0;

		for ( var j = 0, l = keyframes.length; j < l; ++j ) {

			var keyframe = keyframes[ j ];

			var f = keyframe[ 3 ];
			var df = f - f0;

			// TODO whats up with this division by 2??
			rx = add( rx, keyframe[ 0 ] * df / 2 );
			ry = add( ry, keyframe[ 1 ] * df / 2 );
			rz = add( rz, keyframe[ 2 ] * df / 2 );

			var q = VSTOOLS.rot2quat( rad( rx ), rad( ry ), rad( rz ) );

			keys.push( {
				time: f * VSTOOLS.timeScale,
				pos: [ 0, 0, 0 ],
				rot: [ q.x, q.y, q.z, q.w ],
				scl: [ 1, 1, 1 ]
			} );

			f0 = f;

		}

		hierarchy.push( { keys: keys } );

	}

	function add( r, s ) {

		var a = r + s;

		return a;

		// TODO is this better?

		if ( a >= 4096 ) a -= 4096;
		if ( a < 0 ) a += 4096;

		return a;

	}

	// root's translation bone

	hierarchy.push( {
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

	for ( var i = 1; i < numBones; ++i ) {

		hierarchy.push( {
			keys: [
				{
					time: 0,
					pos: [ shp.bones[i].length, 0, 0 ],
					rot: [ 0, 0, 0, 1 ],
					scl: [ 1, 1, 1 ]
				}
			]
		} );

	}

	var data = {
		name: 'Animation' + this.id,
		length: this.length * VSTOOLS.timeScale,
		hierarchy: hierarchy
	};

	this.animation = new THREE.Animation( shp.mesh, data );

};
