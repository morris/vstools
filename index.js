// this is an eval hack, but i don't want to introduce a build system

var Fs = require( 'fs' );
var Path = require( 'path' );

global.self = {}; // come on...
var THREE = require( './lib/three.js' );

var files = [
	'VSTOOLS.js',

	'Reader.js',
	'Logger.js',
	'FrameBuffer.js',

	'WEP.js',
	'WEPBone.js',
	'WEPFace.js',
	'WEPGroup.js',
	'WEPPalette.js',
	'WEPTextureMap.js',
	'WEPVertex.js',

	'SEQ.js',
	'SEQAnimation.js',

	'SHP.js',

	'ZND.js',
	'ZUD.js',

	'MPD.js',
	'MPDFace.js',
	'MPDGroup.js',
	'MPDMesh.js',

	'Text.js',
	'TIM.js'
];

for ( var i = 0; i < files.length; ++i ) {

	eval( Fs.readFileSync( Path.resolve( __dirname, 'src', files[ i ] ) ).toString() );

};

module.exports = VSTOOLS;
