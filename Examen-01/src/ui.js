// ui.js - Gestión de la interfaz de usuario

import { GameUtils } from './utils.js';

export class UIManager {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.miniMap = null;
        this.miniMapCanvas = null;
        this.miniMapCtx = null;
        this.fpsCounter = 0;
        this.lastTime = 0;
        
        // Exponer para acceso global
        window.uiManager = this;
    }

    init() {
        console.log("Inicializando UI Manager...");
        this.setupMiniMap();
        this.updateStats();
        this.setupFPSCounter();
        console.log("UI Manager inicializado");
    }

    setupMiniMap() {
        this.miniMapCanvas = document.getElementById('miniMapCanvas');
        if (!this.miniMapCanvas) {
            console.warn("No se encontró miniMapCanvas");
            return;
        }
        
        this.miniMapCtx = this.miniMapCanvas.getContext('2d');
        this.miniMapCanvas.width = 180;
        this.miniMapCanvas.height = 180;
        
        // Dibujar mini mapa cada frame
        this.scene.onBeforeRenderObservable.add(() => {
            this.drawMiniMap();
        });
    }

    drawMiniMap() {
        if (!this.miniMapCtx || !this.game || !this.game.player) return;
        
        const ctx = this.miniMapCtx;
        const width = this.miniMapCanvas.width;
        const height = this.miniMapCanvas.height;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Fondo
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Borde
        ctx.strokeStyle = '#00cc66';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // Centro del mapa
        const centerX = width / 2;
        const centerZ = height / 2;
        const scale = 0.9;
        
        // Dibujar calles (gris)
        ctx.fillStyle = '#333333';
        ctx.fillRect(centerX - 75, centerZ - 4, 150, 8); // Calle horizontal
        ctx.fillRect(centerX - 4, centerZ - 75, 8, 150); // Calle vertical
        
        // Dibujar restaurantes (amarillo)
        ctx.fillStyle = '#FFD700';
        if (this.game.restaurants) {
            this.game.restaurants.forEach(restaurant => {
                if (restaurant && restaurant.position) {
                    const x = centerX + (restaurant.position.x / 200) * (width * scale);
                    const z = centerZ + (restaurant.position.z / 200) * (height * scale);
                    ctx.fillRect(x - 3, z - 3, 6, 6);
                }
            });
        }
        
        // Dibujar casas (rosa)
        ctx.fillStyle = '#FF69B4';
        if (this.game.houses) {
            this.game.houses.forEach(house => {
                if (house && house.position) {
                    const x = centerX + (house.position.x / 200) * (width * scale);
                    const z = centerZ + (house.position.z / 200) * (height * scale);
                    ctx.fillRect(x - 3, z - 3, 6, 6);
                }
            });
        }
        
        // Dibujar jugador (azul Uber)
        const playerPos = this.game.player.getPosition();
        const playerX = centerX + (playerPos.x / 200) * (width * scale);
        const playerZ = centerZ + (playerPos.z / 200) * (height * scale);
        
        ctx.fillStyle = '#0066CC';
        ctx.beginPath();
        ctx.arc(playerX, playerZ, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar dirección del jugador
        const rotation = this.game.player.getRotation();
        const dirX = playerX + Math.sin(rotation.y) * 8;
        const dirZ = playerZ + Math.cos(rotation.y) * 8;
        
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerX, playerZ);
        ctx.lineTo(dirX, dirZ);
        ctx.stroke();
        
        // Dibujar paquete si está en el suelo
        if (this.game.currentPackage && !this.game.hasPackage) {
            const packagePos = this.game.currentPackage.position;
            const packageX = centerX + (packagePos.x / 200) * (width * scale);
            const packageZ = centerZ + (packagePos.z / 200) * (height * scale);
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(packageX - 2, packageZ - 2, 4, 4);
        }
    }

    updateStats() {
        if (!this.game) return;
        
        const stats = this.game.getGameStats();
        
        // Actualizar elementos de la UI
        const statusElement = document.getElementById('gameStatus');
        const orderElement = document.getElementById('currentOrder');
        const restaurantElement = document.getElementById('restaurantName');
        const houseElement = document.getElementById('houseName');
        const deliveriesElement = document.getElementById('deliveryCount');
        const scoreElement = document.getElementById('scorePoints');
        const levelElement = document.getElementById('gameLevel');
        const timerElement = document.getElementById('gameTimer');
        
        if (statusElement) {
            if (stats.isGameOver) {
                statusElement.textContent = stats.gameWon ? "¡GANASTE!" : "TIEMPO AGOTADO";
                statusElement.className = `stat-value ${stats.gameWon ? 'delivering' : 'waiting'}`;
            } else {
                statusElement.textContent = stats.hasPackage ? "Con pedido" : "Esperando pedido";
                statusElement.className = `stat-value ${stats.hasPackage ? 'delivering' : 'waiting'}`;
            }
        }
        
        if (orderElement) {
            if (stats.isGameOver) {
                orderElement.textContent = stats.gameWon ? "¡Misión completada!" : "Presiona R para reiniciar";
            } else {
                orderElement.textContent = stats.hasPackage ? 
                    `Entregar en ${stats.currentHouse}` : 
                    `Recoger de ${stats.currentRestaurant}`;
            }
        }
        
        if (restaurantElement) {
            restaurantElement.textContent = stats.currentRestaurant;
        }
        
        if (houseElement) {
            houseElement.textContent = stats.currentHouse;
        }
        
        if (deliveriesElement) {
            deliveriesElement.textContent = `${stats.deliveries}/${stats.deliveryGoal || 5}`;
        }
        
        if (scoreElement) {
            scoreElement.textContent = stats.score;
        }
        
        if (levelElement) {
            levelElement.textContent = stats.level;
        }
        
        // Mostrar tiempo restante en vez de tiempo transcurrido
        if (timerElement) {
            const timeRemaining = stats.timeRemaining !== undefined ? stats.timeRemaining : (180 - stats.time);
            timerElement.textContent = GameUtils.formatTime(Math.max(0, timeRemaining));
            // Cambiar color si queda poco tiempo
            if (timeRemaining <= 30) {
                timerElement.style.color = '#ff4444';
            } else if (timeRemaining <= 60) {
                timerElement.style.color = '#ffaa00';
            } else {
                timerElement.style.color = '#00ff88';
            }
        }
        
        // Actualizar también en pantalla de pausa si está visible
        const pd = document.getElementById('pauseDeliveries');
        const ps = document.getElementById('pauseScore');
        const pt = document.getElementById('pauseTime');
        if (pd) pd.textContent = stats.deliveries;
        if (ps) ps.textContent = stats.score;
        if (pt) pt.textContent = GameUtils.formatTime(stats.time);
        
        // Actualizar posición del jugador en debug
        if (this.game.player) {
            const pos = this.game.player.getPosition();
            const pp = document.getElementById('playerPosition');
            const pspeed = document.getElementById('playerSpeed');
            if (pp) {
                pp.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
            }
            if (pspeed && this.game.player.currentSpeed !== undefined) {
                pspeed.textContent = Math.round(this.game.player.currentSpeed * 100);
            }
        }
    }

    update() {
        this.updateStats();
        this.updateFPSCounter();
    }

    setupFPSCounter() {
        this.lastTime = Date.now();
        this.fpsCounter = 0;
    }

    updateFPSCounter() {
        this.fpsCounter++;
        const currentTime = Date.now();
        
        if (currentTime - this.lastTime >= 1000) {
            const fpsEl = document.getElementById('fpsCounter');
            if (fpsEl) fpsEl.textContent = this.fpsCounter;
            this.fpsCounter = 0;
            this.lastTime = currentTime;
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        GameUtils.showNotification(message, type, duration);
    }

    showGameUI() {
        const ui = document.getElementById('gameUI');
        const start = document.getElementById('startScreen');
        const pause = document.getElementById('pauseScreen');
        const over = document.getElementById('gameOverScreen');
        
        if (ui) ui.style.display = 'block';
        if (start) start.style.display = 'none';
        if (pause) pause.style.display = 'none';
        if (over) over.style.display = 'none';
        
        console.log("Mostrando UI del juego");
    }

    showStartScreen() {
        const start = document.getElementById('startScreen');
        const ui = document.getElementById('gameUI');
        const pause = document.getElementById('pauseScreen');
        const over = document.getElementById('gameOverScreen');
        
        if (start) start.style.display = 'flex';
        if (ui) ui.style.display = 'none';
        if (pause) pause.style.display = 'none';
        if (over) over.style.display = 'none';
    }

    togglePauseScreen(show) {
        const pause = document.getElementById('pauseScreen');
        const ui = document.getElementById('gameUI');
        
        if (show) {
            if (pause) pause.style.display = 'flex';
            if (ui) ui.style.display = 'none';
        } else {
            if (pause) pause.style.display = 'none';
            if (ui) ui.style.display = 'block';
        }
    }

    showGameOverScreen() {
        const stats = this.game.getGameStats();
        
        const fd = document.getElementById('finalDeliveries');
        const fs = document.getElementById('finalScore');
        const ft = document.getElementById('finalTime');
        const fl = document.getElementById('finalLevel');
        
        if (fd) fd.textContent = stats.deliveries;
        if (fs) fs.textContent = stats.score;
        if (ft) ft.textContent = GameUtils.formatTime(stats.time);
        if (fl) fl.textContent = stats.level;
        
        const over = document.getElementById('gameOverScreen');
        const ui = document.getElementById('gameUI');
        
        if (over) over.style.display = 'flex';
        if (ui) ui.style.display = 'none';
    }

    hideGameOverScreen() {
        const over = document.getElementById('gameOverScreen');
        const ui = document.getElementById('gameUI');
        
        if (over) over.style.display = 'none';
        if (ui) ui.style.display = 'block';
    }
}