// utils.js - Funciones utilitarias

export class GameUtils {
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static distance(vec1, vec2) {
        if (!vec1 || !vec2) return Infinity;
        return BABYLON.Vector3.Distance(vec1, vec2);
    }

    static isNear(obj1, obj2, threshold = 5) {
        if (!obj1 || !obj2 || !obj1.position || !obj2.position) return false;
        return this.distance(obj1.position, obj2.position) < threshold;
    }

    static randomColor() {
        return new BABYLON.Color3(
            Math.random(),
            Math.random(),
            Math.random()
        );
    }

    static flashMesh(mesh, color, duration = 500) {
        if (!mesh || !mesh.material) return;

        const originalColor = mesh.material.diffuseColor 
            ? mesh.material.diffuseColor.clone() 
            : new BABYLON.Color3(1, 1, 1);
        
        mesh.material.diffuseColor = color;

        setTimeout(() => {
            if (mesh && mesh.material) {
                mesh.material.diffuseColor = originalColor;
            }
        }, duration);
    }

    static showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            console.warn("No se encontró notificationContainer");
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Auto-remover después de la duración
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    static createSkybox(scene) {
        try {
            // Fallback: color de fondo simple
            scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0);
            return null;
        } catch (error) {
            console.warn("Error creando skybox:", error);
            scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0);
            return null;
        }
    }
}