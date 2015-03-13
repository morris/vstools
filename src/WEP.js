VSTOOLS.WEP = function( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

};

VSTOOLS.WEP.prototype.read = function() {

	this.header();
	this.data();

};

VSTOOLS.WEP.prototype.header = function() {

	var log = this.log;

	log( 'WEP header' );

	this.header1();

	this.texturePtr1 = this.u32() + 0x10;

	this.skip( 0x30 ); // TODO whats this?

	this.texturePtr = this.u32() + 0x10; // not a mistake
	VSTOOLS.assert( this.texturePtr === this.texturePtr1 );
	this.groupPtr = this.u32() + 0x10;
	this.vertexPtr = this.u32() + 0x10;
	this.polygonPtr = this.u32() + 0x10;

	// unused
	jointPtr = 0x4C + 0x4;

	log( 'texturePtr1: ' + VSTOOLS.hex( this.texturePtr1 ) );
	log( 'texturePtr: ' + VSTOOLS.hex( this.texturePtr ) );
	log( 'groupPtr: ' + VSTOOLS.hex( this.groupPtr ) );
	log( 'vertexPtr: ' + VSTOOLS.hex( this.vertexPtr ) );
	log( 'polygonPtr: ' + VSTOOLS.hex( this.polygonPtr ) );

};

VSTOOLS.WEP.prototype.header1 = function() {

	// magic 'H01' + 0x00
	var magic = this.buffer( 4 );
	//assert Arrays.equals(magic, new int[] { 0x48, 0x30, 0x31, 0x00 });

	this.numJoints = this.u8();
	this.numGroups = this.u8();
	this.numTriangles = this.u16();
	this.numQuads = this.u16();
	this.numPolygons = this.u16();
	this.numAllPolygons = this.numTriangles + this.numQuads + this.numPolygons;

	this.logHeader();

};

VSTOOLS.WEP.prototype.logHeader = function() {

	var log = this.log;

	log( 'numberOfJoints: ' + this.numJoints );
	log( 'numberOfGroups: ' + this.numGroups );
	log( 'numberOfTriangles: ' + this.numTriangles );
	log( 'numberOfQuads: ' + this.numQuads );
	log( 'numberOfPolygons: ' + this.numPolygons );
	log( 'numberOfAllPolygons: ' + this.numAllPolygons );

};

VSTOOLS.WEP.prototype.data = function() {

	this.log( 'WEP data' );

	this.jointSection();
	this.groupSection();
	this.vertexSection();
	this.polygonSection();
	this.textureSection( 5 ); // 5 palettes

};

VSTOOLS.WEP.prototype.jointSection = function() {

	var i;
	var joints = this.joints = [];
	var numJoints = this.numJoints;

	for ( i = 0; i < numJoints; ++i ) {

		var joint = new VSTOOLS.WEPJoint( this.reader );
		joint.read();
		joints.push( joint );

	}

	for ( i = 0; i < numJoints; ++i) {

		var j = joints[i];

		// set parentObject
		if ( j.parentJointId < numJoints ) {

			j.parentJoint = joints[ j.parentJointId ];

		}

		this.log(
			'joint ' + i + ': s=' + j.length + ' p=' + j.parentJointId + ' ' +
			j.x + ' ' + j.y + ' ' + j.z + ' ' + j.mode
		);

	}

};

