VSTOOLS.MPD = function ( reader, logger, znd ) {

	reader.extend( this );
	logger.extend( this );

	this.znd = znd;

};

VSTOOLS.MPD.prototype.read = function () {

	this.header();
	this.roomHeader();
	this.roomSection();
	//this.clearedSection();
	//this.scriptSection();

};

VSTOOLS.MPD.prototype.header = function () {

	var u32 = this.u32;

	this.ptrRoomSection = u32();
	this.lenRoomSection = u32();
	this.ptrClearedSection = u32();
	this.lenClearedSection = u32();
	this.ptrScriptSection = u32();
	this.lenScriptSection = u32();
	this.ptrDoorSection = u32();
	this.lenDoorSection = u32();
	this.ptrEnemySection = u32();
	this.lenEnemySection = u32();
	this.ptrTreasureSection = u32();
	this.lenTreasureSection = u32();

};

VSTOOLS.MPD.prototype.roomHeader = function () {

	var u32 = this.u32;

	this.lenGeometrySection = u32();
	this.lenCollisionSection = u32();
	this.lenSubSection03 = u32();
	this.lenDoorSectionRoom = u32();
	this.lenLightingSection = u32();

	this.lenSubSection06 = u32();
	this.lenSubSection07 = u32();
	this.lenSubSection08 = u32();
	this.lenSubSection09 = u32();
	this.lenSubSection0A = u32();
	this.lenSubSection0B = u32();

	this.lenTextureEffectsSection = u32();

	this.lenSubSection0D = u32();
	this.lenSubSection0E = u32();
	this.lenSubSection0F = u32();
	this.lenSubSection10 = u32();
	this.lenSubSection11 = u32();
	this.lenSubSection12 = u32();
	this.lenSubSection13 = u32();

	this.lenAKAOSubSection = u32();

	this.lenSubSection15 = u32();
	this.lenSubSection16 = u32();
	this.lenSubSection17 = u32();
	this.lenSubSection18 = u32();

};

VSTOOLS.MPD.prototype.roomSection = function () {

	this.geometrySection();
	this.collisionSection();
	this.SubSection03();
	this.doorSectionRoom();
	this.lightingSection();
	this.SubSection06();
	this.SubSection07();
	this.SubSection08();
	this.SubSection09();
	this.SubSection0A();
	this.SubSection0B();
	this.textureEffectsSection();
	this.SubSection0D();
	this.SubSection0E();
	this.SubSection0F();
	this.SubSection10();
	this.SubSection11();
	this.SubSection12();
	this.SubSection13();
	this.akaoSubSection();
	this.SubSection15();
	this.SubSection16();
	this.SubSection17();
	this.SubSection18();

};

VSTOOLS.MPD.prototype.geometrySection = function () {

	var u32 = this.u32, log = this.log;

	var numGroups = this.numGroups = u32();
	log( 'numGroups: ' + numGroups );

	var groups = this.groups = [];

	for ( var i = 0; i < numGroups; ++i ) {

		log( 'group ' + i + ' header' );
		groups[ i ] = new VSTOOLS.MPDGroup( this.reader, this.logger, this );
		groups[ i ].header();

	}

	for ( var i = 0; i < numGroups; ++i ) {

		log( 'group ' + i + ' data' );
		groups[ i ].data();

	}

};

VSTOOLS.MPD.prototype.collisionSection = function () {

	this.skip( this.lenCollisionSection );

};

VSTOOLS.MPD.prototype.SubSection03 = function () {

	this.skip( this.lenSubSection03 );

};

VSTOOLS.MPD.prototype.doorSectionRoom = function () {

	this.skip( this.lenDoorSectionRoom );

};

VSTOOLS.MPD.prototype.lightingSection = function () {

	this.skip( this.lenLightingSection );

};

VSTOOLS.MPD.prototype.SubSection06 = function () {

	this.skip( this.lenSubSection06 );

};

VSTOOLS.MPD.prototype.SubSection07 = function () {

	this.skip( this.lenSubSection07 );

};

VSTOOLS.MPD.prototype.SubSection08 = function () {

	this.skip( this.lenSubSection08 );

};

VSTOOLS.MPD.prototype.SubSection09 = function () {

	this.skip( this.lenSubSection09 );

};

VSTOOLS.MPD.prototype.SubSection0A = function () {

	this.skip( this.lenSubSection0A );

};

VSTOOLS.MPD.prototype.SubSection0B = function () {

	this.skip( this.lenSubSection0B );

};

VSTOOLS.MPD.prototype.textureEffectsSection = function () {

	this.skip( this.lenTextureEffectsSection );

};

VSTOOLS.MPD.prototype.SubSection0D = function () {

	this.skip( this.lenSubSection0D );

};

VSTOOLS.MPD.prototype.SubSection0E = function () {

	this.skip( this.lenSubSection0E );

};

VSTOOLS.MPD.prototype.SubSection0F = function () {

	this.skip( this.lenSubSection0F );

};

VSTOOLS.MPD.prototype.SubSection10 = function () {

	this.skip( this.lenSubSection10 );

};

VSTOOLS.MPD.prototype.SubSection11 = function () {

	this.skip( this.lenSubSection11 );

};

VSTOOLS.MPD.prototype.SubSection12 = function () {

	this.skip( this.lenSubSection12 );

};

VSTOOLS.MPD.prototype.SubSection13 = function () {

	this.skip( this.lenSubSection13 );

};

VSTOOLS.MPD.prototype.akaoSubSection = function () {

	this.skip( this.lenAKAOSubSection );

};

VSTOOLS.MPD.prototype.SubSection15 = function () {

	this.skip( this.lenSubSection15 );

};

VSTOOLS.MPD.prototype.SubSection16 = function () {

	this.skip( this.lenSubSection16 );

};

VSTOOLS.MPD.prototype.SubSection17 = function () {

	this.skip( this.lenSubSection17 );

};

VSTOOLS.MPD.prototype.SubSection18 = function () {

	this.skip( this.lenSubSection18 );

};

VSTOOLS.MPD.prototype.clearedSection = function () {

	this.skip( this.lenClearedSection );

};

VSTOOLS.MPD.prototype.scriptSection = function () {

	var u16 = this.u16, buffer = this.buffer,
		hex = VSTOOLS.hex, log = this.log;

	var len = u16();
	log( hex( this.lenScriptSection ) );
	log( hex( len ) );

	this.ptrDialogText = u16();
	log( hex( this.ptrDialogText + this.ptrScriptSection ) );

	this.skip( this.ptrDialogText );

	var s = buffer( 700 );
	log( Text.convert( s, 700 ) );

};

//

VSTOOLS.MPD.prototype.build = function () {

	var groups = this.groups, numGroups = this.numGroups;

	this.mesh = new THREE.Object3D();

	for ( var i = 0; i < numGroups; ++i ) {

		var group = groups[ i ];
		group.build();

		for ( var id in group.meshes ) {

			this.mesh.add( group.meshes[ id ].mesh );

		}

	}

};

VSTOOLS.MPD.prototype.setMaterial = function ( mat ) {

	var groups = this.groups, numGroups = this.numGroups;

	for ( var i = 0; i < numGroups; ++i ) {

		var group = groups[ i ];

		for ( var id in group.meshes ) {

			group.meshes[ id ].mesh.material = mat;

		}

	}

};
