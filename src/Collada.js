VSTOOLS.Collada = {
  export: function (root) {
    return '<?xml version="1.0" encoding="utf-8"?>\n' + this.COLLADA(root);
  },

  COLLADA: function (root) {
    return [
      '<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">',
      this.asset(),
      this.library_animations(root),
      this.library_animation_clips(root),
      this.library_cameras(root),
      this.library_controllers(root),
      this.library_effects(root),
      this.library_force_fields(root),
      this.library_geometries(root),
      this.library_images(root),
      this.library_lights(root),
      this.library_materials(root),
      this.library_nodes(root),
      this.library_physics_materials(root),
      this.library_physics_models(root),
      this.library_physics_scenes(root),
      this.library_visual_scenes(root),
      this.scene(root),
      this.extra(root),
      '</COLLADA>',
    ].join('\n');
  },

  asset: function () {
    return [
      '<asset>',
      '<created>' + new Date().toISOString() + '</created>',
      '<modified>' + new Date().toISOString() + '</modified>',
      '<up_axis>Y_UP</up_axis>',
      '</asset>',
    ].join('\n');
  },

  //

  library_animations: function (root) {
    var self = this;
    var animations = '';
    root.traverse(function (node) {
      if (node.geometry) animations += self.animation(node.geometry) + '\n';
    });

    return ['<library_animations>', animations, '</library_animations>'].join(
      '\n'
    );
  },

  animation: function (anim) {
    return ['<animation name="" id="">', animations, '</animation>'].join('\n');
  },

  //

  library_animation_clips: function (root) {
    var self = this;
    var animation_clips = '';
    root.traverse(function (node) {
      if (node.geometry)
        animation_clips += self.animation_clip(node.geometry) + '\n';
    });

    return [
      '<library_animation_clips>',
      animation_clips,
      '</library_animation_clips>',
    ].join('\n');
  },

  animation_clip: function (anim) {
    return [
      '<animation_clip id="" start="" end="">',
      '<instance_animation url=""/>',
      '</animation_clip>',
    ].join('\n');
  },

  //

  library_cameras: function (root) {
    var cameras = '';
    return ['<library_cameras>', cameras, '</library_cameras>'].join('\n');
  },

  //

  library_controllers: function (root) {
    var self = this;
    var controllers = '';
    root.traverse(function (node) {
      if (node instanceof THREE.SkinnedMesh)
        controllers += self.controller_skin(node) + '\n';
    });

    return [
      '<library_controllers>',
      controllers,
      '</library_controllers>',
    ].join('\n');
  },

  controller_skin: function (node) {
    var id = 'skin' + node.id;
    return [
      '<controller id="' + id + '">',
      this.skin(node),
      '</controller>',
    ].join('\n');
  },

  skin: function (node) {
    var geometry = node.geometry;
    var bones = node.skeleton.bones;
    var id = 'skin' + node.id;
    return [
      '<skin source="#geometry' + geometry.id + '">',

      '<source id="' + id + '_joints">',
      '<Name_array id="' + id + '_joints_array" count="' + bones.length + '">',
      bones
        .map(function (bone) {
          return 'bone' + bone.id;
        })
        .join(' '),
      '</Name_array>',
      '<technique_common>',
      '<accessor source="#' +
        id +
        '_joints_array" count="' +
        bones.length +
        '" stride="1">',
      '<param name="JOINT" type="Name"/>',
      '</accessor>',
      '</technique_common>',
      '</source>',

      '<source id="' + id + '_weights">',
      '<float_array id="' +
        id +
        '_weights_array" count="' +
        geometry.vertices.length * 4 +
        '">',
      geometry.skinWeights
        .map(function (weight) {
          return [weight.x, weight.y, weight.z, weight.w].join(' ');
        })
        .join('  '),
      '</float_array>',
      '<technique_common>',
      '<accessor source="#' +
        id +
        '_weights_array" count="' +
        geometry.vertices.length * 4 +
        '" stride="1">',
      '<param name="WEIGHT" type="float"/>',
      '</accessor>',
      '</technique_common>',
      '</source>',

      '<source id="' + id + '_inv_bind_matrices">',
      '<float_array id="' +
        id +
        '_inv_bind_matrices_array" count="' +
        bones.length * 16 +
        '">',
      bones
        .map(function (bone) {
          var m = bone.matrix.elements;
          return [
            m[0],
            m[1],
            m[2],
            m[3],
            m[4],
            m[5],
            m[6],
            m[7],
            m[8],
            m[9],
            m[10],
            m[11],
            m[12],
            m[13],
            m[14],
            m[15],
          ].join(' ');
        })
        .join('  '),
      '</float_array>',
      '<technique_common>',
      '<accessor source="#' +
        id +
        '_inv_bind_matrices_array" count="' +
        bones.length +
        '" stride="16">',
      '<param name="TRANSFORM" type="float4x4"/>',
      '</accessor>',
      '</technique_common>',
      '</source>',

      '<joints>',
      '<input semantic="JOINT" source="#' + id + '_joints"/>',
      '<input semantic="INV_BIND_MATRIX" source="#' +
        id +
        '_inv_bind_matrices"/>',
      '</joints>',

      '<vertex_weights count="' + geometry.vertices.length + '">',
      '<input semantic="JOINT" source="#' + id + '_joints" offset="0"/>',
      '<input semantic="WEIGHTS" source="#' + id + '_weights" offset="1"/>',
      '<vcount>',
      geometry.vertices
        .map(function () {
          return 4;
        })
        .join(' '),
      '</vcount>',
      this.v(geometry),
      '</vertex_weights>',

      '</skin>',
    ].join('\n');
  },

  v: function (geometry) {
    var list = [];
    var weightIndex = 0;
    for (var i = 0; i < geometry.vertices.length; ++i) {
      list.push(
        [
          geometry.skinIndices[i].x,
          weightIndex++,
          geometry.skinIndices[i].y,
          weightIndex++,
          geometry.skinIndices[i].z,
          weightIndex++,
          geometry.skinIndices[i].w,
          weightIndex++,
        ].join(' ')
      );
    }
    return ['<v>', list.join('  '), '</v>'].join('\n');
  },

  //

  library_effects: function (root) {
    return ['<library_effects>', this.effect(), '</library_effects>'].join(
      '\n'
    );
  },

  // stubbed
  effect: function () {
    return [
      '<effect id="defaultEffect">',
      this.profile_COMMON(),
      '</effect>',
    ].join('\n');
  },

  // stubbed
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
      '</profile_COMMON>',
    ].join('\n');
  },

  //

  library_geometries: function (root) {
    var self = this;
    var geometries = '';
    root.traverse(function (node) {
      if (node.geometry) geometries += self.geometry(node.geometry) + '\n';
    });

    return ['<library_geometries>', geometries, '</library_geometries>'].join(
      '\n'
    );
  },

  geometry: function (geometry) {
    var id = 'geometry' + geometry.id;
    var faceIndex = 0;
    return [
      '<geometry id="' + id + '" name="' + id + '">',
      '<mesh>',
      '<source id="' + id + '_positions">',
      '<float_array id="' +
        id +
        '_positions_array" count="' +
        geometry.vertices.length * 3 +
        '">',
      geometry.vertices
        .map(function (v) {
          return [v.x, v.y, v.z].join(' ');
        })
        .join(' '),
      '</float_array>',
      '<technique_common>',
      '<accessor source="#' +
        id +
        '_positions_array" count="' +
        geometry.vertices.length +
        '" stride="3">',
      '<param name="X" type="float"/>',
      '<param name="Y" type="float"/>',
      '<param name="Z" type="float"/>',
      '</accessor>',
      '</technique_common>',
      '</source>',
      '<source id="' + id + '_normals">',
      '<float_array id="' +
        id +
        '_normals_array" count="' +
        geometry.faces.length * 9 +
        '">',
      geometry.faces
        .map(function (f) {
          return [
            f.vertexNormals[0].x,
            f.vertexNormals[0].y,
            f.vertexNormals[0].z,
            f.vertexNormals[1].x,
            f.vertexNormals[1].y,
            f.vertexNormals[1].z,
            f.vertexNormals[2].x,
            f.vertexNormals[2].y,
            f.vertexNormals[2].z,
          ].join(' ');
        })
        .join(' '),
      '</float_array>',
      '<technique_common>',
      '<accessor source="#' +
        id +
        '_normals_array" count="' +
        geometry.faces.length * 3 +
        '" stride="3">',
      '<param name="X" type="float"/>',
      '<param name="Y" type="float"/>',
      '<param name="Z" type="float"/>',
      '</accessor>',
      '</technique_common>',
      '</source>',
      '<source id="' + id + '_uv">',
      '<float_array id="' +
        id +
        '_uv_array" count="' +
        geometry.faceVertexUvs[0].length * 2 +
        '">',
      geometry.faceVertexUvs[0]
        .map(function (uv) {
          return [uv[0].x, uv[0].y, uv[1].x, uv[1].y, uv[2].x, uv[2].y].join(
            ' '
          );
        })
        .join(' '),
      '</float_array>',
      '<technique_common>',
      '<accessor source="#' +
        id +
        '_uv_array" count="' +
        geometry.faceVertexUvs[0].length +
        '" stride="2">',
      '<param name="S" type="float"/>',
      '<param name="T" type="float"/>',
      '</accessor>',
      '</technique_common>',
      '</source>',
      '<vertices id="' + id + '_vertices">',
      '<input semantic="POSITION" source="#' + id + '_positions"/>',
      '</vertices>',
      '<triangles count="' + geometry.faces.length + '">',
      '<input semantic="VERTEX" source="#' + id + '_vertices" offset="0"/>',
      '<input semantic="NORMAL" source="#' + id + '_normals" offset="1"/>',
      '<input semantic="TEXCOORD" source="#' + id + '_uv" offset="2"/>',
      '<p>',
      geometry.faces
        .map(function (f) {
          return [
            f.a,
            faceIndex,
            faceIndex++,
            f.b,
            faceIndex,
            faceIndex++,
            f.c,
            faceIndex,
            faceIndex++,
          ].join(' ');
        })
        .join(' '),
      '</p>',
      '</triangles>',
      '</mesh>',
      '</geometry>',
    ].join('\n');
  },

  //

  library_images: function (root) {
    return [].join('\n');
  },

  //

  library_materials: function (root) {
    var self = this;
    var materials = '';
    root.traverse(function (node) {
      if (node.material) materials += self.material(node.material) + '\n';
    });

    return ['<library_materials>', materials, '</library_materials>'].join(
      '\n'
    );
  },

  // stubbed
  material: function (material) {
    return [
      '<material id="material' + material.id + '">',
      this.instance_effect(),
      '</material>',
    ].join('\n');
  },

  // stubbed
  instance_effect: function () {
    return [
      '<instance_effect url="#defaultEffect">',
      '</instance_effect>',
    ].join('\n');
  },

  //

  library_visual_scenes: function (root) {
    return [
      '<library_visual_scenes>',
      this.visual_scene(root),
      '</library_visual_scenes>',
    ].join('\n');
  },

  visual_scene: function (root) {
    return [
      '<visual_scene id="defaultScene">',
      this.node(root),
      '</visual_scene>',
    ].join('\n');
  },

  node: function (node) {
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
      node.geometry ? this.instance_geometry(node.geometry, node.material) : '',
      '</node>',
    ].join('\n');
  },

  instance_geometry: function (geometry, material) {
    return [
      '<instance_geometry url="#geometry' + geometry.id + '">',
      this.bind_material(material),
      '</instance_geometry>',
    ].join('\n');
  },

  bind_material: function (material) {
    return [
      '<bind_material>',
      '<technique_common>',
      '<instance_material symbol="LOL" target="#material' + material.id + '"/>',
      '</technique_common>',
      '</bind_material>',
    ].join('\n');
  },

  //

  scene: function () {
    return [
      '<scene>',
      '<instance_visual_scene url="#defaultScene"/>',
      '</scene>',
    ].join('\n');
  },
};
