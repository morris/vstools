VSTOOLS.Viewer = function( logger ) {

	logger.extend( this );

	var obj, seq, skeletonHelper, currentAnimation;

	function loadWEP( data ) {

		clean();

		obj = new VSTOOLS.WEP( new VSTOOLS.Reader( data ), logger );
		obj.read();
		obj.build( 0 );

		scene.add( obj.mesh );

	}

	function loadSHP( data ) {

		clean();

		obj = new VSTOOLS.SHP( new VSTOOLS.Reader( data ), logger );
		obj.read();
		obj.build( 0 );

		scene.add( obj.mesh );

		skeletonHelper = new THREE.SkeletonHelper( obj.mesh );
		scene.add( skeletonHelper );
		skeletonHelper.material.linewidth = 3;

	}

	function loadSEQ( data ) {

		if ( obj instanceof VSTOOLS.SHP ) {

			seq = new VSTOOLS.SEQ( new VSTOOLS.Reader( data ), logger, obj );
			seq.read();
			seq.build();

			console.log( seq );

			currentAnimation = 0;

			seq.animations[0].animation.play();

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

		skeletonHelper = new THREE.SkeletonHelper( obj.mesh );
		scene.add( skeletonHelper );
		skeletonHelper.material.linewidth = 3;

	}

	function nextAnim() {

		seq.animations[ currentAnimation ].animation.stop();
		currentAnimation = Math.min( seq.animations.length - 1, currentAnimation + 1 );
		seq.animations[ currentAnimation ].animation.play();

	}

	function prevAnim() {

		seq.animations[ currentAnimation ].animation.stop();
		currentAnimation = Math.max( 0, currentAnimation - 1 );
		seq.animations[ currentAnimation ].animation.play();

	}

	function clean() {

		if ( obj ) scene.remove( obj.mesh );
		if ( skeletonHelper ) scene.remove( skeletonHelper );

	}

	//

	var $obj = $( '#obj' );
	var $seq = $( '#seq' );
	var $load = $( '#load' );

	$load.on( 'click', function() {

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

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	$( 'body' ).append( renderer.domElement );

	camera.position.z = 100;
	var orbitControls = new THREE.OrbitControls( camera );

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
