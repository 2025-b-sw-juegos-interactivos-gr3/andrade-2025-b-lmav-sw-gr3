// src/main.js - Escena con anime.glb y texturas incrustadas
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

async function createScene() {
  const scene = new BABYLON.Scene(engine);

  // === Havok Physics init ===
  let physicsEnabled = false;
  try {
    const hk = await import("https://cdn.babylonjs.com/havok/HavokPhysics.js");
    const havokInstance = await (hk?.HavokPhysics ? hk.HavokPhysics() : HavokPhysics());
    const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), havokPlugin);
    physicsEnabled = true;
  } catch (e) {
    console.warn("Havok Physics disabled:", e.message);
  }

  // === Cámara que sigue al jugador ===
  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 20;

  // === Iluminación ===
  new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.8;
  const dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
  dirLight.position = new BABYLON.Vector3(5, 10, 5);
  dirLight.intensity = 0.6;

  // ===== PISO CON TEXTURA =====
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseTexture = new BABYLON.Texture("assets/textures/snow.jpg", scene);
  groundMat.diffuseTexture.uScale = 15;
  groundMat.diffuseTexture.vScale = 15;
  ground.material = groundMat;

  try {
    new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.8, restitution: 0 }, scene);
  } catch {}

  // ===== SKYBOX =====
  const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.emissiveTexture = new BABYLON.Texture("assets/textures/skyy.jpg", scene);
  skyboxMaterial.disableLighting = true;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skybox.material = skyboxMaterial;

  // ===== CARGAR PERSONAJE (anime.glb) CON TEXTURAS INCRUSTADAS =====
  try {
    const res = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/coraline/", "anime.glb", scene);
    const imported = res.meshes.filter(m => m && m !== ground);

    console.log("Personaje cargado:", imported.length, "meshes");
    console.log("Materiales cargados:", imported.map(m => m.material?.name || "sin material"));

    // Convertir quaterniones a Euler si es necesario
    imported.forEach(m => {
      if (m.rotationQuaternion) m.rotationQuaternion = null;
    });

    // === Player physics collider (capsule) ===
    let playerAggregate;
    const playerCollider = BABYLON.MeshBuilder.CreateCapsule("playerCollider", { height: 1.8, radius: 0.4 }, scene);
    playerCollider.position = new BABYLON.Vector3(0, 0.9, 0);
    playerCollider.isVisible = false;
    
    try {
      playerAggregate = new BABYLON.PhysicsAggregate(playerCollider, BABYLON.PhysicsShapeType.CAPSULE, { mass: 1, friction: 0.5, restitution: 0 }, scene);
      playerAggregate.body.setAngularDamping(100.0);
    } catch {}

    // Fallback de colisiones sin físicas
    if (!physicsEnabled) {
      scene.collisionsEnabled = true;
      ground.checkCollisions = true;
      playerCollider.checkCollisions = true;
      playerCollider.ellipsoid = new BABYLON.Vector3(0.4, 0.9, 0.4);
      playerCollider.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);
    }

    // Contenedor del personaje
    const container = new BABYLON.TransformNode("charRoot", scene);
    container.parent = playerCollider;

    if (imported[0]) {
      imported[0].parent = container;
    }

    autoOrientUpright(container, imported, scene);
    frameCameraAndScale(container, imported, camera, scene);

    // ===== ANIMACIONES =====
    const animGroups = res.animationGroups ?? [];
    console.log("Animaciones disponibles:", animGroups.map(g => `${g.name}`));
    
    const walkAnim = animGroups.find(g => (g.targetedAnimations?.length ?? 0) > 0);
    
    if (walkAnim) {
      console.log("Animación activa:", walkAnim.name);
      walkAnim.loopAnimation = true;
      walkAnim.goToFrame(0);
      walkAnim.pause();
    }

    // ===== MOVIMIENTO CON TECLADO =====
    const moveSpeed = 5;
    const keys = {};
    let isMoving = false;

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        keys[key] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      keys[key] = false;
    });

    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() * 0.001;
      let movement = BABYLON.Vector3.Zero();
      
      // Movimiento relativo a la cámara
      const cameraForward = camera.getDirection(BABYLON.Axis.Z);
      const cameraRight = camera.getDirection(BABYLON.Axis.X);
      cameraForward.y = 0;
      cameraRight.y = 0;
      cameraForward.normalize();
      cameraRight.normalize();

      if (keys['w'] || keys['arrowup']) movement.addInPlace(cameraForward);
      if (keys['s'] || keys['arrowdown']) movement.addInPlace(cameraForward.scale(-1));
      if (keys['a'] || keys['arrowleft']) movement.addInPlace(cameraRight.scale(-1));
      if (keys['d'] || keys['arrowright']) movement.addInPlace(cameraRight);

      const wasMoving = isMoving;
      isMoving = movement.lengthSquared() > 1e-6;

      // Controlar animación
      if (walkAnim && isMoving !== wasMoving) {
        if (isMoving) {
          walkAnim.play(true);
        } else {
          walkAnim.pause();
        }
      }

      if (isMoving) {
        movement.normalize();
        const finalVelocity = movement.scale(moveSpeed);
        
        if (physicsEnabled && playerAggregate?.body) {
          playerAggregate.body.setLinearVelocity(new BABYLON.Vector3(
            finalVelocity.x,
            playerAggregate.body.getLinearVelocity().y,
            finalVelocity.z
          ));
        } else {
          const delta = movement.scale(moveSpeed * dt);
          if (scene.collisionsEnabled && playerCollider.checkCollisions) {
            playerCollider.moveWithCollisions(delta);
          } else {
            playerCollider.position.addInPlace(delta);
          }
        }

        // Rotar hacia la dirección de movimiento
        const targetRotation = Math.atan2(movement.x, movement.z);
        playerCollider.rotation.y = targetRotation + Math.PI;
      } else {
        // Mantener gravedad
        if (physicsEnabled && playerAggregate?.body) {
          playerAggregate.body.setLinearVelocity(new BABYLON.Vector3(
            0,
            playerAggregate.body.getLinearVelocity().y,
            0
          ));
        }
      }
      
      camera.setTarget(playerCollider.position);
    });

    // ===== CARGAR ÁRBOLES DE SAKURA =====
    //const treePositions = [ 
    // { x: 4, z: 2 }, { x: -4, z: 2 }, { x: -7, z: 7 }, 
    // { x: -10, z: 10 }, { x: -15, z: 15 }, { x: 4, z: 4 }, { x: -4, z: -4 }, 
    // { x: 7, z: -7 }, { x: -10, z: -10 }, { x: 15, z: -15 }, ];
    const treePositions = [
  { x: 4, z: 2 }, { x: -4, z: 2 }, { x: -7, z: 7 }, { x: -10, z: 10 }, { x: -15, z: 15 }, 
  { x: 4, z: 4 }, { x: -4, z: -4 }, { x: 7, z: -7 }, { x: -10, z: -10 }, { x: 15, z: -15 }, 
  { x: 6, z: 6 }, { x: -6, z: -6 }, { x: 8, z: -8 }, { x: -8, z: 8 }, { x: 12, z: 12 }, 
  { x: -12, z: -12 }, { x: 3, z: -3 }, { x: -3, z: 3 }, { x: 9, z: 9 }, { x: -9, z: -9 },
  { x: 13, z: 13 }, { x: -13, z: 13 }, { x: 5, z: -5 }, { x: -5, z: -5 }, { x: 2, z: 5 },
  { x: -2, z: -5 }, { x: 14, z: 4 }, { x: -14, z: -4 }, { x: 11, z: 11 }, { x: -11, z: -11 }
];


    for (let i = 0; i < treePositions.length; i++) {
      try {
        const treeRes = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/sakura/", "tree.glb", scene);
        const treeContainer = new BABYLON.TransformNode(`treeRoot${i}`, scene);
        
        if (treeRes.meshes[0]) {
          treeRes.meshes[0].parent = treeContainer;
        }
        
        const pos = treePositions[i];
        treeContainer.position = new BABYLON.Vector3(pos.x, 0, pos.z);
        
        // Colisión del tronco
        const trunk = BABYLON.MeshBuilder.CreateCylinder(`trunk${i}`, { diameter: 0.8, height: 3 }, scene);
        trunk.isVisible = false;
        trunk.parent = treeContainer;
        trunk.position.y = 1.5;
        trunk.checkCollisions = true;
        
        try {
          new BABYLON.PhysicsAggregate(trunk, BABYLON.PhysicsShapeType.CYLINDER, { mass: 0, friction: 0.8 }, scene);
        } catch {}

        if (Math.random() > 0.5) {
          treeContainer.rotation.y = Math.PI;
        }
      } catch (err) {
        console.error(`Error cargando árbol ${i}:`, err.message);
      }
    }

  } catch (e) {
    console.error("Error cargando anime.glb:", e);
  }

  return scene;
}

