VSTOOLS.ZND = function ( reader ) {

	reader.extend( this );

	this.materials = {};
	this.textures = [];

};

VSTOOLS.ZND.prototype.read = function () {

	this.header();
	this.data();

};

VSTOOLS.ZND.prototype.header = function () {

	var u8 = this.u8, u32 = this.u32, skip = this.skip;

	this.mpdPtr = u32();
	this.mpdLen = u32();
	this.mpdNum = this.mpdLen / 8;
	this.enemyPtr = u32();
	this.enemyLen = u32();
	this.timPtr = u32();
	this.timLen = u32();
	this.wave = u8();
	skip( 7 );

};

VSTOOLS.ZND.prototype.data = function () {

	this.mpdSection();
	this.enemiesSection();
	this.timSection();

};

VSTOOLS.ZND.prototype.mpdSection = function () {

	var u32 = this.u32;

	var mpdNum = this.mpdNum;
	var mpdLBAs = this.mpdLBAs = [];
	var mpdSizes = this.mpdSizes = [];

	for ( var i = 0; i < mpdNum; ++i ) {

		mpdLBAs.push( u32() );
		mpdSizes.push( u32() );

	}

};

VSTOOLS.ZND.prototype.enemiesSection = function () {

	this.skip( this.enemyLen );

};

VSTOOLS.ZND.prototype.timSection = function () {

	var u32 = this.u32, skip = this.skip;

	this.timLen2 = u32();
	skip( 12 ); // TODO whats this?
	var timNum = this.timNum = u32();

	var frameBuffer = this.frameBuffer = new VSTOOLS.FrameBuffer();
	var tims = this.tims = [];

	for ( var i = 0; i < timNum; ++i ) {

		// not technically part of tim, unused
		var timlen = u32();

		var tim = new VSTOOLS.TIM( this.reader );
		tim.read();
		tim.id = i;

		if ( tim.height < 5 ) {

			tim.copyToFrameBuffer( frameBuffer );

		}

		tim.copyToFrameBuffer( frameBuffer );

		tims.push( tim );

	}

};

VSTOOLS.ZND.prototype.getMaterial = function ( textureId, clutId ) {

	//this.frameBuffer.markCLUT( clutId );
	var tims = this.tims;
	var id = textureId + '-' + clutId;

	if ( textureId - 5 >= tims.length ) {

		return new THREE.MeshNormalMaterial();

	}

	var materials = this.materials;
	var material = materials[ id ];

	if ( material ) {

		return material;

	} else {

		// find texture
		var textureTIM = tims[ textureId - 5 ];

		// find CLUT
		var x = ( clutId * 16 ) % 1024;
		var y = Math.floor( ( clutId * 16 ) / 1024 );

		var clut = null;

		for ( var i = 0, l = tims.length; i < l; ++i ) {

			var tim = tims[ i ];

			if ( tim.fx <= x && tim.fx + tim.width > x && tim.fy <= y && tim.fy + tim.height > y ) {

				// we found the CLUT
				clut = tim.buildCLUT( x, y );
				break;

			}

		}

		var texture = textureTIM.build( clut );

		this.textures.push( texture );

		// build texture
		material = new THREE.MeshBasicMaterial( {
			map: texture,
			shading: THREE.FlatShading,
			transparent: true,
			vertexColors: THREE.VertexColors
		} );

		// store
		materials[ id ] = material;

		return material;

	}

};
