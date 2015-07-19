VSTOOLS.Collada = {

	export: function ( root ) {

		var collada = '';

		function n() {

			for ( var i = 0; i < arguments.length; ++i ) collada += arguments[ i ] + '\n';

		}

		function s() {

			for ( var i = 0; i < arguments.length; ++i ) collada += arguments[ i ] + ' ';

		}

		n(
			'<?xml version="1.0" encoding="utf-8"?>',
			'<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">',
				'<asset>',
					'<up_axis>Y_UP</up_axis>',
		 		'</asset>'
		);

		n( '<library_geometries>' );

		root.traverse( function ( node ) {

			var geometry = node.geometry;

			if ( !geometry ) return;

			var id = 'geometry' + node.geometry.id;
			n( '<geometry id="' + id + '" name="' + id + '"><mesh>' );

			n( '<source id="' + id + '-positions">' );
			n( '<float_array id="' + id + '-positions-array" count="' + ( geometry.vertices.length * 3 ) + '">' );
			geometry.vertices.forEach( function ( v ) {

				s( v.x, v.y, v.z );

			} );
			n( '</float_array>' );
			n(
				'<technique_common>',
					'<accessor source="#' + id + '-positions-array" count="' + geometry.vertices.length + '" stride="3">',
						'<param name="X" type="float"/>',
						'<param name="Y" type="float"/>',
						'<param name="Z" type="float"/>',
					'</accessor>',
				'</technique_common>'
			);
			n( '</source>' );

			n( '<source id="' + id + '-uv">' );
			n( '<float_array id="' + id + '-uv-array" count="' + ( geometry.faceVertexUvs[ 0 ].length * 2 ) + '">' );
			geometry.faceVertexUvs[ 0 ].forEach( function ( uv ) {

				s(
					uv[ 0 ].x, uv[ 0 ].y,
					uv[ 1 ].x, uv[ 1 ].y,
					uv[ 2 ].x, uv[ 2 ].y
				);

			} );
			n( '</float_array>' );
			n(
				'<technique_common>',
					'<accessor source="#' + id + '-uv-array" count="' + geometry.faceVertexUvs[ 0 ].length +'" stride="2">',
						'<param name="S" type="float"/>',
						'<param name="T" type="float"/>',
					'</accessor>',
				'</technique_common>'
			);
			n( '</source>' );

			n( '<vertices id="' + id + '-vertices">' );
			n( '<input semantic="POSITION" source="#' + id + '-positions"/>' );
			n( '</vertices>' );

			n( '<triangles count="' + geometry.faces.length + '">' );
			n( '<input semantic="VERTEX" source="#' + id + '-vertices" offset="0"/>' );
			n( '<input semantic="TEXCOORD" source="#' + id + '-uv" offset="2" set="1"/>' );
			n( '<p>' );
			geometry.faces.forEach( function ( f ) { s( f.a, f.b, f.c ); } );
			n('</p>' );
			n( '</triangles>' );

			n( '</mesh></geometry>' );

		} );

		n( '</library_geometries>' );
		n( '</COLLADA>' );

		return collada;

	}


};
