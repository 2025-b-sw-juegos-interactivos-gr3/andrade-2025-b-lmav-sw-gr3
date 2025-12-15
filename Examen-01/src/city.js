// city.js - Construcción de la ciudad y entorno

export class CityBuilder {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.restaurants = [];
        this.houses = [];
        this.streetLights = [];
        this.trees = [];
        this.ground = null;
    }

    build() {
        console.log("Construyendo ciudad...");
        
        // Crear terreno
        this.createGround();
        
        // Crear sistema de calles
        this.createRoadSystem();
        
        // Crear edificios (restaurantes y casas)
        this.createBuildings();
        
        // Crear decoraciones
        this.createDecorations();
        
        // Crear farolas
        this.createStreetLights();
        
        console.log(`Ciudad construida: ${this.restaurants.length} restaurantes, ${this.houses.length} casas`);
        
        return {
            restaurants: this.restaurants,
            houses: this.houses,
            buildings: this.buildings,
            ground: this.ground
        };
    }

    createGround() {
        // Terreno principal
        const ground = BABYLON.MeshBuilder.CreateGround("mainGround", {
            width: 200,
            height: 200,
            subdivisions: 50
        }, this.scene);
        
        // Material con textura de pasto
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2);
        
        // Cargar textura de grass desde CDN
        try {
            const grassTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/floor.png", this.scene);
            grassTexture.uScale = 8; // Multiplicar para evitar estirado
            grassTexture.vScale = 8;
            groundMaterial.diffuseTexture = grassTexture;
        } catch (e) {
            console.log("Textura no disponible, usando color sólido");
            // Fallback: usar textura procedural
            try {
                if (BABYLON.GrassProceduralTexture) {
                    const grassTexture = new BABYLON.GrassProceduralTexture("grassTexture", 512, this.scene);
                    grassTexture.updateSampleIncrement = 8;
                    groundMaterial.diffuseTexture = grassTexture;
                }
            } catch (e2) {
                console.log("Usando color sólido para el terreno");
            }
        }
        
        ground.material = groundMaterial;
        ground.checkCollisions = true;
        
        this.ground = ground;
        return ground;
    }

    createRoadSystem() {
        // Calles principales (forma de cruz)
        const mainStreetH = this.createRoad(0, 0, 150, 12, 0);
        const mainStreetV = this.createRoad(0, 0, 12, 150, Math.PI / 2);
        
        // Calles secundarias
        const secondaryStreets = [
            { x: -50, z: 0, width: 8, length: 80, rotation: 0 },
            { x: 50, z: 0, width: 8, length: 80, rotation: 0 },
            { x: 0, z: -50, width: 80, length: 8, rotation: Math.PI / 2 },
            { x: 0, z: 50, width: 80, length: 8, rotation: Math.PI / 2 }
        ];
        
        secondaryStreets.forEach(street => {
            this.createRoad(street.x, street.z, street.width, street.length, street.rotation);
        });
        
        // Intersecciones
        this.createIntersection(0, 0, 12);
        
        return [mainStreetH, mainStreetV];
    }

    createRoad(x, z, width, length, rotation) {
        const road = BABYLON.MeshBuilder.CreateBox(`road_${x}_${z}`, {
            width: width,
            height: 0.1,
            depth: length
        }, this.scene);
        
        road.position = new BABYLON.Vector3(x, 0.05, z);
        road.rotation.y = rotation;
        
        // Material de asfalto
        const roadMaterial = new BABYLON.StandardMaterial(`roadMat_${x}_${z}`, this.scene);
        roadMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        roadMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        
        road.material = roadMaterial;
        road.checkCollisions = true;
        
        // Líneas de carril
        this.addRoadMarkings(road, x, z, width, length, rotation);
        
        return road;
    }

    addRoadMarkings(road, x, z, width, length, rotation) {
        const markingSpacing = 10;
        const markingLength = 2;
        const markingWidth = 0.3;
        
        // Líneas discontinuas centrales
        for (let offset = -length/2 + markingSpacing/2; offset < length/2; offset += markingSpacing) {
            const marking = BABYLON.MeshBuilder.CreateBox(`marking_${x}_${z}_${offset}`, {
                width: markingWidth,
                height: 0.11,
                depth: markingLength
            }, this.scene);
            
            marking.position = new BABYLON.Vector3(x, 0.06, z + offset);
            marking.rotation.y = rotation;
            
            const markingMat = new BABYLON.StandardMaterial(`markingMat_${x}_${z}_${offset}`, this.scene);
            markingMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
            markingMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            
            marking.material = markingMat;
        }
    }

    createIntersection(x, z, size) {
        const intersection = BABYLON.MeshBuilder.CreateBox(`intersection_${x}_${z}`, {
            width: size,
            height: 0.1,
            depth: size
        }, this.scene);
        
        intersection.position = new BABYLON.Vector3(x, 0.05, z);
        
        const interMaterial = new BABYLON.StandardMaterial(`interMat_${x}_${z}`, this.scene);
        interMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        intersection.material = interMaterial;
        
        return intersection;
    }

    createBuildings() {
        // UN SOLO RESTAURANTE en el centro-norte del mapa
        // Rotación: Math.PI/2 = gira 90° a la izquierda (mira hacia la derecha del mapa)
        const restaurantPositions = [
            { x: 0, z: -60, name: "UBER EATS Central", color: new BABYLON.Color3(1, 0.5, 0), rotation: 180 }
        ];

        // Crear el restaurante principal
        restaurantPositions.forEach((pos, index) => {
            const restaurant = this.createBuilding(
                `restaurant_${index}`,
                pos,
                6, // altura más grande
                pos.color,
                "RESTAURANT"
            );
            restaurant.name = pos.name;
            this.restaurants.push(restaurant);
        });
        
        // 5 CASAS distribuidas por el mapa
        const housePositions = [
            { x: -70, z: 30, name: "Casa Smith", color: new BABYLON.Color3(0.9, 0.6, 0.6), rotation: Math.PI / 2 },
            { x: 70, z: 30, name: "Casa García", color: new BABYLON.Color3(0.6, 0.9, 0.6), rotation: -Math.PI / 2 },
            { x: -50, z: 70, name: "Villa López", color: new BABYLON.Color3(0.6, 0.6, 0.9), rotation: 3 * Math.PI / 4 },
            { x: 50, z: 70, name: "Residencia Pérez", color: new BABYLON.Color3(0.9, 0.9, 0.6), rotation: -3 * Math.PI / 4 },
            { x: 0, z: 70, name: "Apartamento Díaz", color: new BABYLON.Color3(0.9, 0.6, 0.9), rotation: Math.PI }
        ];
        
        // Crear casas
        housePositions.forEach((pos, index) => {
            const house = this.createBuilding(
                `house_${index}`,
                pos,
                3, // altura
                pos.color,
                "HOUSE"
            );
            house.name = pos.name;
            this.houses.push(house);
        });
    }

    createBuilding(name, data, height, color, type) {
        // Intenta cargar modelo GLB
        let buildingMesh = null;
        
        const modelPath = type === "RESTAURANT" ? "assets/models/buildings/restaurant/" : "assets/models/buildings/house/";
        const modelFile = type === "RESTAURANT" ? "restaurant.glb" : "house.glb";
        
        BABYLON.SceneLoader.ImportMeshAsync(
            "",
            modelPath,
            modelFile,
            this.scene
        ).then((result) => {
            if (result.meshes.length > 0) {
                buildingMesh = result.meshes[0];
                buildingMesh.position = new BABYLON.Vector3(data.x, 0, data.z);
                buildingMesh.scaling = new BABYLON.Vector3(2.5, 2.5, 2.5); // Escala aumentada
                // Rotar hacia el centro
                if (data.rotation !== undefined) {
                    buildingMesh.rotation.y = data.rotation;
                }
                result.meshes.forEach(mesh => {
                    mesh.checkCollisions = true;
                });
                console.log(`${type} GLB cargado exitosamente en (${data.x}, ${data.z})`);
            }
        }).catch(e => {
            console.warn(`No se pudo cargar ${type} GLB, usando fallback:`, e);
            createBuildingFallback();
        });
        
        // Fallback: crear edificio procedural con escala mayor
        const createBuildingFallback = () => {
            const building = BABYLON.MeshBuilder.CreateBox(name, {
                width: 12,
                height: height * 1.5,
                depth: 12
            }, this.scene);
            
            building.position = new BABYLON.Vector3(data.x, (height * 1.5) / 2, data.z);
            // Rotar hacia el centro
            if (data.rotation !== undefined) {
                building.rotation.y = data.rotation;
            }
            
            // Material del edificio
            buildingMesh = building;
            building.checkCollisions = true;
            
            const buildingMat = new BABYLON.StandardMaterial(`${name}_mat`, this.scene);
            buildingMat.diffuseColor = color;
            
            // Cargar textura de ladrillo si está disponible
            try {
                const brickTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/brick.jpg", this.scene);
                brickTexture.uScale = 2;
                brickTexture.vScale = 2;
                buildingMat.diffuseTexture = brickTexture;
            } catch (e) {
                console.log("Textura de ladrillo no disponible");
            }
            
            building.material = buildingMat;
        };
        
        // Crear fallback inmediatamente para asegurar que existe
        createBuildingFallback();
        
        // Cartel/indicador mejorado
        const sign = BABYLON.MeshBuilder.CreateBox(`${name}_sign`, {
            width: 12,
            height: 1.2,
            depth: 0.25
        }, this.scene);
        
        sign.position = new BABYLON.Vector3(data.x, (height * 1.5) + 10, data.z);
        sign.checkCollisions = true;
        
        const signMat = new BABYLON.StandardMaterial(`${name}_sign_mat`, this.scene);
        signMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        signMat.emissiveColor = type === "RESTAURANT" ? 
            new BABYLON.Color3(1, 0.8, 0) : 
            new BABYLON.Color3(0.7, 1, 0.7);
        
        sign.material = signMat;
        
        // Crear texto del nombre mejorado (flotando y grande)
        const textPlane = this.createBuildingText(
            data.x,
            (height * 1.5) + 14,
            data.z,
            data.name,
            type
        );
        
        // Añadir sombras
        if (window.shadowGenerator && buildingMesh) {
            window.shadowGenerator.addShadowCaster(buildingMesh);
            window.shadowGenerator.addShadowCaster(sign);
            if (textPlane) {
                window.shadowGenerator.addShadowCaster(textPlane);
            }
        }
        
        const buildingData = {
            mesh: buildingMesh,
            sign: sign,
            position: new BABYLON.Vector3(data.x, 0, data.z),
            name: data.name,
            type: type
        };
        
        this.buildings.push(buildingData);
        return buildingData;
    }

    createBuildingText(x, y, z, text, type) {
        try {
            // Usar DynamicTexture para crear texto - tamaño grande y claro
            const textureWidth = 512;
            const textureHeight = 256;
            const dynamicTexture = new BABYLON.DynamicTexture(`${text}_texture`, {
                width: textureWidth,
                height: textureHeight
            }, this.scene, true);
            
            const ctx = dynamicTexture.getContext();
            
            // Fondo sólido de color
            ctx.fillStyle = type === "RESTAURANT" ? "#FF6B00" : "#4CAF50";
            ctx.fillRect(0, 0, textureWidth, textureHeight);
            
            // Borde blanco
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, textureWidth - 6, textureHeight - 6);
            
            // Texto principal con sombra para mejor legibilidad
            ctx.font = "bold 48px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Sombra del texto
            ctx.fillStyle = "#000000";
            ctx.fillText(text, textureWidth/2 + 2, textureHeight/2 - 20 + 2);
            
            // Texto principal blanco
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(text, textureWidth/2, textureHeight/2 - 20);
            
            // Subtítulo indicador
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = "#FFFF00";
            const subtitle = type === "RESTAURANT" ? "RECOGER AQUI" : "ENTREGAR AQUI";
            ctx.fillText(subtitle, textureWidth/2, textureHeight/2 + 40);
            
            dynamicTexture.update();
            
            // Crear plano para el texto - más grande y visible
            const textPlane = BABYLON.MeshBuilder.CreatePlane(`${text}_plane`, {
                width: 18,
                height: 9
            }, this.scene);
            
            textPlane.position = new BABYLON.Vector3(x, y, z);
            textPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            
            const textMat = new BABYLON.StandardMaterial(`${text}_mat`, this.scene);
            textMat.diffuseTexture = dynamicTexture;
            textMat.emissiveColor = new BABYLON.Color3(1, 1, 1); // Muy brillante
            textMat.specularColor = new BABYLON.Color3(0, 0, 0);
            textMat.backFaceCulling = false;
            textMat.useAlphaFromDiffuseTexture = false;
            
            textPlane.material = textMat;
            textPlane.checkCollisions = false;
            
            return textPlane;
        } catch (error) {
            console.error("Error creando texto del edificio:", error);
            return null;
        }
    }

    // FUNCIÓN PARA CREAR EL PAQUETE DE ENTREGA
    createPackage(position) {
        console.log("Creando paquete en:", position);
        
        if (!position) {
            console.error("Posición no válida para crear paquete");
            return null;
        }
        
        // Grupo para el paquete completo
        const packageGroup = new BABYLON.TransformNode("deliveryPackage", this.scene);
        packageGroup.position = position.clone();
        packageGroup.position.y = 1;
        
        // Intenta cargar SOLO el modelo GLB del paquete
        let glbLoaded = false;
        BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "assets/models/props/",
            "package.glb",
            this.scene
        ).then((result) => {
            if (result.meshes.length > 0) {
                const rootMesh = result.meshes[0];
                rootMesh.parent = packageGroup;
                rootMesh.position = new BABYLON.Vector3(0, 0, 0);
                rootMesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5); // Escala aumentada
                rootMesh.checkCollisions = true;
                glbLoaded = true;
                console.log("Paquete GLB cargado exitosamente (sin bolsa)");
            }
        }).catch((e) => {
            console.warn("No se pudo cargar package.glb, usando fallback:", e);
            if (!glbLoaded) {
                this.createPackageFallback(packageGroup);
            }
        });
        
        // Crear fallback procedural si falla el GLB
        if (!glbLoaded) {
            setTimeout(() => {
                if (!glbLoaded) {
                    this.createPackageFallback(packageGroup);
                }
            }, 500);
        }
        
        // Añadir rotación suave constante
        this.scene.onBeforeRenderObservable.add(() => {
            if (packageGroup && packageGroup.rotation) {
                packageGroup.rotation.y += 0.01;
            }
        });
        
        console.log("Paquete creado exitosamente");
        return packageGroup;
    }
    
    createPackageFallback(parentGroup) {
        // Cuerpo principal de la caja
        const mainBox = BABYLON.MeshBuilder.CreateBox("packageMain_" + Math.random(), {
            width: 1.5,
            height: 1,
            depth: 1.5
        }, this.scene);
        mainBox.parent = parentGroup;
        mainBox.position.y = 0.5;
        
        // Material principal (rojo Uber Eats)
        const mainMaterial = new BABYLON.StandardMaterial("packageMainMat_" + Math.random(), this.scene);
        mainMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
        mainMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        mainBox.material = mainMaterial;
        
        // Tapa de la caja
        const lid = BABYLON.MeshBuilder.CreateBox("packageLid_" + Math.random(), {
            width: 1.6,
            height: 0.1,
            depth: 1.6
        }, this.scene);
        lid.parent = parentGroup;
        lid.position.y = 1.05;
        
        const lidMaterial = new BABYLON.StandardMaterial("lidMat_" + Math.random(), this.scene);
        lidMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        lid.material = lidMaterial;
        
        // Asa para llevar
        const handle = BABYLON.MeshBuilder.CreateTorus("packageHandle_" + Math.random(), {
            diameter: 1,
            thickness: 0.08,
            tessellation: 16
        }, this.scene);
        handle.parent = parentGroup;
        handle.position.y = 1.3;
        handle.rotation.x = Math.PI / 2;
        
        const handleMaterial = new BABYLON.StandardMaterial("handleMat_" + Math.random(), this.scene);
        handleMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        handle.material = handleMaterial;
        
        // Añadir sombra si está disponible
        if (window.shadowGenerator) {
            window.shadowGenerator.addShadowCaster(mainBox);
            window.shadowGenerator.addShadowCaster(lid);
            window.shadowGenerator.addShadowCaster(handle);
        }
        
        // Habilitar colisiones
        mainBox.checkCollisions = true;
    }

    createDecorations() {
        console.log("Creando decoraciones...");
        
        // Crear árboles
        for (let i = 0; i < 30; i++) {
            // Evitar posiciones cerca de calles y edificios
            let x, z;
            do {
                x = (Math.random() - 0.5) * 180;
                z = (Math.random() - 0.5) * 180;
            } while (Math.abs(x) < 30 && Math.abs(z) < 30); // Evitar centro
            
            this.createTree(x, z);
        }
        
        console.log("Decoraciones creadas");
    }

    createTree(x, z) {
        // Intenta cargar tree.glb
        BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "assets/models/props/",
            "tree.glb",
            this.scene
        ).then((result) => {
            if (result.meshes.length > 0) {
                const treeMesh = result.meshes[0];
                treeMesh.position = new BABYLON.Vector3(x, 0, z);
                treeMesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5); // Escala aumentada
                result.meshes.forEach(mesh => {
                    mesh.checkCollisions = true;
                });
                console.log("Árbol GLB cargado");
            }
        }).catch(e => {
            console.warn("No se pudo cargar tree.glb, usando fallback:", e);
            // Fallback procedural
            const trunk = BABYLON.MeshBuilder.CreateCylinder(`tree_trunk_${x}_${z}`, {
                height: 4,
                diameter: 0.6
            }, this.scene);
            
            trunk.position = new BABYLON.Vector3(x, 2, z);
            
            const trunkMat = new BABYLON.StandardMaterial(`trunk_mat_${x}_${z}`, this.scene);
            trunkMat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
            trunk.material = trunkMat;
            trunk.checkCollisions = true;
            
            const foliage1 = BABYLON.MeshBuilder.CreateSphere(`tree_foliage1_${x}_${z}`, {
                diameter: 5,
                segments: 8
            }, this.scene);
            
            foliage1.position = new BABYLON.Vector3(x, 5, z);
            
            const foliageMat = new BABYLON.StandardMaterial(`foliage_mat_${x}_${z}`, this.scene);
            foliageMat.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1);
            foliage1.material = foliageMat;
            foliage1.checkCollisions = true;
            
            const foliage2 = foliage1.clone(`tree_foliage2_${x}_${z}`);
            foliage2.scaling.scaleInPlace(0.8);
            foliage2.position.y = 5.5;
            foliage2.checkCollisions = true;
            
            const treeData = { trunk, foliage1, foliage2 };
            this.trees.push(treeData);
        });
    }

    createBench(x, z, rotation) {
        // Base del banco
        const benchBase = BABYLON.MeshBuilder.CreateBox(`bench_base_${x}_${z}`, {
            width: 3,
            height: 0.5,
            depth: 1
        }, this.scene);
        
        benchBase.position = new BABYLON.Vector3(x, 0.25, z);
        benchBase.rotation.y = rotation * (Math.PI / 180); // Convertir a radianes
        
        const benchMat = new BABYLON.StandardMaterial(`bench_mat_${x}_${z}`, this.scene);
        benchMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2); // Color madera
        
        benchBase.material = benchMat;
        
        // Respaldo
        const benchBack = BABYLON.MeshBuilder.CreateBox(`bench_back_${x}_${z}`, {
            width: 3,
            height: 1.5,
            depth: 0.1
        }, this.scene);
        
        benchBack.position = new BABYLON.Vector3(x, 1.25, z + 0.45);
        benchBack.rotation.y = rotation * (Math.PI / 180);
        benchBack.material = benchMat;
        
        // Añadir sombras
        if (window.shadowGenerator) {
            window.shadowGenerator.addShadowCaster(benchBase);
            window.shadowGenerator.addShadowCaster(benchBack);
        }
        
        return { base: benchBase, back: benchBack };
    }

    createStreetLights() {
        const lightPositions = [
            { x: -40, z: -40 }, { x: 40, z: -40 },
            { x: -40, z: 40 }, { x: 40, z: 40 },
            { x: 0, z: -40 }, { x: 0, z: 40 },
            { x: -40, z: 0 }, { x: 40, z: 0 }
        ];
        
        lightPositions.forEach((pos, index) => {
            const light = this.createStreetLight(pos.x, pos.z, index);
            this.streetLights.push(light);
        });
        
        console.log(`${this.streetLights.length} farolas creadas`);
    }

    createStreetLight(x, z, index) {
        // Intenta cargar street_light.glb
        BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "assets/models/props/",
            "street_light.glb",
            this.scene
        ).then((result) => {
            if (result.meshes.length > 0) {
                const lightMesh = result.meshes[0];
                lightMesh.position = new BABYLON.Vector3(x, 0, z);
                lightMesh.scaling = new BABYLON.Vector3(2, 2, 2); // Escala aumentada
                result.meshes.forEach(mesh => {
                    mesh.checkCollisions = true;
                });
                console.log("Farola GLB cargada");
            }
        }).catch(e => {
            console.warn("No se pudo cargar street_light.glb, usando fallback:", e);
            // Fallback procedural
            const pole = BABYLON.MeshBuilder.CreateCylinder(`light_pole_${index}`, {
                height: 10,
                diameter: 0.4
            }, this.scene);
            
            pole.position = new BABYLON.Vector3(x, 5, z);
            
            const poleMat = new BABYLON.StandardMaterial(`pole_mat_${index}`, this.scene);
            poleMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            pole.material = poleMat;
            pole.checkCollisions = true;
            
            // Brazo del poste
            const arm = BABYLON.MeshBuilder.CreateBox(`light_arm_${index}`, {
                width: 0.2,
                height: 0.2,
                depth: 2
            }, this.scene);
            
            arm.position = new BABYLON.Vector3(x, 7, z - 1);
            arm.rotation.z = Math.PI / 4;
            arm.material = poleMat;
            arm.checkCollisions = true;
            
            // Lámpara
            const lamp = BABYLON.MeshBuilder.CreateSphere(`light_lamp_${index}`, {
                diameter: 1
            }, this.scene);
            
            lamp.position = new BABYLON.Vector3(x, 7.5, z - 2);
            
            const lampMat = new BABYLON.StandardMaterial(`lamp_mat_${index}`, this.scene);
            lampMat.diffuseColor = new BABYLON.Color3(1, 1, 0.5);
            lampMat.emissiveColor = new BABYLON.Color3(1, 1, 0.3);
            lamp.material = lampMat;
            lamp.checkCollisions = true;
            
            // Luz puntual
            const light = new BABYLON.PointLight(`street_light_${index}`, 
                new BABYLON.Vector3(x, 7.5, z - 2), this.scene);
            light.diffuse = new BABYLON.Color3(1, 1, 0.8);
            light.intensity = 0.7;
            light.range = 20;
            
            // Añadir sombras
            if (window.shadowGenerator) {
                window.shadowGenerator.addShadowCaster(pole);
                window.shadowGenerator.addShadowCaster(arm);
                window.shadowGenerator.addShadowCaster(lamp);
            }
            
            return { pole, arm, lamp, light };
        });
    }

    // Función para limpiar la ciudad
    dispose() {
        // Limpiar todos los objetos creados
        this.buildings.forEach(building => {
            if (building.mesh) building.mesh.dispose();
            if (building.roof) building.roof.dispose();
            if (building.sign) building.sign.dispose();
        });
        
        this.trees.forEach(tree => {
            if (tree.trunk) tree.trunk.dispose();
            if (tree.foliage1) tree.foliage1.dispose();
            if (tree.foliage2) tree.foliage2.dispose();
        });
        
        this.streetLights.forEach(light => {
            if (light.pole) light.pole.dispose();
            if (light.arm) light.arm.dispose();
            if (light.lamp) light.lamp.dispose();
            if (light.light) light.light.dispose();
        });
        
        if (this.ground) {
            this.ground.dispose();
        }
        
        // Limpiar arrays
        this.buildings = [];
        this.restaurants = [];
        this.houses = [];
        this.trees = [];
        this.streetLights = [];
        this.ground = null;
        
        console.log("Ciudad eliminada");
    }
}

// Exportación por defecto para compatibilidad
export default CityBuilder;