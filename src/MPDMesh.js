VSTOOLS.MPDMesh = function( reader, logger, group, textureId, clutId ) {

	reader.extend( this );
	logger.extend( this );

	this.group = group;
	this.textureId = textureId;
	this.clutId = clutId;
	this.polygons = [];

	this.add = function( polygon ) {

		this.polygons.push( polygon );

	};

	this.build = function() {

		var polygons = this.polygons;
		var nv = 0;
		var ni = 0;

		for ( var i = 0, l = polygons.length; i < l; ++i ) {

			var p = polygons[ i ];

			if ( p.quad ) {

				nv += 4;
				ni += 6;

			} else {

				ni += 3;
				nv += 3;

			}

		}

		vertices3 = [];
		indices = [];
		normals = [];
		uv = [];
		colors = [];

		var iv = 0;
		var ii = 0;
		var colorsIndex = 0;

		for ( var i = 0, l = polygons.length; i < l; ++i ) {

			var p = polygons[ i ];

			// compute normal
			var n = new THREE.Vector3( p.p2x, p.p2y, p.p2z );
			n.crossLocal( p.p3x, p.p3y, p.p3z );
			n.normalizeLocal();
			n.negateLocal();

			if ( p.quad ) {

				vertices3[ iv + 0 ] = p.p1;
				vertices3[ iv + 1 ] = p.p2;
				vertices3[ iv + 2 ] = p.p3;
				vertices3[ iv + 3 ] = p.p4;

				// 321
				indices[ ii + 0 ] = iv + 2;
				indices[ ii + 1 ] = iv + 1;
				indices[ ii + 2 ] = iv + 0;
				// 234
				indices[ ii + 3 ] = iv + 1;
				indices[ ii + 4 ] = iv + 2;
				indices[ ii + 5 ] = iv + 3;

				normals[ iv + 0 ] = n;
				normals[ iv + 1 ] = n;
				normals[ iv + 2 ] = n;
				normals[ iv + 3 ] = n;

				// CORRECT
				uv[ iv + 0 ] = p.uv2;
				uv[ iv + 1 ] = p.uv3;
				uv[ iv + 2 ] = p.uv1;
				uv[ iv + 3 ] = p.uv4;

				colors[ colorsIndex++ ] = p.r1 / 255;
				colors[ colorsIndex++ ] = p.g1 / 255;
				colors[ colorsIndex++ ] = p.b1 / 255;
				colors[ colorsIndex++ ] = 1;

				colors[ colorsIndex++ ] = p.r2 / 255;
				colors[ colorsIndex++ ] = p.g2 / 255;
				colors[ colorsIndex++ ] = p.b2 / 255;
				colors[ colorsIndex++ ] = 1;

				colors[ colorsIndex++ ] = p.r3 / 255;
				colors[ colorsIndex++ ] = p.g3 / 255;
				colors[ colorsIndex++ ] = p.b3 / 255;
				colors[ colorsIndex++ ] = 1;

				colors[ colorsIndex++ ] = p.r4 / 255;
				colors[ colorsIndex++ ] = p.g4 / 255;
				colors[ colorsIndex++ ] = p.b4 / 255;
				colors[ colorsIndex++ ] = 1;

				iv += 4;
				ii += 6;

			} else {

				vertices3[ iv + 0 ] = p.p1;
				vertices3[ iv + 1 ] = p.p2;
				vertices3[ iv + 2 ] = p.p3;

				indices[ ii + 0 ] = iv + 2;
				indices[ ii + 1 ] = iv + 1;
				indices[ ii + 2 ] = iv;

				normals[ iv + 0 ] = n;
				normals[ iv + 1 ] = n;
				normals[ iv + 2 ] = n;

				uv[ iv + 0 ] = p.uv2;
				uv[ iv + 1 ] = p.uv3;
				uv[ iv + 2 ] = p.uv1;

				colors[ colorsIndex++ ] = p.r1 / 255;
				colors[ colorsIndex++ ] = p.g1 / 255;
				colors[ colorsIndex++ ] = p.b1 / 255;
				colors[ colorsIndex++ ] = 1;

				colors[ colorsIndex++ ] = p.r2 / 255;
				colors[ colorsIndex++ ] = p.g2 / 255;
				colors[ colorsIndex++ ] = p.b2 / 255;
				colors[ colorsIndex++ ] = 1;

				colors[ colorsIndex++ ] = p.r3 / 255;
				colors[ colorsIndex++ ] = p.g3 / 255;
				colors[ colorsIndex++ ] = p.b3 / 255;
				colors[ colorsIndex++ ] = 1;

				ii += 3;
				iv += 3;

			}

		}

		var mesh = this.mesh = new Mesh();
		mesh.setBuffer(Type.Position, 3,
				BufferUtils.createFloatBuffer(vertices3));
		mesh.setBuffer(Type.Index, 3, BufferUtils.createIntBuffer(indices));
		mesh.setBuffer(Type.Normal, 3, BufferUtils.createFloatBuffer(normals));
		mesh.setBuffer(Type.TexCoord, 2, BufferUtils.createFloatBuffer(uv));
		mesh.setBuffer(Type.Color, 4, BufferUtils.createFloatBuffer(colors));

		mesh.updateBound();
		mesh.updateCounts();

		geom = new Geometry("MPDMesh", mesh);
		geom.scale( 0.1 );
		geom.rotate( Math.PI, 0, 0 );

		if (group != null && group.mpd != null && group.mpd.znd != null) {

			geom.setMaterial( group.mpd.znd.getMaterial( textureId, clutId) );

		}

	};

};
