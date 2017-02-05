VSTOOLS.Akao = function ( reader ) {

	reader.extend( this );

};

VSTOOLS.Akao.prototype.read = function () {

	var u8 = this.u8, u16 = this.u16, u32 = this.u32;
	var skip = this.skip, seek = this.seek, pos = this.pos;

	skip( 4 ); // AKAO, 4
	this.id = u16(); // 6
	this.length = u16(); // 8
	skip( 8 ); // unknown, 16

	var mask = this.channelMask = u32();
	var channels = this.channels = [];

	for ( var i = 0; i < 32; ++i ) {

		if ( ( mask >> i ) & 1 === 1 ) {

			channels.push( { c: i, ops: [] } );

		}

	}

	var offset = this.offset = pos();

	channels.forEach( function ( channel ) {

		channel.offset = u16();

	} );

	channels.forEach( function ( channel ) {

		var ops = channel.ops;
		seek( offset + channel.offset );

		var done = false;
		while ( true ) {

			var op = u8();
			var params = [];

			switch ( op ) {

			case 0xc8:
			case 0xca:
				done = true;
				break;
			case 0xcd:
			case 0xd1:
			case 0xc2:
				break;

			case 0xa1:
			case 0xa8:
			case 0xaa:
			case 0xa3:
			case 0xa5:
				params.push( u8() );
				break;

			case 0xe8:
			case 0xea:
			case 0xfd:
			case 0xfe:
				params.push( u16() );
				break;

			case 0xb4:
				params.push( u8(), u8(), u8() );
				break;

			case 0xa0:
				done = true;
				break;
				
			default:
				done = true;

			}

			ops.push( { op: op, params: params } );

			if ( done ) break;

		}

	} );

};
