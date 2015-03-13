VSTOOLS.Viewer = function( logger ) {

	logger.extend( this );

	var obj, seq, skeletonHelper, currentAnimation;

	function loadWEP( data ) {

		clean();

		obj = new VSTOOLS.WEP( new VSTOOLS.Reader( data ), logger );
		obj.read();
		obj.build();

		scene.add( obj.mesh );

		renderTextures( obj.textureMap.textures );
		renderAnimationName();

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

		renderTextures( obj.textureMap.textures );
		renderAnimationName();

	}

	function loadSEQ( data ) {

		if ( obj instanceof VSTOOLS.SHP ) {

			seq = new VSTOOLS.SEQ( new VSTOOLS.Reader( data ), logger, obj );
			seq.read();
			seq.build();

			console.log( seq );

			currentAnimation = 0;

			seq.animations[0].animation.play();

			renderAnimationName();

		} else {

			throw new Error( 'Cannot load SEQ without SHP' );

		}

	}

	function loadZUD( data ) {

		clean();

		obj = new VSTOOLS.ZUD( new VSTOOLS.Reader( data ), logger );
		obj.read();
		obj.build();

		currentAnimation = 0;

		seq = obj.bt || obj.com;

		console.log( seq );

		if ( seq ) seq.animations[0].animation.play();

		scene.add( obj.mesh );

		if ( $skeleton.is( ':checked' ) ) {

			skeletonHelper = new THREE.SkeletonHelper( obj.mesh );
			scene.add( skeletonHelper );
			skeletonHelper.material.linewidth = 3;

		}

		renderTextures( obj.shp.textureMap.textures );
		renderAnimationName();

	}

	function nextAnim() {

		seq.animations[ currentAnimation ].animation.stop();
		currentAnimation = Math.min( seq.animations.length - 1, currentAnimation + 1 );
		seq.animations[ currentAnimation ].animation.play();

		renderAnimationName();

	}

	function prevAnim() {

		seq.animations[ currentAnimation ].animation.stop();
		currentAnimation = Math.max( 0, currentAnimation - 1 );
		seq.animations[ currentAnimation ].animation.play();

		renderAnimationName();

	}

	function renderAnimationName() {

		$animation.html( 'Animation ' + currentAnimation );

	}

	function renderTextures( textures ) {

		$( '#textures' ).empty();

		textures.forEach( function( texture ) {

			$( '#textures' ).append( '<img src="' + VSTOOLS.png( texture.image.data, texture.image.width, texture.image.height ) + '">' );

		} );

	}

	function clean() {

		if ( obj ) scene.remove( obj.mesh );
		if ( skeletonHelper ) scene.remove( skeletonHelper );

	}

	//

	var $obj = $( '#obj' );
	var $seq = $( '#seq' );
	var $load = $( '#load' );
	var $keyframes = $( '#keyframes' );
	var $skeleton = $( '#skeleton' );

	$load.on( 'click', function() {

		VSTOOLS.enableKeyFrames = $keyframes.is( ':checked' );

		var fobj = $obj[0].files[0];
		var fseq = $seq[0].files[0];

		var reader = new FileReader();
		reader.onload = function() {

			var filename = fobj.name;
			var data = reader.result;

			var ext = VSTOOLS.ext( filename );
			var data = new Int8Array( data );

			if ( ext === 'wep' ) {

				loadWEP( data );

			} else if ( ext === 'shp' ) {

				loadSHP( data );

				if ( fseq ) reader2.readAsArrayBuffer( fseq );

			} else if ( ext === 'zud' ) {

				loadZUD( data );

			} else {

				throw new Error( 'Unknown file extension ' + ext );

			}

		};

		var reader2 = new FileReader();
		reader2.onload = function() {

			loadSEQ( new Int8Array( reader2.result ) );

		};

		reader.readAsArrayBuffer( fobj );

	} );

	var $next = $( '#next' );
	var $prev = $( '#prev' );

	$next.on( 'click', nextAnim );
	$prev.on( 'click', prevAnim );

	//

	var toExport;
	var $ex = $( '#export' );

	$ex.on( 'click', function() {

		var bad = toExport.toJSON();
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

	} );

	var exportString = function ( output ) {

		var blob = new Blob( [ output ], { type: 'text/plain' } );
		var objectURL = URL.createObjectURL( blob );

		window.open( objectURL, '_blank' );
		window.focus();

	};

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

	//

	var $sidebar = $( '#sidebar' );
	var $animation = $( '#animation' );
	var $textures = $( '#textures' );

	$sidebar.on( 'click', 'h2', function() {

		$( this ).toggleClass( 'collapsed' );

	} );

	//

	$( '#exportObj' ).on( 'click', function() {

		var x = obj.shp || obj;
		var snapshot = obj.geometrySnapshot();

		var exporter = new THREE.OBJExporter();

		exportString( exporter.parse( snapshot ) );

		/*var mesh = new THREE.Mesh( snapshot, new THREE.MeshNormalMaterial() );
		console.log( mesh );
		scene.remove( obj.mesh );
		mesh.position.y = 20;
		scene.add( mesh );*/

	} );

	//

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	$( 'body' ).append( renderer.domElement );

	camera.position.z = 100;
	var orbitControls = new THREE.OrbitControls( camera, renderer.domElement );

	var render = function () {

		requestAnimationFrame( render );

		orbitControls.update();

		if ( skeletonHelper ) skeletonHelper.update();

		THREE.AnimationHandler.update( 0.01 );

		renderer.render( scene, camera );

	};

	$( window ).on( 'resize', function() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );

	} );

	this.run = function() {

		render();

	};

};
