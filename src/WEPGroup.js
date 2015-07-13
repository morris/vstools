VSTOOLS.WEPGroup = function ( reader ) {

	this.read = function () {

		this.boneId = reader.s16();
		this.lastVertex = reader.u16();

	};

};
