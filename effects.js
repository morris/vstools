var fs = require( 'fs' );
var VSTOOLS = require( './' );

for ( var i = 0; i < 300; ++i ) {
	var n = i + '';
	while ( n.length < 3 ) n = '0' + n;
	var file = '../vs/EFFECT/E' + n + '.P';
	console.log( file );
	if ( n === '122' || n === '123' ) continue;
	try {
		var effect = new VSTOOLS.P( new VSTOOLS.Reader( fs.readFileSync( file ) ) );
		effect.read();
	} catch ( ex ) {
		if ( !ex.message.match( /ENOENT/ ) ) throw ex;
	}
}
