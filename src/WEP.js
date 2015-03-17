VSTOOLS.WEP = function( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

};

VSTOOLS.WEP.prototype.read = function() {

	this.header();
	this.data();

};

VSTOOLS.WEP.prototype.header = function() {

	var log = this.log, hex = VSTOOLS.hex, u32 = this.u32;

	log( 'WEP header' );

	this.header1();

	this.texturePtr1 = u32() + 0x10;

	this.skip( 0x30 ); // TODO whats this?

	this.texturePtr = u32() + 0x10;
	VSTOOLS.assert( this.texturePtr === this.texturePtr1 );

	this.groupPtr = u32() + 0x10;
	this.vertexPtr = u32() + 0x10;
	this.facePtr = u32() + 0x10;

	// unused
	this.bonePtr = 0x4C + 0x04;

	log( 'texturePtr1: ' + hex( this.texturePtr1 ) );
	log( 'texturePtr: ' + hex( this.texturePtr ) );
	log( 'groupPtr: ' + hex( this.groupPtr ) );
	log( 'vertexPtr: ' + hex( this.vertexPtr ) );
	log( 'facePtr: ' + hex( this.facePtr ) );

};

VSTOOLS.WEP.prototype.header1 = function() {

	var u8 = this.u8, u16 = this.u16, buffer = this.buffer;

	// magic 'H01' + 0x00
	var magic = buffer( 4 );
	//assert Arrays.equals(magic, new int[] { 0x48, 0x30, 0x31, 0x00 });

	this.numBones = u8();
	this.numGroups = u8();
	this.numTriangles = u16();
	this.numQuads = u16();
	this.numPolygons = u16();
	this.numAllPolygons = this.numTriangles + this.numQuads + this.numPolygons;

	this.logHeader();

};

VSTOOLS.WEP.prototype.logHeader = function() {

	var log = this.log;

	log( 'numberOfBones: ' + this.numBones );
	log( 'numberOfGroups: ' + this.numGroups );
	log( 'numberOfTriangles: ' + this.numTriangles );
	log( 'numberOfQuads: ' + this.numQuads );
	log( 'numberOfPolygons: ' + this.numPolygons );
	log( 'numberOfAllPolygons: ' + this.numAllPolygons );

};

VSTOOLS.WEP.prototype.data = function() {

	this.log( 'WEP data' );

	this.boneSection();
	this.groupSection();
	this.vertexSection();
	this.faceSection();
	this.textureSection( 5 ); // 5 palettes

};

VSTOOLS.WEP.prototype.boneSection = function() {

	var bones = this.bones = [];
	var numBones = this.numBones;

	for ( var i = 0; i < numBones; ++i ) {

		var bone = new VSTOOLS.WEPBone( this.reader );
		bone.read();
		bones.push( bone );

	}

	for ( var i = 0; i < numBones; ++i) {

		var bone = bones[ i ];

		// set parent bone

		if ( bone.parentBoneId < numBones ) {

			bone.parentBone = bones[ bone.parentBoneId ];

		}

		this.log(
			'bone ' + i + ': l=' + bone.length + ' p=' + bone.parentBoneId + ' ' +
			bone.x + ' ' + bone.y + ' ' + bone.z + ' ' + bone.mode
		);

	}

};

VSTOOLS.WEP.prototype.groupSection = function() {

	var bones = this.bones;
	var groups = this.groups = [];
	var numGroups = this.numGroups;

	for ( var i = 0; i < numGroups; ++i ) {

		var group = new VSTOOLS.WEPGroup( this.reader );
		group.read();
		group.bone = bones[ group.boneId ];

		groups.push( group );

		this.log(
			'group ' + i + ': bone=' + group.boneId +
			' lv=' + group.lastVertex
		);

	}

};

VSTOOLS.WEP.prototype.vertexSection = function() {

	var groups = this.groups;
	var numGroups = this.numGroups;
	var numVertices = this.numVertices = groups[ numGroups - 1 ].lastVertex;

	this.log( 'numberOfVertices: ' + numVertices );

	var vertices = this.vertices = [];

	var g = 0;

	for ( var i = 0; i < numVertices; ++i ) {

		if ( i >= groups[ g ].lastVertex ) ++g;

		var vertex = new VSTOOLS.WEPVertex( this.reader );
		vertex.read();
		vertex.groupId = g;
		vertex.group = groups[ g ];
		vertex.boneId = groups[ g ].boneId;

		vertices.push( vertex );

	}

};

VSTOOLS.WEP.prototype.faceSection = function() {

	this.log( 'Polygon section at', VSTOOLS.hex( this.reader.pos() ) );

	var faces = this.faces = [];
	var numAllPolygons = this.numAllPolygons;

	for ( var i = 0; i < numAllPolygons; ++i ) {

		var face = new VSTOOLS.WEPFace( this.reader, this.logger );
		face.read();

		faces.push( face );

	}

};

VSTOOLS.WEP.prototype.textureSection = function( numPalettes ) {

	this.textureMap = new VSTOOLS.WEPTextureMap( this.reader, this.logger );
	this.textureMap.read( numPalettes );

};

VSTOOLS.WEP.prototype.build = function() {

	this.buildGeometry();
	this.buildMaterial();
	this.buildBones();
	this.buildMesh();

};