function computeWorldBounds(meshes) {
  let min = new BABYLON.Vector3(+Infinity, +Infinity, +Infinity);
  let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
  meshes.forEach(m => {
    const bi = m.getBoundingInfo();
    min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
    max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
  });
  return { min, max, size: max.subtract(min), center: min.add(max).scale(0.5) };
}

function autoOrientUpright(container, meshes, scene) {
  const trials = [
    { axis: null, angle: 0 },
    { axis: BABYLON.Axis.X, angle: Math.PI / 2 },
    { axis: BABYLON.Axis.X, angle: -Math.PI / 2 },
    { axis: BABYLON.Axis.Z, angle: Math.PI / 2 },
    { axis: BABYLON.Axis.Z, angle: -Math.PI / 2 },
  ];
  const original = container.rotation.clone();
  let best = { h: -Infinity, axis: null, angle: 0 };
  for (const t of trials) {
    container.rotation.copyFrom(original);
    if (t.axis) container.rotate(t.axis, t.angle, BABYLON.Space.LOCAL);
    scene.render(false);
    const { size } = computeWorldBounds(meshes);
    if (size.y > best.h) best = { h: size.y, axis: t.axis, angle: t.angle };
  }
  container.rotation.copyFrom(original);
  if (best.axis) container.rotate(best.axis, best.angle, BABYLON.Space.LOCAL);
}

function frameCameraAndScale(container, meshes, camera, scene) {
  scene.executeWhenReady(() => {
    scene.render(false);
    scene.render(false);
    
    const { size, min } = computeWorldBounds(meshes);
    const currentH = Math.max(0.001, size.y);
    const desiredH = 1.8;
    const s = desiredH / currentH;
    container.scaling.set(s, s, s);
    
    scene.render(false);
    const { min: newMin } = computeWorldBounds(meshes);
    const groundY = 0;
    const offset = groundY - newMin.y;
    container.position.y += offset;
  });
}

createScene().then(scene => engine.runRenderLoop(() => scene.render()));
window.addEventListener("resize", () => engine.resize());
