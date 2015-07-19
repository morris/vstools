VSTOOLS.Viewer = function () {

	//

	var scene = this.scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 10000 );

	var renderer = new THREE.WebGLRenderer();

	resize();

	$( 'body' ).append( renderer.domElement );

	camera.position.z = 500;
	var orbitControls = new THREE.OrbitControls( camera, renderer.domElement );

	function render() {

		requestAnimationFrame( render );

		orbitControls.update();

		if ( skeletonHelper ) skeletonHelper.update();

		THREE.AnimationHandler.update( 0.01 );

		renderer.render( scene, camera );

	}

	function resize() {

		setTimeout( function () {

			camera.aspect =  ( window.innerWidth - 360 ) / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( ( window.innerWidth - 360 ), window.innerHeight );

		}, 1 );

	}

	$( window ).on( 'resize', resize );

	this.run = function () {

		render();

	};

	//

	var self = this;

	var obj, seq, znd, skeletonHelper;

	//

	var $sidebar = $( '#sidebar' );

	$sidebar.on( 'click', 'h2', function () {

		$( this ).toggleClass( 'collapsed' );

	} );

	//

	var $file1 = $( '#file1' );
	var $file2 = $( '#file2' );
	var $load = $( '#load' );
	var $skeleton = $( '#skeleton' );

	$load.on( 'click', load );

	//

	var $next = $( '#next' );
	var $prev = $( '#prev' );

	$next.on( 'click', nextAnim );
	$prev.on( 'click', prevAnim );

	//

	var $animation = $( '#animation' );
	var $animationCount = $( '#animationCount' );
	$animation.on( 'change', updateAnim );

	//

	var $textures = $( '#textures' );

	//

	var $exportOBJ = $( '#exportOBJ' );
	$exportOBJ.on( 'click', exportOBJ );
	var $exportJSON = $( '#exportJSON' );
	$exportJSON.on( 'click', exportJSON );

	//

	// loading

	function load() {

		var f1 = $file1[ 0 ].files[ 0 ];
		var f2 = $file2[ 0 ].files[ 0 ];

		var reader = new FileReader();
		reader.onload = function () {

			var filename = f1.name;
			var ext = VSTOOLS.ext( filename );
			var data = new Uint8Array( reader.result );

			if ( ext === 'wep' ) {

				loadWEP( data );

			} else if ( ext === 'shp' ) {

				loadSHP( data );

			} else if ( ext === 'zud' ) {

				loadZUD( data );

			} else if ( ext === 'znd' ) {

				loadZND( data );

			} else if ( ext === 'arm' ) {

				loadARM( data );

			} else {

				throw new Error( 'Unknown file extension ' + ext );

			}

			if ( f2 ) reader2.readAsArrayBuffer( f2 );

		};

		var reader2 = new FileReader();
		reader2.onload = function () {

			var filename = f2.name;
			var ext = VSTOOLS.ext( filename );
			var data = new Uint8Array( reader2.result );

			if ( ext === 'seq' ) {

				loadSEQ( data );

			} else if ( ext === 'mpd' ) {

				loadMPD( data );

			} else {

				throw new Error( 'Unknown file extension ' + ext );

			}

		};

		reader.readAsArrayBuffer( f1 );

	}

	function loadWEP( data ) {

		clean();

		obj = new VSTOOLS.WEP( new VSTOOLS.Reader( data ) );
		obj.read();
		obj.build();

		scene.add( obj.mesh );

		updateTextures( obj.textureMap.textures );
		updateAnim();

	}

	function loadSHP( data ) {

		clean();

		obj = new VSTOOLS.SHP( new VSTOOLS.Reader( data ) );
		obj.read();
		obj.build();

		scene.add( obj.mesh );

		if ( $skeleton.is( ':checked' ) ) {

			skeletonHelper = new THREE.SkeletonHelper( obj.mesh );
			scene.add( skeletonHelper );
			skeletonHelper.material.linewidth = 3;

		}

		updateTextures( obj.textureMap.textures );
		updateAnim();

	}

	function loadSEQ( data ) {

		if ( obj instanceof VSTOOLS.SHP ) {

			stopAnim();

			seq = new VSTOOLS.SEQ( new VSTOOLS.Reader( data ), obj );
			seq.read();
			seq.build();

			updateAnim();

		} else {

			throw new Error( 'Cannot load SEQ without SHP' );

		}

	}

	function loadZUD( data ) {

		clean();

		obj = new VSTOOLS.ZUD( new VSTOOLS.Reader( data ) );
		obj.read();
		obj.build();

		seq = obj.bt || obj.com;

		if ( seq ) seq.animations[0].animation.play();

		scene.add( obj.mesh );

		if ( $skeleton.is( ':checked' ) ) {

			skeletonHelper = new THREE.SkeletonHelper( obj.mesh );
			scene.add( skeletonHelper );
			skeletonHelper.material.linewidth = 3;

		}

		updateTextures( obj.shp.textureMap.textures );
		updateAnim();

	}

	function loadZND( data ) {

		clean();

		znd = new VSTOOLS.ZND( new VSTOOLS.Reader( data ) );
		znd.read();

		znd.frameBuffer.build();

		updateTextures( znd.textures );

	}

	function loadMPD( data ) {

		clean();

		obj = new VSTOOLS.MPD( new VSTOOLS.Reader( data ), znd );
		obj.read();
		obj.build();

		scene.add( obj.mesh );

		if ( znd ) updateTextures( znd.textures );

	}

	function loadARM( data ) {

		clean();

		obj = new VSTOOLS.ARM( new VSTOOLS.Reader( data ) );
		obj.read();
		obj.build();

		scene.add( obj.object );

		updateTextures( [] );

	}

	function clean() {

		stopAnim();

		if ( obj ) scene.remove( obj.mesh );
		if ( skeletonHelper ) scene.remove( skeletonHelper );

	}

	// animation

	function nextAnim() {

		$animation.val( parseAnim() + 1 );

		updateAnim();

	}

	function prevAnim() {

		$animation.val( parseAnim() - 1 );

		updateAnim();

	}

	function updateAnim() {

		if ( !seq ) {

			return;

		}

		stopAnim();

		var id = parseAnim();

		seq.animations[ id ].animation.play();

		$animation.val( id );
		$animationCount.html( '0&ndash;' + ( seq.animations.length - 1 ) );

	}

	function parseAnim() {

		if ( !seq ) return 0;

		var id = parseInt( $animation.val() );

		if ( !id ) id = 0;

		id = Math.min( seq.animations.length - 1,  Math.max( 0, id ) );

		return id;

	}

	function stopAnim() {

		if ( !seq ) return;

		for ( var i = 0, l = seq.animations.length; i < l; ++i ) {

			seq.animations[ i ].animation.stop();

		}

	}

	// textures

	function updateTextures( textures ) {

		$( '#textures' ).empty();

		if ( !textures ) return;

		textures.forEach( function ( texture ) {

			$( '#textures' ).append( '<img src="' + VSTOOLS.png( texture.image.data, texture.image.width, texture.image.height ) + '">' );

		} );

	}

	// export

	function exportOBJ() {

		var x = obj.shp || obj;
		var snapshot = obj.geometrySnapshot();

		var exporter = new THREE.OBJExporter();

		exportString( exporter.parse( snapshot ) );

	}

	function exportJSON() {

		var t = obj.shp || obj;
		var toExport = t.mesh.geometry;
		var anim = t.seq || seq;

		toExport.computeFaceNormals();

		var output = {
			metadata: {
				formatVersion: 3.1,
				type: 'Geometry',
				generatedBy: 'vstools',
				vertices: toExport.vertices.length,
				faces: toExport.faces.length,
				normals: toExport.faces.length,
				colors: 0,
				uvs: [ toExport.faces.length ],
				materials: 0,
				morphTargets: 0,
				bones: toExport.bones.length
			},
			"materials": [ {
				"DbgColor" : 15658734, // => 0xeeeeee
				"DbgIndex" : 0,
				"DbgName" : "dummy",
				"colorDiffuse" : [ 1, 0, 0 ],
			} ],

			scale: 1.0,
			vertices: flatten3( toExport.vertices ),
			morphTargets: [],
			normals: normals(),
			colors: [],
			uvs: [ uvs() ],
			faces: faces( toExport.faces ),
			bones: bones( toExport.bones ),
			influencesPerVertex: 2,
			skinIndices: skin( toExport.skinIndices ),
			skinWeights: skin( toExport.skinWeights ),
			animations: animations( anim.animations )
		};

		output = JSON.stringify( output, null, '\t' );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );
		exportString( output );

		function normals() {

			var flat = [];
			toExport.faces.forEach( function ( f ) {

				flat.push( f.vertexNormals[ 0 ].x, f.vertexNormals[ 0 ].y, f.vertexNormals[ 0 ].z );
				flat.push( f.vertexNormals[ 1 ].x, f.vertexNormals[ 1 ].y, f.vertexNormals[ 1 ].z );
				flat.push( f.vertexNormals[ 2 ].x, f.vertexNormals[ 2 ].y, f.vertexNormals[ 2 ].z );

			} );
			return flat;

		}

		function uvs() {

			var flat = [];
			toExport.faceVertexUvs[ 0 ].forEach( function ( f ) {

				flat.push(
					f[ 2 ].x, f[ 2 ].y,
					f[ 1 ].x, f[ 1 ].y,
					f[ 0 ].x, f[ 0 ].y
				);

			} );
			return flat;

		}

		function faces( arr ) {

			var flat = [];
			var i = 0;
			arr.forEach( function ( f ) {

				flat.push(
					2 + 8 + 32,
					f.a, f.b, f.c,
					0,
					f.a, f.b, f.c,
					f.a, f.b, f.c
				);
				++i;

			} );
			return flat;

		}

		function bones( arr ) {

			return arr;

		}

		function flatten2( arr ) {

			var flat = [];
			arr.forEach( function ( v ) { flat.push( v.x, v.y ); } );
			return flat;

		}

		function flatten3( arr ) {

			var flat = [];
			arr.forEach( function ( v ) { flat.push( v.x, v.y, v.z ); } );
			return flat;

		}

		function skin( arr ) {

			var flat = [];
			arr.forEach( function ( v ) { flat.push( v.x, v.y ); } );
			return flat;

		}

		function animations( arr ) {

			return arr.map( function ( a ) {

				delete a.animationData.initialized;
				return quat2arr( a.animationData );

			} );

		}

		function quat2arr( q ) {

			if ( q instanceof THREE.Quaternion ) {

				return [ q.x, q.y, q.z, q.w ];

			} else if ( q.forEach ) {

				for ( var i = 0; i < q.length; ++i ) {

					q[ i ] = quat2arr( q[ i ] );

				}

			} else if ( q !== null && typeof q === 'object' ) {

				for ( var p in q ) {

					if ( q.hasOwnProperty( p ) ) q[ p ] = quat2arr( q[ p ] );

				}

			}

			return q;

		}

	}

	function exportString( output ) {

		var blob = new Blob( [ output ], { type: 'text/plain' } );
		var objectURL = URL.createObjectURL( blob );

		window.open( objectURL, '_blank' );
		window.focus();

	}

};
