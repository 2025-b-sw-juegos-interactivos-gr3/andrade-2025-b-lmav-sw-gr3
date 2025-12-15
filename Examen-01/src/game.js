// game.js - Lógica principal del juego

import { Player } from './player.js';
import { CityBuilder } from './city.js';
import { GameUtils } from './utils.js';

export class Game {
    constructor(scene) {
        this.scene = scene;
        this.player = null;
        this.city = null;
        
        // Estado del juego
        this.score = 0;
        this.deliveries = 0;
        this.level = 1;
        this.time = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.isGameOver = false;
        
        // RETO: Tiempo límite y objetivo
        this.timeLimit = 180; // 3 minutos para completar
        this.deliveryGoal = 5; // Entregar 5 pedidos para ganar
        this.timeRemaining = this.timeLimit;
        this.gameWon = false;
        
        // Objetos del juego
        this.currentPackage = null;
        this.currentRestaurant = null;
        this.currentHouse = null;
        this.hasPackage = false;
        
        // Restaurantes y casas disponibles
        this.restaurants = [];
        this.houses = [];
    }

    async init() {
        console.log("Game init llamado");
        
        // Construir ciudad
        this.city = new CityBuilder(this.scene);
        const cityData = this.city.build();
        
        this.restaurants = cityData.restaurants;
        this.houses = cityData.houses;
        
        // Crear jugador
        this.player = new Player(this.scene);
        await this.player.init();
        
        // Crear primer pedido
        this.createNewOrder();
        
        // Configurar colisiones
        this.setupCollisions();
        
        // Iniciar UI básica
        this.updateUI();
        
        console.log("Game init completado");
    }

