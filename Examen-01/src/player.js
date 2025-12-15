// player.js - Control del jugador/coche

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.currentSpeed = 0;
        this.rotationSpeed = 0.05;
        this.acceleration = 0.08;
        this.maxSpeed = 1.5;
        this.friction = 0.98;
        this.input = { forward: false, backward: false, left: false, right: false };
    }

    async init() {
        console.log("Inicializando jugador...");
        
        // Intenta cargar el modelo GLB del coche
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "assets/models/car/",
                "car.glb",
                this.scene
            );
            
            const meshes = result.meshes;
            if (meshes.length > 0) {
                const rootMesh = meshes[0];
                this.mesh = rootMesh;
                rootMesh.position = new BABYLON.Vector3(0, 0.5, 0);
                rootMesh.scaling = new BABYLON.Vector3(2.2, 2.2, 2.2); // Escala grande
                rootMesh.checkCollisions = true;
                rootMesh.ellipsoid = new BABYLON.Vector3(1.8, 1.0, 2.8);
                rootMesh.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0);

                // NO TOCAR los materiales originales del GLB
                // Solo habilitar colisiones en los hijos
                rootMesh.getChildMeshes().forEach(m => {
                    m.checkCollisions = true;
                });
                console.log("Coche GLB cargado con texturas originales");
            } else {
                throw new Error("No meshes in GLB");
            }
        } catch (e) {
            console.warn("No se pudo cargar car.glb, usando fallback:", e);
            
            // Fallback: crear un coche simple con mejor diseño
            // Cuerpo principal
            const body = BABYLON.MeshBuilder.CreateBox('playerCarBody', { 
                width: 3.2, 
                height: 1.0, 
                depth: 5.5 
            }, this.scene);
            body.position = new BABYLON.Vector3(0, 0.6, 0);
            
            // Cabina
            const cabin = BABYLON.MeshBuilder.CreateBox('playerCarCabin', {
                width: 2.6,
                height: 0.8,
                depth: 2.5
            }, this.scene);
            cabin.position = new BABYLON.Vector3(0, 1.3, -0.5);
            cabin.parent = body;
            
            // Material del cuerpo (azul brillante tipo Uber)
            const bodyMat = new BABYLON.StandardMaterial('playerBodyMat', this.scene);
            bodyMat.diffuseColor = new BABYLON.Color3(0.05, 0.35, 0.85);
            bodyMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            bodyMat.specularPower = 64;
            body.material = bodyMat;
            
            // Material de la cabina (ventanas oscuras)
            const cabinMat = new BABYLON.StandardMaterial('playerCabinMat', this.scene);
            cabinMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
            cabinMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
            cabinMat.specularPower = 128;
            cabin.material = cabinMat;
            
            // Ruedas
            const wheelMat = new BABYLON.StandardMaterial('wheelMat', this.scene);
            wheelMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
            
            const wheelPositions = [
                { x: 1.3, z: 1.8 }, { x: -1.3, z: 1.8 },
                { x: 1.3, z: -1.8 }, { x: -1.3, z: -1.8 }
            ];
            wheelPositions.forEach((pos, i) => {
                const wheel = BABYLON.MeshBuilder.CreateCylinder(`wheel_${i}`, {
                    height: 0.3, diameter: 0.9
                }, this.scene);
                wheel.rotation.z = Math.PI / 2;
                wheel.position = new BABYLON.Vector3(pos.x, 0.45, pos.z);
                wheel.parent = body;
                wheel.material = wheelMat;
            });
            
            body.checkCollisions = true;
            body.ellipsoid = new BABYLON.Vector3(1.7, 0.9, 2.8);
            body.ellipsoidOffset = new BABYLON.Vector3(0, 0.6, 0);
            this.mesh = body;
        }

        this.setupInput();
        
        console.log("Jugador inicializado");
        return this;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                this.input.forward = true;
            }
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                this.input.backward = true;
            }
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                this.input.left = true;
            }
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                this.input.right = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                this.input.forward = false;
            }
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                this.input.backward = false;
            }
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                this.input.left = false;
            }
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                this.input.right = false;
            }
        });
    }

    update() {
        if (!this.mesh) return;
        
        // Rotación
        if (this.input.left) this.mesh.rotation.y -= this.rotationSpeed;
        if (this.input.right) this.mesh.rotation.y += this.rotationSpeed;
        
        // Aceleración y freno
        if (this.input.forward) {
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration);
        }
        if (this.input.backward) {
            this.currentSpeed = Math.max(-this.maxSpeed / 2, this.currentSpeed - this.acceleration);
        }
        
        // Fricción
        this.currentSpeed *= this.friction;
        if (Math.abs(this.currentSpeed) < 0.0005) this.currentSpeed = 0;
        
        // Movimiento en la dirección actual con colisiones
        if (Math.abs(this.currentSpeed) > 0.001) {
            const dir = new BABYLON.Vector3(
                Math.sin(this.mesh.rotation.y),
                0,
                Math.cos(this.mesh.rotation.y)
            );
            
            // Mover con colisiones mejoradas
            const moveVector = dir.scale(this.currentSpeed);
            const newPos = this.mesh.position.add(moveVector);
            
            // Limitar al área del mapa
            newPos.x = Math.max(-95, Math.min(95, newPos.x));
            newPos.z = Math.max(-95, Math.min(95, newPos.z));
            
            this.mesh.position = newPos;
            
            // Actualizar cámara para seguir al jugador
            if (window.gameInstance && window.gameInstance.camera) {
                window.gameInstance.camera.target = this.mesh.position.clone();
            }
        }
    }

    resetPosition() {
        if (!this.mesh) return;
        this.mesh.position = new BABYLON.Vector3(0, 0.4, 0);
        this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
        this.currentSpeed = 0;
        console.log("Posición del jugador reiniciada");
    }

    getPosition() {
        return this.mesh ? this.mesh.position.clone() : BABYLON.Vector3.Zero();
    }

    getRotation() {
        return this.mesh ? this.mesh.rotation.clone() : new BABYLON.Vector3(0, 0, 0);
    }
}