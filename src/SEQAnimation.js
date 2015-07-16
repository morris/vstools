VSTOOLS.SEQAnimation = function ( reader, logger, seq ) {

	reader.extend( this );
	logger.extend( this );

	this.seq = seq;

};

VSTOOLS.SEQAnimation.prototype.header = function ( id ) {

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

VSTOOLS.SEQAnimation.prototype.data = function () {

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

VSTOOLS.SEQAnimation.prototype.readPose = function ( i ) {

	var s16big = this.s16big, log = this.log;

	// big endian! but... WHY?!
	var rx = s16big(),
		ry = s16big(),
		rz = s16big();

	log( 'pose ' + i + ': ' + rx + ' ' + ry + ' ' + rz );

	this.pose[ i ] = [ rx, ry, rz ];

};

VSTOOLS.SEQAnimation.prototype.readKeyframes = function ( i ) {

	if ( !VSTOOLS.enableKeyframes ) return;

	var u8 = this.u8, s8 = this.s8, s16big = this.s16big,
		skip = this.skip, seek = this.seek, hex = VSTOOLS.hex, log = this.log;

	var f = 0, t;

	while ( true ) {

		var op = this.readOpcode();

		if ( op[ 4 ] === 0 ) break;

		f += op[ 3 ];

		this.keyframes[ i ].push( op );

		if ( f >= this.length - 1 ) break;

	}

};

// opcodes
// this is basically 0xafe90 to 0xb0000
// reads one opcode and its X, Y, Z, T values
// this is actually used for rotations AND a few translations
VSTOOLS.SEQAnimation.prototype.readOpcode = function () {

	var u8 = this.u8, s8 = this.s8, s16big = this.s16big,
		hex = VSTOOLS.hex;

	var op = u8();
	var op0 = op;

	if ( op === 0 ) return [ null, null, null, null, 0 ];

	if ( op === 0x1c ) {

		//console.log( 'breaking on 0x1c' );
		return [ null, null, null, null, 0 ]; // most likely wrong

	}

	// results
	var x = null,
		y = null,
		z = null,
		f = null;

	if ( ( op & 0xe0 ) > 0 ) {

		f = op & 0x1f;

		if ( f === 0x1f ) {

			f = 0x20 + u8();

		} else {

			f = 1 + f;

		}

	} else {

		if ( this.id === 1 ) console.log( "HALF" );

		// half word values

		f = op & 0x3;

		if ( f === 0x3 ) {

			f = 4 + u8();

		} else {

			f = 1 + f;

		}

		op = op << 3;

		var h = s16big();

		if ( ( h & 0x4 ) > 0 ) {

			x = h >> 3;
			op = op & 0x60;

			if ( ( h & 0x2 ) > 0 ) {

				y = s16big();
				op = op & 0xa0;

			}

			if ( ( h & 0x1 ) > 0 ) {

				z = s16big();
				op = op & 0xc0;

			}

		} else if ( ( h & 0x2 ) > 0 ) {

			y = h >> 3;
			op = op & 0xa0;

			if ( ( h & 0x1 ) > 0 ) {

				z = s16big();
				op = op & 0xc0;

			}

		} else if ( ( h & 0x1 ) > 0 ) {

			z = h >> 3;
			op = op & 0xc0;

		}

	}

	// byte values

	if ( ( op & 0x80 ) > 0 ) {

		x = s8();

	}

	if ( ( op & 0x40 ) > 0 ) {

		y = s8();

	}

	if ( ( op & 0x20 ) > 0 ) {

		z = s8();

	}

	return [ x, y, z, f, op0 ];

};

VSTOOLS.SEQAnimation.prototype.build = function () {

	var seq = this.seq;
	var shp = seq.shp;

	var numBones = seq.numBones;

	var hierarchy = [];

	var rad = VSTOOLS.rot13toRad;

	// rotation bones

	for ( var i = 0; i < numBones; ++i ) {

		var keyframes = this.keyframes[ i ];
		var pose = this.pose[ i ];

		// multiplication by two at 0xad25c, 0xad274, 0xad28c
		var rx = pose[ 0 ] * 2;
		var ry = pose[ 1 ] * 2;
		var rz = pose[ 2 ] * 2;

		if ( i === 3 ) {

			var hex = VSTOOLS.hex;
			console.log( 'POSE', hex( rx ), hex( ry ), hex( rz ) );

		}

		var keys = [];
		var t = 0;

		for ( var j = 0, l = keyframes.length; j < l; ++j ) {

			var keyframe = keyframes[ j ];

			var f = keyframe[ 3 ];

			// this SHOULD be correct, but looks bad
			//if ( j === l - 1 ) f = this.length - 1 - t;

			t += f;

			if ( keyframe[ 0 ] === null ) keyframe[ 0 ] = keyframes[ j - 1 ][ 0 ];
			if ( keyframe[ 1 ] === null ) keyframe[ 1 ] = keyframes[ j - 1 ][ 1 ];
			if ( keyframe[ 2 ] === null ) keyframe[ 2 ] = keyframes[ j - 1 ][ 2 ];

			rx = add( rx, keyframe[ 0 ] * f );
			ry = add( ry, keyframe[ 1 ] * f );
			rz = add( rz, keyframe[ 2 ] * f );

			if ( i === 3 ) {

				var hex = VSTOOLS.hex;
				console.log( 'FRAME', hex( rx ), hex( ry ), hex( rz ) );

			}

			var q = VSTOOLS.rot2quat( rad( rx ), rad( ry ), rad( rz ) );

			keys.push( {
				time: t * VSTOOLS.timeScale,
				pos: [ 0, 0, 0 ],
				rot: [ q.x, q.y, q.z, q.w ],
				scl: [ 1, 1, 1 ]
			} );

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