    setupCollisions() {
        // Habilitar colisiones para todos los objetos relevantes
        this.scene.collisionsEnabled = true;
        
        // Configurar colisiones del jugador
        if (this.player.mesh) {
            this.player.mesh.checkCollisions = true;
            this.player.mesh.ellipsoid = new BABYLON.Vector3(1, 0.5, 1);
            this.player.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0);
        }
    }

    createNewOrder() {
        console.log("Creando nuevo pedido...");
        
        // Seleccionar restaurante y casa aleatorios diferentes al anterior
        let newRestaurant, newHouse;
        do {
            newRestaurant = this.getRandomRestaurant();
        } while (this.restaurants.length > 1 && newRestaurant === this.currentRestaurant);
        
        do {
            newHouse = this.getRandomHouse();
        } while (this.houses.length > 1 && newHouse === this.currentHouse);
        
        this.currentRestaurant = newRestaurant;
        this.currentHouse = newHouse;
        
        console.log("Restaurante seleccionado:", this.currentRestaurant?.name);
        console.log("Casa seleccionada:", this.currentHouse?.name);
        
        // Crear paquete en el restaurante
        this.createPackage();
        
        // Actualizar UI
        this.updateUI();
        
        // Mostrar notificación clara con instrucciones
        GameUtils.showNotification(
            `📦 NUEVO PEDIDO: Ve a "${this.currentRestaurant?.name || 'Restaurante'}" y presiona ESPACIO para recoger`,
            'info'
        );
        
        // Segunda notificación con destino
        setTimeout(() => {
            GameUtils.showNotification(
                `🏠 Destino: "${this.currentHouse?.name || 'Casa'}"`,
                'info'
            );
        }, 1500);
    }

    getRandomRestaurant() {
        // Siempre devolver el único restaurante
        if (this.restaurants.length === 0) {
            console.warn("No hay restaurantes disponibles");
            return null;
        }
        
        // Solo hay un restaurante, siempre es el mismo
        return this.restaurants[0];
    }

    getRandomHouse() {
        if (this.houses.length === 0) {
            console.warn("No hay casas disponibles");
            return null;
        }
        
        const house = this.houses[Math.floor(Math.random() * this.houses.length)];
        
        // Asignar nombre si no lo tiene
        if (!house.name) {
            const names = ["Casa Smith", "Apartamento Jones", "Villa García", "Residencia López"];
            house.name = names[this.houses.indexOf(house) % names.length];
        }
        
        return house;
    }

    createPackage() {
        console.log("Creando paquete...");
        
        // Eliminar paquete anterior si existe
        if (this.currentPackage) {
            this.currentPackage.dispose();
        }
        
        // Crear nuevo paquete en el restaurante
        if (this.currentRestaurant && this.currentRestaurant.position) {
            this.currentPackage = this.city.createPackage(this.currentRestaurant.position);
            this.hasPackage = false;
            console.log("Paquete creado en:", this.currentRestaurant.position);
        } else {
            console.error("No hay restaurante para crear paquete");
        }
    }

    pickupPackage() {
        if (this.hasPackage || !this.currentPackage || !this.currentRestaurant) {
            console.log("No se puede recoger paquete - ya tienes uno o no hay pedido");
            return false;
        }
        
        // Verificar distancia al restaurante (aumentada para mejor jugabilidad)
        const distance = GameUtils.distance(
            this.player.mesh.position,
            this.currentRestaurant.position
        );
        
        console.log("Distancia al restaurante:", distance.toFixed(2));
        
        if (distance < 15) {
            // Recoger paquete - ahora sigue al coche
            this.currentPackage.parent = this.player.mesh;
            this.currentPackage.position = new BABYLON.Vector3(0, 1.5, -2.5); // Encima/detrás del coche
            this.currentPackage.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8); // Un poco más pequeño al llevarlo
            
            this.hasPackage = true;
            
            // Efecto visual en restaurante
            if (this.currentRestaurant.mesh) {
                GameUtils.flashMesh(this.currentRestaurant.mesh, new BABYLON.Color3(0, 1, 0), 800);
            }
            
            // Actualizar UI
            this.updateUI();
            
            // Notificación con destino
            GameUtils.showNotification(
                `✅ ¡Pedido recogido! Llévalo a: ${this.currentHouse?.name || 'la casa'}`,
                "success"
            );
            
            console.log("Paquete recogido exitosamente");
            return true;
        }
        
        // Mensaje de ayuda si está cerca pero no lo suficiente
        if (distance < 25) {
            GameUtils.showNotification(
                `Acércate más al restaurante (${distance.toFixed(0)}m)`,
                "warning"
            );
        }
        
        console.log("Demasiado lejos para recoger paquete");
        return false;
    }

    deliverPackage() {
        if (!this.hasPackage || !this.currentPackage || !this.currentHouse) {
            console.log("No se puede entregar - no tienes paquete o no hay destino");
            return false;
        }
        
        // Verificar distancia a la casa (aumentada para mejor jugabilidad)
        const distance = GameUtils.distance(
            this.player.mesh.position,
            this.currentHouse.position
        );
        
        console.log("Distancia a la casa:", distance.toFixed(2));
        
        if (distance < 15) {
            // Entregar paquete - dejarlo en la casa
            this.currentPackage.parent = null;
            this.currentPackage.position = this.currentHouse.position.clone();
            this.currentPackage.position.y = 1.5;
            this.currentPackage.scaling = new BABYLON.Vector3(1, 1, 1); // Tamaño normal
            
            this.hasPackage = false;
            
            // Incrementar puntuación
            this.deliveries++;
            const points = 100 * this.level;
            this.score += points;
            
            // Bonus por tiempo
            const timeBonus = Math.max(0, 50 - Math.floor(this.time / 10)) * this.level;
            if (timeBonus > 0) {
                this.score += timeBonus;
            }
            
            // Subir de nivel cada 3 entregas
            if (this.deliveries % 3 === 0) {
                this.level++;
                GameUtils.showNotification(`🎉 ¡Nivel ${this.level} alcanzado! Más puntos por entrega`, "success");
            }
            
            // Efecto visual en la casa
            if (this.currentHouse.mesh) {
                GameUtils.flashMesh(this.currentHouse.mesh, new BABYLON.Color3(0, 1, 0), 1000);
            }
            
            // Animación del paquete desapareciendo
            setTimeout(() => {
                if (this.currentPackage) {
                    this.currentPackage.dispose();
                    this.currentPackage = null;
                }
            }, 1500);
            
            // Actualizar UI
            this.updateUI();
            
            // Notificación con puntos y progreso
            const bonusText = timeBonus > 0 ? ` (+${timeBonus} bonus)` : '';
            GameUtils.showNotification(
                `🌟 ¡Entrega ${this.deliveries}/${this.deliveryGoal}! +${points}${bonusText}`,
                "success"
            );
            
            console.log("Paquete entregado exitosamente");
            
            // Verificar si ganó
            if (this.deliveries >= this.deliveryGoal) {
                this.gameOver(true); // ¡Ganó!
                return true;
            }
            
            // Crear nuevo pedido después de un delay
            setTimeout(() => {
                this.createNewOrder();
            }, 2000);
            
            return true;
        }
        
        // Mensaje de ayuda si está cerca pero no lo suficiente
        if (distance < 25) {
            GameUtils.showNotification(
                `Acércate más a la casa (${distance.toFixed(0)}m)`,
                "warning"
            );
        }
        
        console.log("Demasiado lejos para entregar paquete");
        return false;
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        // Actualizar jugador
        if (this.player) {
            this.player.update();
        }
        
        // Actualizar tiempo
        if (this.timerInterval === null) {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver && !this.gameWon) {
                this.time++;
                this.timeRemaining = Math.max(0, this.timeLimit - this.time);
                this.updateUI();
                
                // Verificar si se acabó el tiempo
                if (this.timeRemaining <= 0) {
                    this.gameOver(false); // Perdió por tiempo
                }
                
                // Avisos de tiempo
                if (this.timeRemaining === 60) {
                    GameUtils.showNotification("⚠️ ¡1 MINUTO restante!", "warning");
                } else if (this.timeRemaining === 30) {
                    GameUtils.showNotification("⚠️ ¡30 SEGUNDOS restantes!", "warning");
                } else if (this.timeRemaining === 10) {
                    GameUtils.showNotification("🚨 ¡10 SEGUNDOS!", "warning");
                }
            }
        }, 1000);
    }
    
    gameOver(won) {
        this.isGameOver = true;
        this.gameWon = won;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (won) {
            GameUtils.showNotification(`🏆 ¡GANASTE! ${this.deliveries} entregas en ${this.time}s. Puntos: ${this.score}`, "success");
            console.log("¡Victoria!");
        } else {
            GameUtils.showNotification(`💀 ¡TIEMPO AGOTADO! Solo ${this.deliveries}/${this.deliveryGoal} entregas. Presiona R para reiniciar.`, "warning");
            console.log("Game Over - Tiempo agotado");
        }
        
        this.updateUI();
    }

    handleSpacePress() {
        if (this.isPaused || this.isGameOver || !this.player) return;
        
        if (this.hasPackage) {
            // Intentar entregar
            this.deliverPackage();
        } else {
            // Intentar recoger
            this.pickupPackage();
        }
    }

    handleKeyPress(key) {
        console.log(`Tecla presionada: ${key}`);
        
        if (key === ' ') { // Espacio
            if (this.hasPackage) {
                this.deliverPackage();
            } else {
                this.pickupPackage();
            }
        } else if (key === 'r' || key === 'R') { // Reiniciar posición
            if (this.player) {
                this.player.resetPosition();
            }
        }
    }

    updateUI() {
        // Esta función actualizará la UI a través del UIManager
        // Los datos están disponibles en las propiedades del juego
        if (window.uiManager) {
            window.uiManager.updateStats();
        }
    }

    start() {
        console.log("Game start llamado");
        
        this.isPaused = false;
        this.isGameOver = false;
        this.time = 0;
        this.score = 0;
        this.deliveries = 0;
        this.level = 1;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Crear nuevo pedido
        this.createNewOrder();
        
        // Reposicionar jugador
        if (this.player) {
            this.player.resetPosition();
        }
        
        console.log("Game start completado");
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(`Juego ${this.isPaused ? 'pausado' : 'reanudado'}`);
        
        if (this.isPaused) {
            // Pausar física y animaciones
            this.scene.getAnimationGroups().forEach(ag => ag.pause());
        } else {
            // Reanudar física y animaciones
            this.scene.getAnimationGroups().forEach(ag => ag.restart());
        }
        
        return this.isPaused;
    }

    reset() {
        console.log("Game reset llamado");
        
        this.score = 0;
        this.deliveries = 0;
        this.level = 1;
        this.time = 0;
        this.timeRemaining = this.timeLimit;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameWon = false;
        this.hasPackage = false;
        
        // Limpiar paquete anterior
        if (this.currentPackage) {
            this.currentPackage.dispose();
            this.currentPackage = null;
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Reposicionar jugador
        if (this.player) {
            this.player.resetPosition();
        }
        
        // Crear nuevo pedido
        this.createNewOrder();
        
        // Actualizar UI
        this.updateUI();
        
        console.log("Game reset completado");
    }

    getGameStats() {
        return {
            score: this.score,
            deliveries: this.deliveries,
            deliveryGoal: this.deliveryGoal,
            level: this.level,
            time: this.time,
            timeRemaining: this.timeRemaining,
            timeLimit: this.timeLimit,
            hasPackage: this.hasPackage,
            isGameOver: this.isGameOver,
            gameWon: this.gameWon,
            currentRestaurant: this.currentRestaurant ? this.currentRestaurant.name : 'Ninguno',
            currentHouse: this.currentHouse ? this.currentHouse.name : 'Ninguna'
        };
    }
}