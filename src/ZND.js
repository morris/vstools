VSTOOLS.ZND = function( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

	this.materials = {};

};

VSTOOLS.ZND.prototype.read = function() {

	this.header();
	this.data();

};

VSTOOLS.ZND.prototype.header = function() {

	var u8 = this.u8, u32 = this.u32, skip = this.skip,
		log = this.log, hex = VSTOOLS.hex;

	log( '-- ZND header' );

	this.mpdPtr = u32();
	this.mpdLen = u32();
	this.mpdNum = this.mpdLen / 8;
	this.enemyPtr = u32();
	this.enemyLen = u32();
	this.timPtr = u32();
	this.timLen = u32();
	this.wave = u8();
	skip( 7 );

	log( 'mpdNum: ' + this.mpdNum );
	log( 'timLen: ' + hex( this.timLen ) );
	log( 'tim section: ' + hex( this.timPtr ) + '-' + hex( this.timPtr + this.timLen ) );

};

VSTOOLS.ZND.prototype.data = function() {

	this.log( '-- ZND data' );

	this.mpdSection();
	this.enemiesSection();
	this.timSection();

};

VSTOOLS.ZND.prototype.mpdSection = function() {

	var mpdNum = this.mpdNum;
	var mpdLBAs = this.mpdLBAs = [];
	var mpdSizes = this.mpdSizes = [];

	for ( var i = 0; i < mpdNum; ++i) {

		mpdLBAs[i] = u32();
		mpdSizes[i] = u32();

	}

};

VSTOOLS.ZND.prototype.enemiesSection = function() {

	this.skip( this.enemyLen );

};

VSTOOLS.ZND.prototype.timSection = function() {

	var u32 = this.u32, skip = this.skip,
		log = this.log, hex = VSTOOLS.hex;

	this.timLen2 = u32();
	skip( 12 );
	var timNum = this.timNum = u32();

	log( 'timLen2: ' + hex( this.timLen2 ) );
	log( 'timNum: ' + timNum );

	var frameBuffer = this.frameBuffer = new VSTOOLS.FrameBuffer();
	var tims = this.tims = [];

	for ( var i = 0; i < timNum; ++i ) {

		// not technically part of tim, unused
		var timlen = u32();

		tims[ i ] = new VSTOOLS.TIM( this.reader, this.logger );
		tims[ i ].read();

		if ( tims[ i ].height < 5 ) {

			tims[ i ].copyToFrameBuffer( frameBuffer );

		}

	}

	//frameBuffer.markCLUT( 0 );
	//frameBuffer.markCLUT( 1 );

};

VSTOOLS.ZND.prototype.getMaterial = function( textureId, clutId ) {

	var log = this.log;

	log( clutId );

	// frameBuffer.markCLUT(clutId);

	var id = textureId + '-' + clutId;

	if ( textureId - 5 >= tims.length ) {

		// TODO

	}

	var materials = this.material;
	var material = materials[ id ];

	if ( material ) {

		return material;

	} else {

		// find texture
		var tim = tims[ textureId - 5 ];

		// find CLUT
		var x = ( clutId * 16 ) % 1024;
		var y = ( clutId * 16 ) / 1024;

		log( x + ',' + y );

		var clut = null;

		for ( var i = 0, l = tims.length; i < l; ++i ) {

			if ( tim.fx <= x && tim.fx + tim.width > x && tim.fy <= y && tim.fy + tim.height > y) {

				// we found the CLUT
				clut = tim.buildCLUT(x, y);
				break;

			}

		}

		// build texture
		material = texture.buildTexture4( clut );

		// store
		materials[ id ] = material;

		return material

	}

};
