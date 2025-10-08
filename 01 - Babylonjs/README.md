# Babylon.js - Playground01 (local)

Archivos incluidos:

- `index.html` - página que carga Babylon.js y `playground01.js`.
- `playground01.js` - tu escena (adaptada para usar desde un archivo JS separado).
- `package.json` - script `npm run serve` para levantar un servidor estático.

Cómo correr (Windows PowerShell):

1) Usando npm (recomendado):

```powershell
# desde la carpeta "01 - Babylonjs"
npm install # si necesitas instalar dependencias globales; no es obligatorio
npm run serve
```

Luego abre en el navegador: http://localhost:5500

2) Usando Python (si tienes Python instalado):

```powershell
# desde la carpeta "01 - Babylonjs"
# Python 3.x
python -m http.server 5500
```

Notas:
- Los assets de textura se cargan desde el CDN de playground.babylonjs.com. Necesitas conexión a internet para las texturas y la librería CDN.
- Si quieres que todo funcione sin internet, descarga las texturas y cambia las rutas en `playground01.js` a archivos locales.