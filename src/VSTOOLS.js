import { Quaternion, Vector3, Vector4, Matrix4, Mesh } from './three.js';

export const TimeScale = 0.04;
export const Rot13toRad = (1 / 4096) * Math.PI;
export const UnitX = new Vector3(1, 0, 0);
export const UnitY = new Vector3(0, 1, 0);
export const UnitZ = new Vector3(0, 0, 1);

export function parseExt(path) {
  const dot = path.lastIndexOf('.');
  const slash = path.lastIndexOf('/');

  return dot > 0 && dot > slash ? path.substr(dot + 1).toLowerCase() : null;
}

// convert typed array to png data url
export function exportPng(data, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  // Copy the image contents to the canvas
  const ctx = canvas.getContext('2d');

  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < imageData.length; ++i) {
    imageData.data[i] = 0;
  }

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const s = ((height - y - 1) * width + x) * 4;
      const t = (y * width + x) * 4;

      imageData.data[t + 0] = data[s + 0];
      imageData.data[t + 1] = data[s + 1];
      imageData.data[t + 2] = data[s + 2];
      imageData.data[t + 3] = data[s + 3];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

// get RGBA from 16 bit color value
// TODO first bit === 1 or bits === 0 means fully transparent?
// then 5 bits for each of B, G, R
export function parseColor(c) {
  //const t = (c & 0x8000) >> 15;
  const b = (c & 0x7c00) >> 10;
  const g = (c & 0x03e0) >> 5;
  const r = c & 0x001f;

  if (c === 0) {
    return [0, 0, 0, 0];
  }

  // 5bit -> 8bit is factor 2^3 = 8
  return [r * 8, g * 8, b * 8, 255];
}

// convert 13-bit rotation to radians
export function rot13toRad(angle) {
  return angle * Rot13toRad;
}

// convert XYZ rotation in radians to quaternion
// first apply x, then y, then z rotation
// Quaternion.setFromEuler is not equivalent
export function rot2quat(rx, ry, rz) {
  const qu = new Quaternion();
  qu.setFromAxisAngle(UnitX, rx);
  const qv = new Quaternion();
  qv.setFromAxisAngle(UnitY, ry);
  const qw = new Quaternion();
  qw.setFromAxisAngle(UnitZ, rz);

  return qw.multiply(qv.multiply(qu));
}

export function hex(i, pad) {
  let x = i.toString(16);

  while (x.length < pad) x = '0' + x;

  return '0x' + x;
}

export function hex2(i) {
  return hex(i, 2);
}

export function bin(i, pad) {
  let x = i.toString(2);

  while (x.length < pad) x = '0' + x;

  return '0b' + x;
}

export function cloneMeshWithPose(mesh) {
  const material = mesh.material.clone();
  material.skinning = false;
  const clone = new Mesh(mesh.geometry.clone(), material);

  const position = mesh.geometry.attributes.position;
  const skinIndex = mesh.geometry.attributes.skinIndex;
  const skinWeight = mesh.geometry.attributes.skinWeight;
  const boneMatrices = mesh.skeleton.boneMatrices;

  const vertex = new Vector3();
  const temp = new Vector3();
  const result = new Vector3();
  const skinIndices = new Vector4();
  const skinWeights = new Vector4();
  const boneMatrix = new Matrix4();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    skinIndices.fromBufferAttribute(skinIndex, i);
    skinWeights.fromBufferAttribute(skinWeight, i);

    vertex.applyMatrix4(mesh.bindMatrix);
    result.set(0, 0, 0);

    for (let j = 0; j < 4; ++j) {
      const si = skinIndices.getComponent(j);
      const sw = skinWeights.getComponent(j);

      boneMatrix.fromArray(boneMatrices, si * 16);
      temp.copy(vertex).applyMatrix4(boneMatrix).multiplyScalar(sw);
      result.add(temp);
    }

    result.applyMatrix4(mesh.bindMatrixInverse);

    clone.geometry.attributes.position.setXYZ(i, result.x, result.y, result.z);
  }

  clone.geometry.computeBoundingSphere();
  clone.geometry.computeVertexNormals();

  return clone;
}

export function assert(expr, expected) {
  if (arguments.length === 2) {
    if (expr !== expected) {
      throw new Error('Assertion failed: ' + expr + ' !== ' + expected);
    }
  } else if (!expr) {
    throw new Error('Assertion failed');
  }
}
