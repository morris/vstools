// this is an eval hack, but i don't want to introduce a build system

var Fs = require( 'fs' );
var Path = require( 'path' );

global.self = {}; // come on...
var THREE = require( './lib/three.js' );

var files = [
	'VSTOOLS.js',

	'Reader.js',

	'WEP.js',
	'WEPBone.js',
	'WEPFace.js',
	'WEPGroup.js',
	'WEPPalette.js',
	'WEPTextureMap.js',
	'WEPVertex.js',

	'SHP.js',

	'SEQ.js',
	'SEQAnimation.js',

	'ZUD.js',

	'ZND.js',

	'MPD.js',
	'MPDFace.js',
	'MPDGroup.js',
	'MPDMesh.js',

	'TIM.js',
	'FrameBuffer.js',
	'Text.js',

	'Collada.js'
];

for ( var i = 0; i < files.length; ++i ) {

	eval( Fs.readFileSync( Path.resolve( __dirname, 'src', files[ i ] ) ).toString() );

};

module.exports = VSTOOLS;