VSTOOLS.WEP.prototype.groupSection = function() {

	var joints = this.joints;
	var groups = this.groups = [];
	var numGroups = this.numGroups;

	for ( var i = 0; i < numGroups; ++i ) {

		var group = new VSTOOLS.WEPGroup( this.reader );
		group.read();
		group.joint = joints[ group.jointId ];

		groups.push( group );

		this.log(
			'group ' + i + ': joint=' + group.jointId +
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

	g = 0;

	for ( var i = 0; i < numVertices; ++i ) {

		if ( i >= groups[g].lastVertex ) ++g;

		var vertex = new VSTOOLS.WEPVertex( this.reader );
		vertex.read();
		vertex.groupId = g;
		vertex.group = groups[ g ];
		vertex.jointId = groups[ g ].jointId;

		vertices.push( vertex );

	}

};

VSTOOLS.WEP.prototype.polygonSection = function() {

	try {

		this.log( 'Polygon seciton at', VSTOOLS.hex( this.reader.pos() ) );

		var polygons = this.polygons = [];
		var numAllPolygons = this.numAllPolygons;

		for ( var i = 0; i < numAllPolygons; ++i ) {

			var polygon = new VSTOOLS.WEPPolygon( this.reader, this.logger );
			polygon.read();

			polygons.push( polygon );

		}

	} catch ( ex ) {

		console.log( ex );
		this.seek( 0x51cc );

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

	var self = this;
	var Vector2 = THREE.Vector2;

	var polygons = this.polygons;
	var textureMap = this.textureMap;

	var geometry = this.geometry = new THREE.Geometry();

	geometry.influencesPerVertex = 4;

	var vertices = geometry.vertices;
	var faces = geometry.faces;
	var uvs = geometry.faceVertexUvs[0];
	var skinWeights = geometry.skinWeights;
	var skinIndices = geometry.skinIndices;

	for ( var i = 0, l = polygons.length; i < l; ++i ) {

		var iv = vertices.length;
		var p = polygons[i];
		var v1 = this.vertices[ p.vertex1 ];
		var v2 = this.vertices[ p.vertex2 ];
		var v3 = this.vertices[ p.vertex3 ];

		vertices.push( v1.v, v2.v, v3.v );

		skinWeights.push(
			new THREE.Vector4( 1, 0, 0, 0 ),
			new THREE.Vector4( 1, 0, 0, 0 ),
			new THREE.Vector4( 1, 0, 0, 0 )
		);

		skinIndices.push(
			new THREE.Vector4( v1.jointId, 0, 0, 0 ),
			new THREE.Vector4( v2.jointId, 0, 0, 0 ),
			new THREE.Vector4( v3.jointId, 0, 0, 0 )
		);

		if ( p.quad() ) {

			var v4 = this.vertices[ p.vertex4 ];

			vertices.push( v4.v );
			skinWeights.push( new THREE.Vector4( 1, 0, 0, 0 ) );
			skinIndices.push( new THREE.Vector4( v4.jointId, 0, 0, 0 ) );

			var uv1 = [
				new Vector2( p.u3 / textureMap.width, 1 - p.v3 / textureMap.height ),
				new Vector2( p.u2 / textureMap.width, 1 - p.v2 / textureMap.height ),
				new Vector2( p.u1 / textureMap.width, 1 - p.v1 / textureMap.height )
			];

			var uv2 = [
				new Vector2( p.u2 / textureMap.width, 1 - p.v2 / textureMap.height ),
				new Vector2( p.u3 / textureMap.width, 1 - p.v3 / textureMap.height ),
				new Vector2( p.u4 / textureMap.width, 1 - p.v4 / textureMap.height )
			];

			faces.push( new THREE.Face3( iv + 2, iv + 1, iv + 0 ) );
			faces.push( new THREE.Face3( iv + 1, iv + 2, iv + 3 ) );

			uvs.push( uv1 );
			uvs.push( uv2 );

			if ( p.double() ) {

				faces.push( new THREE.Face3( iv + 0, iv + 1, iv + 2 ) );
				faces.push( new THREE.Face3( iv + 3, iv + 2, iv + 1 ) );

				uvs.push( uv1 );
				uvs.push( uv2 );

			}

		} else {

			var uv = [
				new Vector2( p.u1 / textureMap.width, 1 - p.v1 / textureMap.height ),
				new Vector2( p.u3 / textureMap.width, 1 - p.v3 / textureMap.height ),
				new Vector2( p.u2 / textureMap.width, 1 - p.v2 / textureMap.height ),
			];

			faces.push( new THREE.Face3( iv + 2, iv + 1, iv + 0 ) );
			uvs.push( uv );

			if ( p.double() ) {

				faces.push( new THREE.Face3( iv + 0, iv + 1, iv + 2 ) );
				uvs.push( uv );

			}

		}

	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

};

VSTOOLS.WEP.prototype.buildMaterial = function() {

	this.textureMap.build();

	this.material = new THREE.MeshBasicMaterial( {

		map: this.textureMap.textures[0],
		shading: THREE.FlatShading,
		skinning: true,
		transparent: true,
		transparency: true,
		//depthWrite: false,
		//depthTest: false,
		//blending: THREE.AdditiveBlending

	} );

};

VSTOOLS.WEP.prototype.buildBones = function() {

	var i;
	var joints = this.joints, numJoints = this.numJoints;
	var bones = this.geometry.bones = [];

	// binding pose is zero everything

	// rotation bones
	for ( i = 0; i < numJoints; ++i ) {

		var parent = joints[ i ].parentJointId;
		var rbone = {
			pos: [ 0, 0, 0 ],
			rotq: [ 0, 0, 0, 0 ],
			parent: parent < numJoints ? parent + numJoints : -1
		};
		bones.push( rbone );

	}

	// translation bones
	for ( i = numJoints; i < numJoints * 2; ++i ) {

		var tbone = {
			pos: [ 0, 0, 0 ],
			rotq: [ 0, 0, 0, 0 ],
			parent: i - numJoints
		};
		bones.push( tbone );

	}

};

VSTOOLS.WEP.prototype.buildMesh = function() {

	var joints = this.joints, numJoints = this.numJoints;
	var mesh = this.mesh = new THREE.SkinnedMesh( this.geometry, this.material );

	mesh.rotation.x = Math.PI;

	// sets length of bones. just for WEP.
	// SHP's animations will override this

	for ( var i = numJoints; i < numJoints * 2; ++i ) {

		mesh.skeleton.bones[ i ].position.x = joints[ i - numJoints ].length;

	}

};

// if we, some day, build the skeleton ourselves
// instead relying on SkinnedMesh to parse the geometry into a skeleton
VSTOOLS.WEP.prototype.buildSkeleton2 = function() {

	var i;
	var joints = this.joints, numJoints = this.numJoints;
	var bones = this.geometry.bones = [];

	// rotation bones
	for ( i = 0; i < numJoints; ++i ) {

		var rbone = new THREE.Bone();
		bones.push( rbone );

	}

	// translation bones
	for ( i = numJoints; i < numJoints * 2; ++i ) {

		var tbone = new THREE.Bone();
		bones.push( tbone );
		bones[ i - numJoints ].add( tbone );

	}

	// hierarchy
	for ( i = 0; i < numJoints; ++i ) {

		if ( joints[ i ].parentJointId < joints.length ) {

			bones[ joints[ i ].parentJointId + numJoints ].add( bones[ i ] );

		}

	}

	var skeleton = this.geometry.skeleton = new THREE.Skeleton( bones );
	skeleton.update();

	for ( i = numJoints + 1; i < numJoints * 2; ++i ) {

		bones[ i ].pos = new THREE.Vector3( joints[i - numJoints].length, 0, 0 );

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
