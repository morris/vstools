import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AnimationMixer,
  SkeletonHelper,
  Mesh,
  MeshNormalMaterial,
  OBJExporter,
  SkinnedMesh,
  OrbitControls,
  Object3D,
  BufferGeometry,
} from './three.js';
import { SHP } from './SHP.js';
import { WEP } from './WEP.js';
import { SEQ } from './SEQ.js';
import { ZND } from './ZND.js';
import { ZUD } from './ZUD.js';
import { Reader } from './Reader.js';
import { MPD } from './MPD.js';
import { ARM } from './ARM.js';
import { GIM } from './GIM.js';
import { P } from './P.js';
import { FBC } from './FBC.js';
import { FBT } from './FBT.js';
import { cloneMeshWithPose, exportPng, parseExt } from './VSTOOLS.js';
import { initUiPanel } from './ui/ui-panel.js';

export function Viewer() {
  const scene = (this.scene = new Scene());
  const camera = new PerspectiveCamera(75, 1, 0.1, 10000);

  const renderer = new WebGLRenderer();
  renderer.setClearColor(0x333333, 1);

  resize();

  const root = new Object3D();
  const helpers = new Object3D();

  scene.add(root);
  scene.add(helpers);

  document.querySelector('body').appendChild(renderer.domElement);

  camera.position.z = 500;
  const orbitControls = new OrbitControls(camera, renderer.domElement);

  const mixer = new AnimationMixer(scene);
  let mixerAction;

  function render() {
    requestAnimationFrame(render);
    orbitControls.update();
    mixer.update(0.01);
    renderer.render(scene, camera);
  }

  function resize() {
    setTimeout(function () {
      camera.aspect = (window.innerWidth - 360) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth - 360, window.innerHeight);
    }, 1);
  }

  window.addEventListener('resize', resize);

  this.run = function () {
    render();
  };

  //

  let activeSHP, activeSEQ, activeZND;

  // ui

  document.querySelectorAll('.ui-panel').forEach(initUiPanel);
  document.querySelector('.app-file .load').addEventListener('click', load);
  document
    .querySelector('.app-animation .next')
    .addEventListener('click', nextAnim);
  document
    .querySelector('.app-animation .prev')
    .addEventListener('click', prevAnim);
  document
    .querySelector('.app-export .export-obj')
    .addEventListener('click', exportOBJ);

  // loading

  const loaders = {};

  function load() {
    const f1 = document.querySelector('.app-file .file1').files[0];
    const f2 = document.querySelector('.app-file .file2').files[0];

    const reader1 = new FileReader();
    reader1.onload = function () {
      const x = parseExt(f1.name);
      load2(x, reader1);

      if ((x === 'znd' || x === 'shp' || x === 'fbc') && f2) {
        reader2.readAsArrayBuffer(f2);
      }
    };

    const reader2 = new FileReader();
    reader2.onload = function () {
      const x = parseExt(f2.name);
      load2(x, reader2);
    };

    reader1.readAsArrayBuffer(f1);
  }

  function load2(ext, reader) {
    const data = new Uint8Array(reader.result);

    const loader = loaders[ext];
    if (!loader) throw new Error('Unknown file extension ' + ext);

    loader(new Reader(data));
  }

  loaders.wep = function (reader) {
    clean();

    const wep = new WEP(reader);
    wep.read();
    wep.build();

    root.remove(root.children[0]);
    root.add(wep.mesh);

    updateTextures(wep.textureMap.textures);
    updateAnim();
    updateSettings();
  };

  loaders.shp = function (reader) {
    clean();

    const shp = (activeSHP = new SHP(reader));
    shp.read();
    shp.build();

    root.remove(root.children[0]);
    root.add(shp.mesh);

    updateTextures(shp.textureMap.textures);
    updateAnim();
  };

  loaders.seq = function (reader) {
    if (activeSHP) {
      stopAnim();

      const seq = (activeSEQ = new SEQ(reader, activeSHP));
      seq.read();
      seq.build();

      updateAnim();
      updateSettings();
    } else {
      throw new Error('Cannot load SEQ without SHP');
    }
  };

  loaders.zud = function (reader) {
    clean();

    const zud = new ZUD(reader);
    zud.read();
    zud.build();

    activeSHP = zud.shp;
    activeSEQ = zud.bt || zud.com;

    updateAnim();

    root.remove(root.children[0]);
    root.add(zud.shp.mesh);

    updateTextures(zud.shp.textureMap.textures);
    updateAnim();
    updateSettings();
  };

  loaders.znd = function (reader) {
    clean();

    const znd = (activeZND = new ZND(reader));
    znd.read();

    znd.frameBuffer.build();

    //scene.add( znd.frameBuffer.mesh );

    updateTextures(znd.textures);
    updateSettings();
  };

  loaders.mpd = function (reader) {
    clean();

    const mpd = new MPD(reader, activeZND);
    mpd.read();
    mpd.build();

    root.remove(root.children[0]);
    root.add(mpd.mesh);

    if (activeZND) updateTextures(activeZND.textures);
    updateSettings();
  };

  loaders.arm = function (reader) {
    clean();

    const arm = new ARM(reader);
    arm.read();
    arm.build();

    root.remove(root.children[0]);
    root.add(arm.object);

    updateTextures([]);
    updateSettings();
  };

  loaders.gim = function (reader) {
    const gim = new GIM(reader);
    gim.read();
    gim.build();

    updateTextures(gim.textures);
    updateSettings();
  };

  loaders.p = function (reader) {
    const p = new P(reader);
    p.read();
    p.build();

    updateTextures(p.textures);
    updateSettings();
  };

  let activeFBC;

  loaders.fbc = function (reader) {
    const fbc = (activeFBC = new FBC(reader));
    fbc.read();
  };

  loaders.fbt = function (reader) {
    const fbt = new FBT(reader, activeFBC);
    fbt.read();

    updateTextures(fbt.textures);
    updateSettings();
  };

  function clean() {
    activeSHP = null;
    activeSEQ = null;

    stopAnim();
  }

  // animation

  function nextAnim() {
    document.querySelector('.app-animation .animation').value = parseAnim() + 1;

    updateAnim();
  }

  function prevAnim() {
    document.querySelector('.app-animation .animation').value = parseAnim() - 1;

    updateAnim();
  }

  function updateAnim() {
    if (!activeSEQ) return;

    stopAnim();

    const id = parseAnim();

    mixer.uncacheClip(activeSEQ.animations[id].animationClip);
    mixerAction = mixer.clipAction(
      activeSEQ.animations[id].animationClip,
      activeSHP.mesh
    );
    mixerAction.play();

    document.querySelector('.app-animation .animation').value = id;
    document.querySelector('.app-animation .animation-count').innerHTML =
      '0&ndash;' + (activeSEQ.animations.length - 1);
  }

  function parseAnim() {
    if (!activeSEQ) return 0;

    let id = parseInt(
      document.querySelector('.app-animation .animation').value,
      10
    );

    if (!id) id = 0;

    id = Math.min(activeSEQ.animations.length - 1, Math.max(0, id));

    return id;
  }

  function stopAnim() {
    if (mixerAction) mixerAction.stop();
  }

  // textures

  function updateTextures(textures) {
    document.querySelector('.app-textures .textures').innerHTML = '';

    if (!textures) return;

    document.querySelector('.app-textures .textures').innerHTML = textures
      .map((texture) => {
        const src = exportPng(
          texture.image.data,
          texture.image.width,
          texture.image.height
        );
        return `<img title="${texture.title}" src="${src}">`;
      })
      .join('\n');
  }

  // settings

  document
    .querySelector('.app-settings')
    .addEventListener('click', updateSettings);

  function updateSettings() {
    const wireframe = document.querySelector('.app-settings .wireframe')
      .checked;
    const noVertexColors = document.querySelector(
      '.app-settings .no-vertex-colors'
    ).checked;
    const noTexture = document.querySelector('.app-settings .no-texture')
      .checked;
    const normals = document.querySelector('.app-settings .normals').checked;
    const skeleton = document.querySelector('.app-settings .skeleton').checked;

    helpers.traverse((object) => {
      helpers.remove(object);
    });

    root.traverse((object) => {
      if (object instanceof Mesh) {
        if (normals && !(object.material instanceof MeshNormalMaterial)) {
          object.originalMaterial = object.material;
          object.material = new MeshNormalMaterial();
          object.material.skinning = object.originalMaterial.skinning;
        }

        if (
          !normals &&
          object.material instanceof MeshNormalMaterial &&
          object.originalMaterial
        ) {
          object.material = object.originalMaterial;
        }

        if (noTexture && object.material.map) {
          object.material.originalMap = object.material.map;
          object.material.map = null;
          object.material.needsUpdate = true;
        }

        if (!noTexture && !object.material.map && object.material.originalMap) {
          object.material.map = object.material.originalMap;
          object.material.needsUpdate = true;
        }

        if (
          object.geometry instanceof BufferGeometry &&
          object.geometry.attributes.color
        ) {
          object.material.vertexColors = !noVertexColors;
          object.material.needsUpdate = true;
        }

        object.material.wireframe = wireframe;
        object.material.wireframeLinewidth = 2;
      }

      if (skeleton && object instanceof SkinnedMesh) {
        const skeletonHelper = new SkeletonHelper(object);
        skeletonHelper.material.linewidth = 3;
        helpers.add(skeletonHelper);
      }
    });
  }

  // export

  function exportOBJ() {
    const exporter = new OBJExporter();

    if (root instanceof SkinnedMesh) {
      const clone = cloneMeshWithPose(root);

      exportString(exporter.parse(clone));
    } else {
      exportString(exporter.parse(root));
    }
  }

  function exportString(output) {
    const blob = new Blob([output], { type: 'text/plain' });
    const objectURL = URL.createObjectURL(blob);

    window.open(objectURL, '_blank');
    window.focus();
  }
}
