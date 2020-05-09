var VSTOOLS = {
  // constants

  TimeScale: 0.04,

  Rot13toRad: (1 / 4096) * Math.PI,

  UnitX: new THREE.Vector3(1, 0, 0),
  UnitY: new THREE.Vector3(0, 1, 0),
  UnitZ: new THREE.Vector3(0, 0, 1),

  // utility

  ext: function (path) {
    var dot = path.lastIndexOf('.');
    var slash = path.lastIndexOf('/');

    return dot > 0 && dot > slash ? path.substr(dot + 1).toLowerCase() : null;
  },

  // convert typed array to png data url
  png: function (data, width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext('2d');

    var imageData = ctx.createImageData(width, height);
    var i = 0,
      l;
    for (l = data.length; i < l; ++i) {
      imageData.data[i] = data[i];
    }
    for (l = imageData.length; i < l; ++i) {
      imageData.data[i] = 0;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  },

  // get RGBA from 16 bit color value
  // first bit === 1 or bits === 0 means fully transparent
  // then 5 bits for each of B, G, R
  color: function (c) {
    var t = (c & 0x8000) >> 15;
    var b = (c & 0x7c00) >> 10;
    var g = (c & 0x03e0) >> 5;
    var r = c & 0x001f;

    if (c === 0) {
      return [0, 0, 0, 0];
    }

    // 5bit -> 8bit is factor 2^3 = 8
    return [r * 8, g * 8, b * 8, 255];
  },

  // convert 13-bit rotation to radians
  rot13toRad: function (angle) {
    return angle * VSTOOLS.Rot13toRad;
  },

  // convert XYZ rotation in radians to quaternion
  // first apply x, then y, then z rotation
  // THREE.Quaternion.setFromEuler is not equivalent
  rot2quat: function (rx, ry, rz) {
    var Quaternion = THREE.Quaternion;

    var qu = new Quaternion();
    qu.setFromAxisAngle(VSTOOLS.UnitX, rx);
    var qv = new Quaternion();
    qv.setFromAxisAngle(VSTOOLS.UnitY, ry);
    var qw = new Quaternion();
    qw.setFromAxisAngle(VSTOOLS.UnitZ, rz);

    return qw.multiply(qv.multiply(qu));
  },

  hex: function (i, pad) {
    var x = i.toString(16);

    while (x.length < pad) x = '0' + x;

    return '0x' + x;
  },

  bin: function (i, pad) {
    var x = i.toString(2);

    while (x.length < pad) x = '0' + x;

    return '0b' + x;
  },

  geometrySnapshot: function (mesh) {
    var snapshot = mesh.geometry.clone();

    for (var i = 0, l = snapshot.vertices.length; i < l; ++i) {
      var bone = mesh.skeleton.bones[mesh.geometry.skinIndices[i].x];
      snapshot.vertices[i].applyMatrix4(bone.matrixWorld);
    }

    return snapshot;
  },

  assert: function (expr, expected) {
    var err;
    if (arguments.length === 2) {
      if (expr !== expected) {
        throw new Error('Assertion failed: ' + expr + ' !== ' + expected);
      }
    } else {
      if (!expr) {
        throw new Error('Assertion failed');
      }
    }
  },
};
