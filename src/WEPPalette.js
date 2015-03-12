VSTOOLS.WEPPalette = function( reader ) {

	this.read = function( size ) {

		this.size = size;
		this.colors = [];

		for ( var i = 0; i < size; ++i ) {

			this.colors.push( VSTOOLS.color( reader.u16() ) );

		}

	};

};
