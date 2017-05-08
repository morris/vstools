var fs = require( 'fs' );
var VSTOOLS = require( './' );

var sound;

for ( var i = 0; i < 100; ++i ) {
	var n = i + '';
	while ( n.length < 4 ) n = '0' + n;
	var file = '../vs/SOUND/WAVE' + n + '.DAT';
	console.log( file );
	sound = new VSTOOLS.SOUND( new VSTOOLS.Reader( fs.readFileSync( file ) ) );
	sound.read();
}
