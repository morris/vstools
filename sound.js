var fs = require( 'fs' );
var Speaker = require( 'speaker' );
var lame = require( 'lame' );

var decoder = new lame.Decoder();
var speaker = new Speaker( {
	channels: 1,
	bitDepth: 8,
	sampleRate: 22100,
	mode: lame.MONO
} );

console.log( "test" );

decoder.on( 'format', function ( format ) {
	console.log( 'format' );
	decoder.pipe( speaker );
} );

decoder.on( 'error', function ( err ) {
	console.log( err );
} );

var z = '../vs/SOUND/WAVE0000.DAT';
//z = '../vs/MUSIC/MUSIC000.DAT';
fs.createReadStream( z ).pipe( speaker );
