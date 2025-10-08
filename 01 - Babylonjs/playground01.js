function createScene() {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("cam", Math.PI/3, Math.PI/4, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene);
    hemi.intensity = 0.5;

    const point = new BABYLON.PointLight("pt", new BABYLON.Vector3(2, 4, -2), scene);
    point.intensity = 1.0;

    // Suelo (plano) con textura
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
    const matG = new BABYLON.StandardMaterial("matG", scene);
    matG.diffuseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grass.png", scene);
    ground.material = matG;

    // Esfera con textura especular + bump
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
    sphere.position = new BABYLON.Vector3(-3, 1, 0);
    const matS = new BABYLON.StandardMaterial("matS", scene);
    matS.diffuseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/stone.jpg", scene);
    matS.specularTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/specularMap.png", scene);
    matS.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/normalMap.png", scene);
    sphere.material = matS;

    // Caja con PBR material
    const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    box.position = new BABYLON.Vector3(3, 1, 0);
    const pbr = new BABYLON.PBRMaterial("pbr", scene);
    pbr.albedoColor = new BABYLON.Color3(0.8, 0.2, 0.2);
    pbr.metallic = 0.5;
    pbr.roughness = 0.4;
    box.material = pbr;

    // ==== ÁRBOL (usando figuras primitivas) ====
    // Tronco (cilindro)
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {
        diameterTop: 0.4,
        diameterBottom: 0.6,
        height: 2,
    }, scene);
    trunk.position = new BABYLON.Vector3(0, 1, 3);

    const matTrunk = new BABYLON.StandardMaterial("matTrunk", scene);
    matTrunk.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0); // color marrón
    trunk.material = matTrunk;

    // Copa (tres esferas verdes)
    const foliageMat = new BABYLON.StandardMaterial("foliageMat", scene);
    foliageMat.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1); // verde

    const top1 = BABYLON.MeshBuilder.CreateSphere("top1", {diameter: 1.5}, scene);
    top1.position = new BABYLON.Vector3(0, 2.5, 3);
    top1.material = foliageMat;

    const top2 = BABYLON.MeshBuilder.CreateSphere("top2", {diameter: 1.2}, scene);
    top2.position = new BABYLON.Vector3(0.5, 2.2, 2.7);
    top2.material = foliageMat;

    const top3 = BABYLON.MeshBuilder.CreateSphere("top3", {diameter: 1.2}, scene);
    top3.position = new BABYLON.Vector3(-0.5, 2.2, 3.3);
    top3.material = foliageMat;

    // Agrupar partes del árbol (opcional)
    const tree = BABYLON.Mesh.MergeMeshes([trunk, top1, top2, top3], true, false, null, false, true);
    tree.name = "tree";

    // Animaciones rápidas
    scene.registerBeforeRender(() => {
        sphere.rotation.y += 0.005;
        box.rotation.x += 0.007;
        box.rotation.y += 0.004;
    });

    return scene;
}

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
