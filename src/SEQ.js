VSTOOLS.SEQ = function ( reader, logger, shp ) {

	reader.extend( this );
	logger.extend( this );

	this.shp = shp;

};

VSTOOLS.SEQ.prototype.read = function () {

	this.header();
	this.data();

};

VSTOOLS.SEQ.prototype.header = function () {

	var u8 = this.u8, u16 = this.u16, u32 = this.u32,
		skip = this.skip, log = this.log, hex = VSTOOLS.hex;

	log( '-- SEQ header' );

	this.ramPtr = 0x125e9e; // TODO fix this for ashley?
	this.ramPtr = 0;

	// base ptr needed because seq may be embedded
	this.basePtr = this.reader.pos();

	this.numSlots = u16(); // 'slots' is just some random name, purpose unknown
	this.numBones = u8();
	skip( 1 ); // padding

	this.size = u32(); // file size
	this.h3 = u32(); // unknown
	this.slotPtr = u32() + 8; // ptr to slots
	this.dataPtr = this.slotPtr + this.numSlots; // ptr to rotation and keyframe data

	log( 'numSlots: ' + this.numSlots );
	log( 'numBones: ' + this.numBones );
	log( 'h3: ' + this.h3 );
	log( 'dataPtr ' + hex( this.dataPtr ) );

};

VSTOOLS.SEQ.prototype.data = function () {

	var s8 = this.s8, skip = this.skip, log = this.log;

	log( '-- SEQ data' );

	var dataPtr = this.dataPtr, numBones = this.numBones, numSlots = this.numSlots;

	// number of animations has to be computed
	//                                         length of all headers     /   length of one animation header
	var numAnimations = this.numAnimations = ( dataPtr - numSlots - 16 ) / ( numBones * 4 + 10 );
	log( 'numAnimations: ' + numAnimations );

	log( '-- SEQ animation headers' );

	// read animation headers
	var animations = this.animations = [];

	for ( var i = 0; i < numAnimations; ++i ) {

		var animation = new VSTOOLS.SEQAnimation( this.reader, this.logger, this );
		animation.header( i );

		animations.push( animation );

	}

	// read 'slots'
	// these are animation ids, can be used as in this.animations[ id ].
	// purpose unknown
	var numSlots = this.numSlots;
	var slots = this.slots = [];

	for ( var i = 0; i < numSlots; ++i ) {

		slots[ i ] = s8();

	}

	log('-- SEQ animation data');

	// read animation data
	for ( var i = 0; i < numAnimations; ++i ) {

		animations[ i ].data();

	}

};

VSTOOLS.SEQ.prototype.build = function () {

	var numAnimations = this.numAnimations, animations = this.animations;

	for ( var i = 0; i < numAnimations; ++i ) {

		animations[ i ].build();

	}

};

VSTOOLS.SEQ.prototype.ptrData = function ( i ) {

	return i + this.dataPtr + this.basePtr;

};
