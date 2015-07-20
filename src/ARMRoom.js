VSTOOLS.ARMRoom = function ( reader ) {

	reader.extend( this );

};

VSTOOLS.ARMRoom.prototype.read = function () {

	this.header();
	this.graphics();

};

VSTOOLS.ARMRoom.prototype.header = function () {

	var u16 = this.u16, u32 = this.u32;

	this.u1 = u32();
	this.mapLength = u32();
	this.zoneNumber = u16();
	this.mapNumber = u16();

};

VSTOOLS.ARMRoom.prototype.graphics = function () {

	var u8 = this.u8, s16 = this.s16, u32 = this.u32, skip = this.skip;
	var i;

	var numVertices = this.numVertices = u32();
	var vertices = this.vertices = [];

	for ( i = 0; i < numVertices; ++i ) {

		vertices.push( new THREE.Vector3( s16(), s16(), s16() ) );
		skip( 2 ); // zero padding

	}

	var numTriangles = this.numTriangles = u32();
	var triangles = this.triangles = [];

	for ( i = 0; i < numTriangles; ++i ) {

		triangles.push( readIndices() );

	}

	var numQuads = this.numQuads = u32();
	var quads = this.quads = [];

	for ( i = 0; i < numQuads; ++i ) {

		quads.push( readIndices() );

	}

	var numFloorLines = this.numFloorLines = u32();
	var floorLines = this.floorLines = [];

	for ( i = 0; i < numFloorLines; ++i ) {

		floorLines.push( readIndices() );

	}

	var numWallLines = this.numWallLines = u32();
	var wallLines = this.wallLines = [];

	for ( i = 0; i < numWallLines; ++i ) {

		wallLines.push( readIndices() );

	}

	var numDoors = this.numDoors = u32();
	var doors = this.doors = [];

	for ( i = 0; i < numDoors; ++i ) {

		doors.push( readIndices() );

	}

	function readIndices() {

		return [ u8(), u8(), u8(), u8() ];

	}

};

VSTOOLS.ARMRoom.prototype.name = function () {

	this.skip( 0x24 );
	//this.name = text( 0x24 );

};

VSTOOLS.ARMRoom.prototype.build = function () {

	this.buildMesh();
	this.buildLines();

};

VSTOOLS.ARMRoom.prototype.buildMesh = function () {

	var numTriangles = this.numTriangles;
	var numQuads = this.numQuads;

	var roomVertices = this.vertices;
	var triangles = this.triangles;
	var quads = this.quads;

	var geometry = this.geometry = new THREE.Geometry();
	var vertices = geometry.vertices;
	var faces = geometry.faces;

	var iv = 0;

	for ( var i = 0; i < numTriangles; ++i ) {

		var p = triangles[ i];

		var v1 = roomVertices[ p[ 0 ] ];
		var v2 = roomVertices[ p[ 1 ] ];
		var v3 = roomVertices[ p[ 2 ] ];

		vertices.push( v1, v2, v3 );

		// compute normal
		var n = ( new THREE.Vector3() ).subVectors( v2, v1 );
		n.cross( ( new THREE.Vector3() ).subVectors( v3, v1 ) );
		n.normalize();
		n.negate();

		faces.push( new THREE.Face3( iv + 2,  iv + 1, iv + 0, n ) );

		iv += 3;

	}

	for ( var i = 0; i < numQuads; ++i ) {

		var p = quads[ i ];

		var v1 = roomVertices[ p[ 0 ] ];
		var v2 = roomVertices[ p[ 1 ] ];
		var v3 = roomVertices[ p[ 2 ] ];
		var v4 = roomVertices[ p[ 3 ] ];

		vertices.push( v1, v2, v3, v4 );

		// compute normal
		var n = ( new THREE.Vector3() ).subVectors( v2, v1 );
		n.cross( ( new THREE.Vector3() ).subVectors( v3, v1 ) );
		n.normalize();
		n.negate();

		// 321
		faces.push( new THREE.Face3( iv + 2,  iv + 1, iv + 0, n ) );
		// 432
		faces.push( new THREE.Face3( iv + 0, iv + 3, iv + 2, n ) );

		iv += 4;

	}

	var material = this.material = new THREE.MeshNormalMaterial();
	this.mesh = new THREE.Mesh( geometry, material );

};

VSTOOLS.ARMRoom.prototype.buildLines = function () {

	var geometry = this.lineGeometry = new THREE.Geometry();
	var vertices = geometry.vertices;

	var numFloorLines = this.numFloorLines;
	var numWallLines = this.numWallLines;
	var floorLines = this.floorLines;
	var wallLines = this.wallLines;

	for ( var i = 0; i < numFloorLines; ++i ) {

		var p = floorLines[ i ];

		var v1 = this.vertices[ p[ 0 ] ];
		var v2 = this.vertices[ p[ 1 ] ];
		vertices.push( v1, v2 );

	}

	for ( var i = 0; i < numWallLines; ++i ) {

		var p = wallLines[ i ];

		var v1 = this.vertices[ p[ 0 ] ];
		var v2 = this.vertices[ p[ 1 ] ];
		vertices.push( v1, v2 );

	}

	var material = this.lineMaterial = new THREE.LineBasicMaterial( { color: 0x333333 } );
	this.lines = new THREE.Line( geometry, material, THREE.LinePieces );

};
