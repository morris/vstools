var Fs = require( 'fs' );
var VSTOOLS = require( './' );
var THREE = require( './lib/three.r74.min.js' );

var reader;

reader = new VSTOOLS.Reader( Fs.readFileSync( 'e:/vs/OBJ/00.SHP' ) );
var shp = new VSTOOLS.SHP( reader );
shp.read();

reader = new VSTOOLS.Reader( Fs.readFileSync( 'e:/vs/OBJ/00_COM.SEQ' ) );
var seq = new VSTOOLS.SEQ( reader, shp );
seq.read();

shp.build();
seq.animations[ 8 ].build();

//var mesh = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshNormalMaterial() );

var collada = VSTOOLS.Collada.export( shp.mesh );
console.log( collada );

Fs.writeFileSync( 'test.dae', collada );
