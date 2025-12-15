// main.js - Archivo principal que inicializa el juego

import { Game } from './game.js';
import { UIManager } from './ui.js';

class Main {
    constructor() {
        console.log("Iniciando Main...");
        
        this.canvas = document.getElementById('renderCanvas');
        if (!this.canvas) {
            console.error("No se encontró el canvas!");
            return;
        }
        
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        this.scene = null;
        this.game = null;
        this.ui = null;
        
        // Inicializar inmediatamente
        this.init();
    }

    async init() {
        try {
            console.log("Creando escena...");
            
            // Crear escena
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.collisionsEnabled = true;
            this.scene.gravity = new BABYLON.Vector3(0, -0.981, 0);
            
            // Configurar cámara
            this.setupCamera();
            
            // Configurar luces
            this.setupLights();
            
            // Crear cielo
            this.createSky();
            
            console.log("Inicializando juego...");
            // Inicializar juego
            this.game = new Game(this.scene);
            await this.game.init();
            
            console.log("Inicializando UI...");
            // Inicializar UI
            this.ui = new UIManager(this.scene, this.game);
            this.ui.init();
            
            // Configurar controles de pantalla
            this.setupScreenControls();
            
            // Configurar controles de teclado globales
            this.setupGlobalControls();
            
            console.log("Iniciando render loop...");
            // Iniciar render loop
            this.engine.runRenderLoop(() => {
                // Actualizar cámara para seguir al jugador suavemente
                if (this.game && this.game.player && this.game.player.mesh && this.camera) {
                    const playerPos = this.game.player.getPosition();
                    // Interpolación suave para seguimiento de cámara
                    const currentTarget = this.camera.target;
                    const lerpFactor = 0.1; // Suavizado
                    this.camera.target = new BABYLON.Vector3(
                        currentTarget.x + (playerPos.x - currentTarget.x) * lerpFactor,
                        currentTarget.y + (playerPos.y - currentTarget.y) * lerpFactor,
                        currentTarget.z + (playerPos.z - currentTarget.z) * lerpFactor
                    );
                }
                
                this.scene.render();
                if (this.game) {
                    this.game.update();
                }
                if (this.ui) {
                    this.ui.update();
                }
            });
            
            // Manejar resize de ventana
            window.addEventListener('resize', () => {
                this.engine.resize();
            });
            
            console.log("Juego inicializado correctamente");
            
        } catch (error) {
            console.error("Error al inicializar el juego:", error);
            this.showErrorScreen(error);
        }
    }

    setupCamera() {
        // Cámara orbital que sigue al jugador
        this.camera = new BABYLON.ArcRotateCamera(
            "mainCamera",
            -Math.PI / 2,
            Math.PI / 2.5,
            50,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 10;
        this.camera.upperRadiusLimit = 100;
        this.camera.wheelPrecision = 50;
        
        // Suavizar movimiento de cámara
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI / 2 - 0.1;
    }

    setupLights() {
        // Luz ambiental
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        ambientLight.intensity = 0.7;
        ambientLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        
        // Luz direccional (sol)
        const sunLight = new BABYLON.DirectionalLight(
            "sunLight",
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        sunLight.position = new BABYLON.Vector3(50, 100, 50);
        sunLight.intensity = 0.9;
        sunLight.shadowEnabled = true;
        
        // Configurar sombras
        const shadowGenerator = new BABYLON.ShadowGenerator(1024, sunLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        
        window.shadowGenerator = shadowGenerator;
    }

    createSky() {
        // Color de fondo simple para cielo
        this.scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0);
        
        // Crear una esfera para el cielo
        const skySphere = BABYLON.MeshBuilder.CreateSphere("skySphere", {
            diameter: 500,
            segments: 32,
            sideOrientation: BABYLON.Mesh.BACKSIDE
        }, this.scene);
        
        const skyMaterial = new BABYLON.StandardMaterial("skyMaterial", this.scene);
        skyMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
        skyMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyMaterial.backFaceCulling = false;
        
        skySphere.material = skyMaterial;
        skySphere.infiniteDistance = true;
        
        return skySphere;
    }

    setupGlobalControls() {
        // Control de teclado global
        window.addEventListener('keydown', (e) => {
            if (this.game && !this.game.isPaused) {
                this.game.handleKeyPress(e.key);
            }
            
            // Tecla ESC para pausa
            if (e.key === 'Escape') {
                if (this.game) {
                    const wasPaused = this.game.togglePause();
                    if (this.ui) {
                        this.ui.togglePauseScreen(wasPaused);
                    }
                }
            }
        });
    }

    setupScreenControls() {
        console.log("Configurando controles de pantalla...");
        
        // Botón de inicio
        document.getElementById('startButton').addEventListener('click', () => {
            console.log("Botón inicio clickeado");
            document.getElementById('startScreen').style.display = 'none';
            if (this.game) {
                this.game.start();
            }
            if (this.ui) {
                this.ui.showGameUI();
            }
        });
        
        // Spacebar para recoger/entregar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                if (this.game) {
                    this.game.handleSpacePress();
                }
            }
        });
        
        // Botón de pausa
        document.getElementById('pauseButton').addEventListener('click', () => {
            if (this.game) {
                const wasPaused = this.game.togglePause();
                if (this.ui) {
                    this.ui.togglePauseScreen(wasPaused);
                }
            }
        });
        
        // Botón de reanudar
        document.getElementById('resumeButton').addEventListener('click', () => {
            if (this.game) {
                const wasPaused = this.game.togglePause();
                if (this.ui) {
                    this.ui.togglePauseScreen(!wasPaused);
                }
            }
        });
        
        // Botón de reinicio
        document.getElementById('resetButton').addEventListener('click', () => {
            if (this.game) {
                this.game.reset();
            }
            if (this.ui) {
                this.ui.updateStats();
            }
        });
        
        // Botón de reinicio (pantalla pausa)
        document.getElementById('restartButton').addEventListener('click', () => {
            if (this.game) {
                this.game.reset();
            }
            if (this.ui) {
                this.ui.togglePauseScreen(false);
                this.ui.updateStats();
            }
        });
        
        // Botón de jugar de nuevo
        document.getElementById('playAgainButton').addEventListener('click', () => {
            if (this.game) {
                this.game.reset();
            }
            if (this.ui) {
                this.ui.hideGameOverScreen();
                this.ui.updateStats();
            }
        });
        
        // Botón de menú principal
        document.getElementById('menuButton').addEventListener('click', () => {
            if (this.game) {
                this.game.reset();
            }
            if (this.ui) {
                this.ui.showStartScreen();
            }
        });
        
        // Botón de volver al menú desde game over
        document.getElementById('backToMenuButton').addEventListener('click', () => {
            if (this.game) {
                this.game.reset();
            }
            if (this.ui) {
                this.ui.showStartScreen();
            }
        });
    }

    showErrorScreen(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 9999;
            max-width: 80%;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h2>Error al cargar el juego</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px;">
                Recargar página
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Iniciar el juego cuando se cargue la página
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM cargado, iniciando juego...");
    try {
        const main = new Main();
        window.gameInstance = main;
    } catch (error) {
        console.error("Error fatal al crear Main:", error);
    }
});