VSTOOLS.Viewer = function() {

	//

	var scene = new THREE.Scene();
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

		camera.aspect =  ( window.innerWidth - 360 ) / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( ( window.innerWidth - 360 ), window.innerHeight );

	}

	$( window ).on( 'resize', resize );

	this.run = function() {

		render();

	};

	//

	var self = this;

	var obj, seq, skeletonHelper;

	var logger = new VSTOOLS.Logger();
	logger.extend( this );

	//

	var $sidebar = $( '#sidebar' );

	$sidebar.on( 'click', 'h2', function() {

		$( this ).toggleClass( 'collapsed' );

	} );

	//

	var $file1 = $( '#file1' );
	var $file2 = $( '#file2' );
	var $load = $( '#load' );
	var $keyframes = $( '#keyframes' );
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

	//

	var $logFilter = $( '#logFilter' );
	$logFilter.on( 'change', updateLogFilter );

	updateLogFilter();

	//

	// loading

	function load() {

		VSTOOLS.enableKeyframes = $keyframes.is( ':checked' );

		var f1 = $file1[ 0 ].files[ 0 ];
		var f2 = $file2[ 0 ].files[ 0 ];

		var reader = new FileReader();
		reader.onload = function() {

			var filename = f1.name;
			var ext = VSTOOLS.ext( filename );
			var data = new Int8Array( reader.result );

			if ( ext === 'wep' ) {

				loadWEP( data );

			} else if ( ext === 'shp' ) {

				loadSHP( data );

			} else if ( ext === 'zud' ) {

				loadZUD( data );

			} else if ( ext === 'znd' ) {

				loadZND( data );

			} else {

				throw new Error( 'Unknown file extension ' + ext );

			}

			if ( f2 ) reader2.readAsArrayBuffer( f2 );

		};

		var reader2 = new FileReader();
		reader2.onload = function() {

			var filename = f2.name;
			var ext = VSTOOLS.ext( filename );
			var data = new Int8Array( reader2.result );

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

		obj = new VSTOOLS.WEP( new VSTOOLS.Reader( data ), logger );
		obj.read();
		obj.build();

		scene.add( obj.mesh );

		updateTextures( obj.textureMap.textures );
		updateAnim();

	}

	function loadSHP( data ) {

		clean();

		obj = new VSTOOLS.SHP( new VSTOOLS.Reader( data ), logger );
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

			seq = new VSTOOLS.SEQ( new VSTOOLS.Reader( data ), logger, obj );
			seq.read();
			seq.build();

			updateAnim();

		} else {

			throw new Error( 'Cannot load SEQ without SHP' );

		}

	}

	function loadZUD( data ) {

		clean();

		obj = new VSTOOLS.ZUD( new VSTOOLS.Reader( data ), logger );
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

		// TODO

	}

	function loadMPD( data ) {

		clean();

		// TODO

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

			$animation.val( '' );
			return;

		}

		stopAnim();

		var id = parseAnim();

		seq.animations[ id - 1 ].animation.play();

		$animation.val( id );
		$animationCount.html( seq.animations.length );

	}

	function parseAnim() {

		if ( !seq ) return 1;

		var id = parseInt( $animation.val() );

		if ( !id ) id = 1;

		id = Math.min( seq.animations.length,  Math.max( 1, id ) );

		return id;

	}

	function stopAnim() {

		if ( !seq ) return;

		for ( var i = 0, l = seq.animations.length; i < l; ++i ) {

			seq.animations[ i ].animation.stop();

		}

	}

	// log filter

	function updateLogFilter() {

		var filter = $logFilter.val();

		try {

			filter = new Function( 'obj', filter );

		} catch ( ex ) {

			console.warn( ex );
			filter = function() { return false; };

		}

		self.logger.filter = filter;

	}

	// textures

	function updateTextures( textures ) {

		$( '#textures' ).empty();

		textures.forEach( function( texture ) {

			$( '#textures' ).append( '<img src="' + VSTOOLS.png( texture.image.data, texture.image.width, texture.image.height ) + '">' );

		} );

	}

	// export

	function exportOBJ() {

		var x = obj.shp || obj;
		var snapshot = obj.geometrySnapshot();

		var exporter = new THREE.OBJExporter();

		exportString( exporter.parse( snapshot ) );

		//var mesh = new THREE.Mesh( snapshot, new THREE.MeshNormalMaterial() );
		//scene.remove( obj.mesh );
		//mesh.position.y = 20;
		//scene.add( mesh );

	}

	// TODO
	function exportJSON() {

		var x = obj.shp || obj;
		var bad = x.toJSON();
		var output = {
			metadata: {
				"formatVersion": 3.1,
				"type": "Geometry",
				"generator": "GeometryExporter"
			},
			scale: 1.0,
			vertices: flatten3( toExport.vertices ),
			faces: faces( toExport.faces ),
			//uvs: uvs( toExport.faceVertexUvs ),
			skinIndices: flatten4( toExport.skinIndices ),
			skinWeights: flatten4( toExport.skinWeights ),
			bones: toExport.bones

		};

		output = JSON.stringify( output, null, '\t' );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );
		exportString( output );

		function faces( arr ) {

			var flat = [];
			arr.forEach( function( f ) { flat.push( 0, f.a, f.b, f.c ); } );
			return flat;

		};

		function flatten2( arr ) {

			var flat = [];
			arr.forEach( function( v ) { flat.push( v.x, v.y ); } );
			return flat;

		}

		function flatten3( arr ) {

			var flat = [];
			arr.forEach( function( v ) { flat.push( v.x, v.y, v.z ); } );
			return flat;

		}

		function flatten4( arr ) {

			var flat = [];
			arr.forEach( function( v ) { flat.push( v.x, v.y, v.z, v.w ); } );
			return flat;

		}

	}

	function exportString( output ) {

		var blob = new Blob( [ output ], { type: 'text/plain' } );
		var objectURL = URL.createObjectURL( blob );

		window.open( objectURL, '_blank' );
		window.focus();

	}

};
