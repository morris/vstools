VSTOOLS.WEPBone = function ( reader ) {

	var s8 = reader.s8, s16 = reader.s16, skip = reader.skip;

	this.read = function () {

		this.length = -s16(); // negative

		skip( 2 ); // always 0xFFFF, no effect on bone size or model

		this.parentBoneId = s8();

		this.x = s8();
		this.y = s8();
		this.z = s8();

		this.mode = s8();

		// mode
		// 0 - 2 normal ?
		// 3 - 6 normal + roll 90 degrees
		// 7 - 255 absolute, different angles

		skip( 1 ); // unknown
		skip( 6 ); // always 0? padding?

	};

};
