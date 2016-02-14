VSTOOLS.Collada = {

	export: function ( root ) {
		return this.COLLADA( root );
	},

	COLLADA: function ( root ) {
		return [
			'<?xml version="1.0" encoding="utf-8"?>',
			'<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">',
				this.asset(),
				this.library_geometries( root ),
				this.library_animations( root ),
				this.library_images( root ),
				this.library_effects( root ),
				this.library_materials( root ),
				this.library_visual_scenes( root ),
				this.scene(),
			'</COLLADA>'
		].join( '\n' );
	},

	asset: function () {
		return [
			'<asset>',
				'<created>' + (new Date).toISOString() + '</created>',
				'<modified>' + (new Date).toISOString() + '</modified>',
				'<up_axis>Y_UP</up_axis>',
			'</asset>'
		].join( '\n' );
	},

	library_geometries: function ( root ) {
		var self = this;
		var geometries = '';
		root.traverse( function ( node ) {
			if ( node.geometry ) geometries += self.geometry( node.geometry ) + '\n';
		} );

		return [
			'<library_geometries>',
				geometries,
			'</library_geometries>'
		].join( '\n' );
	},

	geometry: function ( geometry ) {
		var id = 'geometry' + geometry.id;
		var faceIndex = 0;
		return [
			'<geometry id="' + id + '" name="' + id + '">',
				'<mesh>',
					'<source id="' + id + '-positions">',
						'<float_array id="' + id + '-positions-array" count="' + ( geometry.vertices.length * 3 ) + '">',
							geometry.vertices.map( function ( v ) {
								return [ v.x, v.y, v.z ].join( ' ' );
							} ).join( ' ' ),
						'</float_array>',
						'<technique_common>',
							'<accessor source="#' + id + '-positions-array" count="' + geometry.vertices.length + '" stride="3">',
								'<param name="X" type="float"/>',
								'<param name="Y" type="float"/>',
								'<param name="Z" type="float"/>',
							'</accessor>',
						'</technique_common>',
					'</source>',
					'<source id="' + id + '-normals">',
						'<float_array id="' + id + '-normals-array" count="' + ( geometry.faces.length * 9 ) + '">',
							geometry.faces.map( function ( f ) {
								return [
									f.vertexNormals[ 0 ].x,
									f.vertexNormals[ 0 ].y,
									f.vertexNormals[ 0 ].z,
									f.vertexNormals[ 1 ].x,
									f.vertexNormals[ 1 ].y,
									f.vertexNormals[ 1 ].z,
									f.vertexNormals[ 2 ].x,
									f.vertexNormals[ 2 ].y,
									f.vertexNormals[ 2 ].z
								].join( ' ' );
							} ).join( ' ' ),
						'</float_array>',
						'<technique_common>',
							'<accessor source="#' + id + '-normals-array" count="' + ( geometry.faces.length * 3 ) + '" stride="3">',
								'<param name="X" type="float"/>',
								'<param name="Y" type="float"/>',
								'<param name="Z" type="float"/>',
							'</accessor>',
						'</technique_common>',
					'</source>',
					'<source id="' + id + '-uv">',
						'<float_array id="' + id + '-uv-array" count="' + ( geometry.faceVertexUvs[ 0 ].length * 2 ) + '">',
							geometry.faceVertexUvs[ 0 ].map( function ( uv ) {
								return [
									uv[ 0 ].x, uv[ 0 ].y,
									uv[ 1 ].x, uv[ 1 ].y,
									uv[ 2 ].x, uv[ 2 ].y
								].join( ' ' );
							} ).join( ' ' ),
						'</float_array>',
						'<technique_common>',
							'<accessor source="#' + id + '-uv-array" count="' + geometry.faceVertexUvs[ 0 ].length +'" stride="2">',
								'<param name="S" type="float"/>',
								'<param name="T" type="float"/>',
							'</accessor>',
						'</technique_common>',
					'</source>',
					'<vertices id="' + id + '-vertices">',
						'<input semantic="POSITION" source="#' + id + '-positions"/>',
					'</vertices>',
					'<triangles count="' + geometry.faces.length + '">',
						'<input semantic="VERTEX" source="#' + id + '-vertices" offset="0"/>',
						'<input semantic="NORMAL" source="#' + id + '-normals" offset="1"/>',
						'<input semantic="TEXCOORD" source="#' + id + '-uv" offset="2"/>',
						'<p>',
							geometry.faces.map( function ( f ) {
								return [
									f.a, faceIndex++, faceIndex,
									f.b, faceIndex++, faceIndex,
									f.c, faceIndex++, faceIndex,
								].join( ' ' );
							} ).join( ' ' ),
						'</p>',
					'</triangles>',
				'</mesh>',
			'</geometry>'
		].join( '\n' );
	},

	//

	library_animations: function ( root ) {
		return [

		].join( '\n' );
	},

	//

	library_images: function ( root ) {
		return [

		].join( '\n' );
	},

	//

	library_effects: function ( root ) {
		return [
			'<library_effects>',
				this.effect(),
			'</library_effects>'
		].join( '\n' );
	},

	effect: function () {
		return [
			'<effect id="defaultEffect">',
				this.profile_COMMON(),
			'</effect>'
		].join( '\n' );
	},

	profile_COMMON: function () {
		return [
			'<profile_COMMON>',
				'<technique sid="default">',
					'<phong>',
						'<emission>',
						'	<color>1.0 1.0 1.0 1.0</color>',
						'</emission>',
						'<ambient>',
							'<color>1.0 1.0 1.0 1.0</color>',
						'</ambient>',
						'<diffuse>',
							'<color>1.0 1.0 1.0 1.0</color>',
						'</diffuse>',
						'<specular>',
							'<color>1.0 1.0 1.0 1.0</color>',
						'</specular>',
						'<shininess>',
							'<float>20.0</float>',
						'</shininess>',
						'<reflective>',
							'<color>1.0 1.0 1.0 1.0</color>',
						'</reflective>',
						'<reflectivity>',
							'<float>0.5</float>',
						'</reflectivity>',
						'<transparent>',
							'<color>1.0 1.0 1.0 1.0</color>',
						'</transparent>',
						'<transparency>',
							'<float>1.0</float>',
						'</transparency>',
					'</phong>',
				'</technique>',
			'</profile_COMMON>'
		].join( '\n' );
	},

	//

	library_materials: function ( root ) {
		var self = this;
		var materials = '';
		root.traverse( function ( node ) {
			if ( node.material ) materials += self.material( node.material ) + '\n';
		} );

		return [
			'<library_materials>',
				materials,
			'</library_materials>'
		].join( '\n' );
	},

	material: function ( material ) {
		return [
			'<material id="material' + material.id + '">',
				this.instance_effect(),
			'</material>'
		].join( '\n' );
	},

	instance_effect: function () {
		return [
			'<instance_effect url="#defaultEffect">',
			'</instance_effect>'
		].join( '\n' );
	},

	//

	library_visual_scenes: function ( root ) {
		return [
			'<library_visual_scenes>',
				this.visual_scene( root ),
			'</library_visual_scenes>'
		].join( '\n' );
	},

	visual_scene: function ( root ) {
		return [
			'<visual_scene id="defaultScene">',
				this.node( root ),
			'</visual_scene>'
		].join( '\n' );
	},

	node: function ( node ) {
		return [
			'<node id="node' + node.id + '" name="node' + node.id + '">',
				'<translate>',
					node.position.x,
					node.position.y,
					node.position.z,
				'</translate>',
				'<scale>',
					node.scale.x,
					node.scale.y,
					node.scale.z,
				'</scale>',
				node.geometry ? this.instance_geometry( node.geometry, node.material ) : '',
			'</node>'
		].join( '\n' );
	},

	instance_geometry: function ( geometry, material ) {
		return [
			'<instance_geometry url="#geometry' + geometry.id + '">',
				this.bind_material( material ),
			'</instance_geometry>'
		].join( '\n' );
	},

	bind_material: function ( material ) {
		return [
			'<bind_material>',
				'<technique_common>',
					'<instance_material symbol="LOL" target="#material' + material.id + '"/>',
				'</technique_common>',
			'</bind_material>'
		].join( '\n' );
	},

	//

	scene: function () {
		return [
			'<scene>',
				'<instance_visual_scene url="#defaultScene"/>',
			'</scene>'
		].join( '\n' );
	}

};
