VSTOOLS.WEPVertex = function ( reader ) {

	this.read = function () {

		this.x = reader.s16();
		this.y = reader.s16();
		this.z = reader.s16();
		reader.skip( 2 ); // zero padding

		this.v = new THREE.Vector3( this.x, this.y, this.z );

	};

};