VSTOOLS.WEP.prototype.buildGeometry = function() {

	var tw = this.textureMap.width;
	var th = this.textureMap.height;

	var geometry = this.geometry = new THREE.Geometry();
	geometry.influencesPerVertex = 4;

	for ( var i = 0, l = this.faces.length; i < l; ++i ) {

		var f = this.faces[ i ];

		var v1 = this.vertices[ f.vertex1 ];
		var v2 = this.vertices[ f.vertex2 ];
		var v3 = this.vertices[ f.vertex3 ];

		var iv = geometry.vertices.length;

		geometry.vertices.push( v1.v, v2.v, v3.v );

		geometry.skinWeights.push(
			new THREE.Vector4( 1, 0, 0, 0 ),
			new THREE.Vector4( 1, 0, 0, 0 ),
			new THREE.Vector4( 1, 0, 0, 0 )
		);

		geometry.skinIndices.push(
			new THREE.Vector4( v1.boneId, 0, 0, 0 ),
			new THREE.Vector4( v2.boneId, 0, 0, 0 ),
			new THREE.Vector4( v3.boneId, 0, 0, 0 )
		);

		if ( f.quad() ) {

			var v4 = this.vertices[ f.vertex4 ];

			geometry.vertices.push( v4.v );
			geometry.skinWeights.push( new THREE.Vector4( 1, 0, 0, 0 ) );
			geometry.skinIndices.push( new THREE.Vector4( v4.boneId, 0, 0, 0 ) );

			var uv1 = [
				new THREE.Vector2( f.u3 / tw, 1 - f.v3 / th ),
				new THREE.Vector2( f.u2 / tw, 1 - f.v2 / th ),
				new THREE.Vector2( f.u1 / tw, 1 - f.v1 / th )
			];

			var uv2 = [
				new THREE.Vector2( f.u2 / tw, 1 - f.v2 / th ),
				new THREE.Vector2( f.u3 / tw, 1 - f.v3 / th ),
				new THREE.Vector2( f.u4 / tw, 1 - f.v4 / th )
			];

			geometry.faces.push( new THREE.Face3( iv + 2, iv + 1, iv + 0 ) );
			geometry.faces.push( new THREE.Face3( iv + 1, iv + 2, iv + 3 ) );

			geometry.faceVertexUvs[ 0 ].push( uv1 );
			geometry.faceVertexUvs[ 0 ].push( uv2 );

			if ( f.double() ) {

				geometry.faces.push( new THREE.Face3( iv + 0, iv + 1, iv + 2 ) );
				geometry.faces.push( new THREE.Face3( iv + 3, iv + 2, iv + 1 ) );

				uv1 = [ uv1[ 2 ], uv1[ 1 ], uv1[ 0 ] ];
				uv2 = [ uv2[ 2 ], uv2[ 1 ], uv2[ 0 ] ];

				geometry.faceVertexUvs[ 0 ].push( uv1 );
				geometry.faceVertexUvs[ 0 ].push( uv2 );

			}

		} else {

			var uv = [
				new THREE.Vector2( f.u1 / tw, 1 - f.v1 / th ),
				new THREE.Vector2( f.u3 / tw, 1 - f.v3 / th ),
				new THREE.Vector2( f.u2 / tw, 1 - f.v2 / th ),
			];

			geometry.faces.push( new THREE.Face3( iv + 2, iv + 1, iv + 0 ) );
			geometry.faceVertexUvs[ 0 ].push( uv );

			if ( f.double() ) {

				geometry.faces.push( new THREE.Face3( iv + 0, iv + 1, iv + 2 ) );
				uv = [ uv[ 2 ], uv[ 1 ], uv[ 0 ] ];
				geometry.faceVertexUvs[ 0 ].push( uv );

			}

		}

	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

};

VSTOOLS.WEP.prototype.buildMaterial = function() {

	this.textureMap.build();

	this.material = new THREE.MeshBasicMaterial( {

		map: this.textureMap.textures[ 0 ],
		shading: THREE.FlatShading,
		skinning: true,
		transparent: true

	} );

};

VSTOOLS.WEP.prototype.buildBones = function() {

	var bones = this.bones, numBones = this.numBones;
	this.geometry.bones = [];

	// binding pose is zero everything

	// rotation bones
	for ( var i = 0; i < numBones; ++i ) {

		var parent = bones[ i ].parentBoneId;

		var bone = {
			pos: [ 0, 0, 0 ],
			rotq: [ 0, 0, 0, 0 ],
			parent: parent < numBones ? parent + numBones : -1
		};

		this.geometry.bones.push( bone );

	}

	// translation bones
	for ( var i = numBones; i < numBones * 2; ++i ) {

		var bone = {
			pos: [ 0, 0, 0 ],
			rotq: [ 0, 0, 0, 0 ],
			parent: i - numBones
		};

		this.geometry.bones.push( bone );

	}

};

VSTOOLS.WEP.prototype.buildMesh = function() {

	var bones = this.bones, numBones = this.numBones;
	var mesh = this.mesh = new THREE.SkinnedMesh( this.geometry, this.material );

	mesh.rotation.x = Math.PI;

	// sets length of bones. just for WEP.
	// SHP's animations will override this

	for ( var i = numBones; i < numBones * 2; ++i ) {

		mesh.skeleton.bones[ i ].position.x = bones[ i - numBones ].length;

	}

};

VSTOOLS.WEP.prototype.geometrySnapshot = function() {

	var snapshot = this.geometry.clone();

	for ( var i = 0, l = snapshot.vertices.length; i < l; ++i ) {

		var bone = this.mesh.skeleton.bones[ this.geometry.skinIndices[ i ].x ];
		snapshot.vertices[ i ].applyMatrix4( bone.matrixWorld );

	}

	return snapshot;

};
