VSTOOLS.FrameBuffer = function () {
  var width = 1024;
  var height = 512;

  this.buffer = new Uint8Array(width * height * 4);

  this.texture = new THREE.DataTexture(
    this.buffer,
    width,
    height,
    THREE.RGBAFormat
  );
  this.texture.magFilter = THREE.NearestFilter;
  this.texture.minFilter = THREE.NearestFilter;

  this.setPixel = function (x, y, c) {
    var buffer = this.buffer;
    var i = (y * width + x) * 4;

    buffer[i + 0] = c[0];
    buffer[i + 1] = c[1];
    buffer[i + 2] = c[2];
    buffer[i + 3] = c[3];

    this.texture.needsUpdate = true;
  };

  this.build = function () {
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      shading: THREE.FlatShading,
      transparent: false,
    });

    //this.material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(500, 250, 1),
      this.material
    );
    this.mesh.position.z = -120;
  };

  // debug

  this.markCLUT = function (id) {
    var buffer = this.buffer;
    var ilo = id * 64;
    var ihi = ilo + 64;

    for (var i = ilo; i < ilo + 4; i += 4) {
      buffer[i + 0] = 255;
      buffer[i + 1] = 0;
      buffer[i + 2] = 0;
      buffer[i + 3] = 255;
    }

    this.texture.needsUpdate = true;
  };
};
