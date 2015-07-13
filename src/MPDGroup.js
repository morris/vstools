VSTOOLS.MPDGroup = function ( reader, logger, mpd ) {

	reader.extend( this );
	logger.extend( this );

	this.mpd = mpd;

	this.read = function () {

		this.header();
		this.data();

	};

	this.header = function () {

		var u8 = this.u8;

		var head = this.head = [];

		for ( var i = 0; i < 64; ++i ) {

			head[ i ] = u8();

		}

		//log( hex( head, 2 ) );

		// the header is not well understood
		// it seems that the bits in the second byte are flag bits

		// the following fixes the scaling issues in maps 001 and 002
		if ( ( head[ 1 ] & 0x08 ) > 0 ) {

			this.scale = 1;

		} else {

			this.scale = 8; // TODO is this the default?

		}

	};

	this.data = function () {

		var u32 = this.u32, log = this.log;

		var triangleCount = this.triangleCount = u32();
		var quadCount = this.quadCount = u32();
		var faceCount = this.faceCount = triangleCount + quadCount;

		log( 'faceCount: ' + faceCount );

		var meshes = this.meshes = {};

		for ( var i = 0; i < triangleCount; ++i ) {

			var face = new VSTOOLS.MPDFace( this.reader, this.logger, this );
			face.read( false );

			var mesh = this.getMesh( face.textureId, face.clutId );
			mesh.add( face );

		}

		for ( var i = triangleCount; i < faceCount; ++i ) {

			var face = new VSTOOLS.MPDFace( this.reader, this.logger, this );
			face.read( true ); // quad

			var mesh = this.getMesh( face.textureId, face.clutId );
			mesh.add( face );

		}

	};

	this.build = function () {

		for ( var id in this.meshes ) {

			this.meshes[ id ].build();

		}

	};

	this.getMesh = function ( textureId, clutId ) {

		var meshes = this.meshes;
		var id = textureId + '-' + clutId;

		var mesh = meshes[ id ];

		if ( mesh ) {

			return mesh;

		} else {

			mesh = new VSTOOLS.MPDMesh( this.reader, this.logger, this, textureId, clutId );
			meshes[ id ] = mesh;
			return mesh;

		}

	};

};
