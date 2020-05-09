VSTOOLS.MPDMesh = function (reader, group, textureId, clutId) {
  reader.extend(this);

  this.group = group;
  this.textureId = textureId;
  this.clutId = clutId;
  this.faces = [];

  this.add = function (face) {
    this.faces.push(face);
  };

  this.build = function () {
    var geometry = (this.geometry = new THREE.Geometry());

    var faces = this.faces;
    var iv = 0;

    var tw = 256,
      th = 256;

    for (var i = 0, l = faces.length; i < l; ++i) {
      var f = faces[i];

      f.build();

      if (f.quad) {
        geometry.vertices.push(f.p1, f.p2, f.p3, f.p4);

        var c1 = [
          new THREE.Color(f.r3 / 255, f.g3 / 255, f.b3 / 255),
          new THREE.Color(f.r2 / 255, f.g2 / 255, f.b2 / 255),
          new THREE.Color(f.r1 / 255, f.g1 / 255, f.b1 / 255),
        ];

        var c2 = [
          new THREE.Color(f.r2 / 255, f.g2 / 255, f.b2 / 255),
          new THREE.Color(f.r3 / 255, f.g3 / 255, f.b3 / 255),
          new THREE.Color(f.r4 / 255, f.g4 / 255, f.b4 / 255),
        ];

        geometry.faces.push(new THREE.Face3(iv + 2, iv + 1, iv + 0, f.n, c1));
        geometry.faces.push(new THREE.Face3(iv + 1, iv + 2, iv + 3, f.n, c2));

        var uv1 = [
          new THREE.Vector2(f.u1 / tw, f.v1 / th),
          new THREE.Vector2(f.u3 / tw, f.v3 / th),
          new THREE.Vector2(f.u2 / tw, f.v2 / th),
        ];

        var uv2 = [
          new THREE.Vector2(f.u3 / tw, f.v3 / th),
          new THREE.Vector2(f.u1 / tw, f.v1 / th),
          new THREE.Vector2(f.u4 / tw, f.v4 / th),
        ];

        geometry.faceVertexUvs[0].push(uv1, uv2);

        iv += 4;
      } else {
        geometry.vertices.push(f.p1, f.p2, f.p3);

        var c = [
          new THREE.Color(f.r3 / 255, f.g3 / 255, f.b3 / 255),
          new THREE.Color(f.r2 / 255, f.g2 / 255, f.b2 / 255),
          new THREE.Color(f.r1 / 255, f.g1 / 255, f.b1 / 255),
        ];

        geometry.faces.push(new THREE.Face3(iv + 2, iv + 1, iv + 0, f.n, c));

        var uv = [
          new THREE.Vector2(f.u2 / tw, f.v2 / th),
          new THREE.Vector2(f.u3 / tw, f.v3 / th),
          new THREE.Vector2(f.u1 / tw, f.v1 / th),
        ];

        geometry.faceVertexUvs[0].push(uv);

        iv += 3;
      }
    }

    var group = this.group;

    if (group && group.mpd && group.mpd.znd) {
      this.material = group.mpd.znd.getMaterial(this.textureId, this.clutId);
    } else {
      this.material = new THREE.MeshNormalMaterial();
    }

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.x = Math.PI;
    this.mesh.scale.set(0.1, 0.1, 0.1);
  };
};
