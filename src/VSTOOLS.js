var VSTOOLS = {

	// config

	enableKeyFrames: true,

	// constants

	timeScale: 0.05,

	// utility

	hex: function( i, pad ) {

		var x = i.toString( 16 );

		while ( x.length < pad ) x = '0' + x;

		return '0x' + x;

	},

	ext: function( path ) {

		var dot = path.lastIndexOf( '.' );
		var slash = path.lastIndexOf( '/' );

		return dot > 0 && dot > slash ? path.substr( dot + 1 ).toLowerCase() : null;

	},

	// convert typed array to png data url
	png: function( data, width, height ) {

		var canvas = document.createElement( 'canvas' );
		canvas.width = width;
		canvas.height = height;

		// Copy the image contents to the canvas
		var ctx = canvas.getContext( '2d' );

		var imageData = ctx.createImageData( width, height );
		for ( var i = 0, l = data.length; i < l; ++i ) {

			imageData.data[ i ] = data[ i ];

		}

		ctx.putImageData( imageData, 0, 0 );

		return canvas.toDataURL( 'image/png' );

	},

	// get RGBA from 16 bit color value
	// first bit === 1 or bits === 0 means fully transparent
	// then 5 bits for each of B, G, R
	color: function( c ) {

		var t = ( c & 0x8000 ) >> 15;
		var b = ( c & 0x7C00 ) >> 10;
		var g = ( c & 0x03E0 ) >> 5;
		var r = ( c & 0x001F );

		if ( c === 0 || t === 1 ) {

			return [ 0, 0, 0, 0 ];

		}

		// 5bit -> 8bit is factor 2^3 = 8
		return [ r * 8, g * 8, b * 8, 255 ];

	},

	// convert 13-bit rotation to radians
	rot13toRad: function( angle ) {

		return angle * VSTOOLS.Rot13toRad;

	},

	Rot13toRad: (1 / 4096) * 2 * Math.PI,

	// convert XYZ rotation in radians to quaternion
	// first apply x, then y, then z rotation
	// THREE.Quaternion.setFromEuler is not equivalent

	rot2quat: function( rx, ry, rz ) {

		var Quaternion = THREE.Quaternion;

		var qu = new Quaternion();
		qu.setFromAxisAngle( VSTOOLS.UnitX, rx );
		var qv = new Quaternion();
		qv.setFromAxisAngle( VSTOOLS.UnitY, ry );
		var qw = new Quaternion();
		qw.setFromAxisAngle( VSTOOLS.UnitZ, rz );

		return qw.multiply( qv.multiply( qu ) );

	},

	UnitX: new THREE.Vector3( 1, 0, 0 ),
	UnitY: new THREE.Vector3( 0, 1, 0 ),
	UnitZ: new THREE.Vector3( 0, 0, 1 ),

	u: function( b ) {

		return b < 0 ? 256 + b : b;

	},

	log: function( filter, log ) {

		return function( obj ) {

			if ( filter.call( obj, obj ) ) {



			}

		};

	},

	debug: true,

	assert: function( x, msg, err ) {

		if ( VSTOOLS.debug && !x ) {

			var stack = err ? err.stack : '';
			throw new Error( msg || 'Assertion failed' + stack );

		}

	},

	//

	testQuat: function() {

		var d2r = 2 * Math.PI / 360;

		qtv(100, 0, 0, 45, 0, 0); // 100 0 0 (no changes)

		qtv(100, 0, 0, 0, 45, 0); // 70 0 -70
		qtv(100, 0, 0, 0, 0, 45); // 70 70 0

		qtv(100, 0, 0, 45, 45, 0); // 70 0 -70
		qtv(100, 0, 0, 45, 0, 45); // 70 70 0
		qtv(100, 0, 0, 0, 10, 10); // 97 17 -17
		qtv(100, 0, 0, 0, 45, 90); // 0 70 -70

		qtv(100, 0, 0, 0, 0, 270); // 0 -100 0

		qtv(100, 0, 0, 0, 290, 60);

		function qtv( x, y, z, u, v, w ) {

			var q = VSTOOLS.rot2quat( u * d2r, v * d2r, w * d2r );
			var p = new THREE.Vector3( x, y, z );
			p.applyQuaternion( q );
			console.log( p );

		}

	},

};

if ( typeof module === 'object' ) module.exports = VSTOOLS;
