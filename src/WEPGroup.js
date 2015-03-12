VSTOOLS.WEPGroup = function( reader ) {

	this.read = function() {

		this.jointId = reader.s16();
		this.lastVertex = reader.u16();

	};

};
