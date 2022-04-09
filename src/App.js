import React, { Component } from "react";
import * as THREE from "three";
import { OrbitControls } from "./components/controls/OrbitControls";
import { Sky } from "./components/objects/Sky";
import { Water } from "./components/objects/Water";
import Stats from "./components/libs/stats.module.js";
import { GUI } from "./components/libs/lil-gui.module.min.js";

import textureWaterFlow from "./assets/textures/Water_1_M_Flow.jpg";

export default class App extends Component {
  componentDidMount() {
    //
    // WebGL Initialize
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // blur corner
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.mount.appendChild(renderer.domElement);
    //

    var scene = new THREE.Scene(); // create scene

    var camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );
    camera.position.set(30, 30, 100);

    //

    var sun = new THREE.Vector3();

    // water

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

    /*var water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "textures/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });

    water.rotation.x = -Math.PI / 2;

    scene.add(water);*/

    var water = new Water(waterGeometry, {
      scale: 2,
      textureWidth: 1024,
      textureHeight: 1024,
      distortionScale: 0,
      flowMap: new THREE.TextureLoader().load(textureWaterFlow),
    });

    water.position.y = 1;
    water.rotation.x = Math.PI * -0.5;
    scene.add(water);

    // flow map helper

    const helperGeometry = new THREE.PlaneGeometry(20, 20);
    const helperMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(textureWaterFlow),
    });
    const helper = new THREE.Mesh(helperGeometry, helperMaterial);
    helper.position.y = 1.01;
    helper.rotation.x = Math.PI * -0.5;
    helper.visible = false;
    scene.add(helper);

    // Skybox

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const parameters = {
      elevation: 2,
      azimuth: 180,
    };

    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    function updateSun() {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);

      sun.setFromSphericalCoords(1, phi, theta);

      sky.material.uniforms["sunPosition"].value.copy(sun);
      water.material.uniforms["sunDirection"].value.copy(sun).normalize();

      scene.environment = pmremGenerator.fromScene(sky).texture;
    }

    updateSun();

    //

    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshStandardMaterial({ roughness: 0 });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();

    //

    var stats = new Stats();
    this.mount.appendChild(stats.dom);

    // GUI

    const gui = new GUI();

    const folderSky = gui.addFolder("Sky");
    folderSky.add(parameters, "elevation", 0, 90, 0.1).onChange(updateSun);
    folderSky.add(parameters, "azimuth", -180, 180, 0.1).onChange(updateSun);
    folderSky.open();

    const waterUniforms = water.material.uniforms;

    const folderWater = gui.addFolder("Water");
    folderWater
      .add(waterUniforms.distortionScale, "value", 0, 8, 0.1)
      .name("distortionScale");
    folderWater.add(waterUniforms.size, "value", 0.1, 10, 0.1).name("size");
    folderWater.open();

    //

    // animate function
    function animate() {
      requestAnimationFrame(animate);
      render();
      renderer.render(scene, camera);
    }

    // func to resize screen
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
      const time = performance.now() * 0.001;

      mesh.position.y = Math.sin(time) * 20 + 5;
      mesh.rotation.x = time * 0.5;
      mesh.rotation.z = time * 0.51;

      water.material.uniforms["time"].value += 1.0 / 60.0;

      renderer.render(scene, camera);
    }
    // call animate on initialization
    animate();
    // call resize with event
    window.addEventListener("resize", onWindowResize, false);
  }

  render() {
    return <div id="playScr" ref={(ref) => (this.mount = ref)} />;
  }
}
