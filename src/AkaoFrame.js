VSTOOLS.AkaoFrame = function ( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

};

VSTOOLS.AkaoFrame.prototype.read = function () {

	this.skip( 4 ); // AKAO, 4
	this.id = this.u16(); // 6
	this.length = this.u16(); // 8
	this.skip( 8 ); // unknown, 16
	this.skip( this.length ); // unknown

};
