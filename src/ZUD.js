VSTOOLS.ZUD = function ( reader, logger ) {

	reader.extend( this );
	logger.extend( this );

};

VSTOOLS.ZUD.prototype.read = function () {

	this.header();
	this.data();

};

VSTOOLS.ZUD.prototype.header = function () {

	var u8 = this.u8, u32 = this.u32,
		skip = this.skip, log = this.log, hex = VSTOOLS.hex;

	this.idCharacter = u8();
	this.idWeapon = u8();
	this.idWeaponCategory = u8();
	this.idWeaponMaterial = u8();
	this.idShield = u8();
	this.idShieldMaterial = u8();
	this.unknown = u8();
	skip( 1 ); // padding
	this.ptrCharacterSHP = u32();
	this.lenCharacterSHP = u32();
	this.ptrWeaponWEP = u32();
	this.lenWeaponWEP = u32();
	this.ptrShieldWEP = u32();
	this.lenShieldWEP = u32();
	this.ptrCommonSEQ = u32();
	this.lenCommonSEQ = u32();
	this.ptrBattleSEQ = u32();
	this.lenBattleSEQ = u32();

	log( 'ptrWeaponWEP: ' + hex( this.ptrWeaponWEP ) );
	log( 'ptrShieldWEP: ' + hex( this.ptrShieldWEP ) );
	log( 'ptrCommonSEQ: ' + hex( this.ptrCommonSEQ ) );
	log( 'ptrBattleSEQ: ' + hex( this.ptrBattleSEQ ) );

};

VSTOOLS.ZUD.prototype.data = function () {

	var reader = this.reader, logger = this.logger, seek = this.seek, log = this.log;

	this.shp = new VSTOOLS.SHP( reader, logger );
	this.shp.read();

	seek( this.ptrWeaponWEP );

	try {

		this.weapon = new VSTOOLS.WEP( reader, logger );
		this.weapon.read();

	} catch ( ex ) {

		log( 'weapon failed' );
		log( ex.stack );
		this.weapon = null;

	}

	seek( this.ptrShieldWEP );

	try {

		this.shield = new VSTOOLS.WEP( reader, logger );
		this.shield.read();

	} catch ( ex ) {

		log( 'shield failed' );
		log( ex.stack );
		this.shield = null;

	}

	seek( this.ptrCommonSEQ );

	try {

		this.com = new VSTOOLS.SEQ( reader, logger, this.shp );
		this.com.read();

	} catch ( ex ) {

		log( 'common seq failed' );
		log( ex.stack );
		this.com = null;

	}

	seek( this.ptrBattleSEQ );

	try {

		this.bt = new VSTOOLS.SEQ( reader, logger, this.shp );
		this.bt.read();

	} catch ( ex ) {

		log( 'battle seq failed' );
		log( ex.tack );
		this.bt = null;

	}

};

VSTOOLS.ZUD.prototype.build = function () {

	this.shp.build();

	if ( this.weapon ) this.weapon.build();
	if ( this.shield ) this.shield.build();
	if ( this.bt ) this.bt.build();
	if ( this.com ) this.com.build();

	this.mesh = this.shp.mesh;

};
