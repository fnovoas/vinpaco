# VInPaCo - Visor Interactivo de Paleta de Colores
Herramienta interactiva para detectar, manipular y generar paletas de colores de imágenes pequeñas usando K-Means en espacio LAB.

## Uso
1. Carga una imagen de resolución menor a 1000x1000 pixeles.  
2. Elige la cantidad de colores para la paleta.  
3. Clica en generar paleta.  
4. Visualiza la vista previa, pudiendo habilitar y deshabilitar cada uno de los colores, y obtener las coordenadas y color de cada pixel haciendo clic.  
5. Descarga la imagen resultante (aplicada la paleta).

## Despliegue
El proyecto está desplegado en GitHub Pages en https://fnovoas.github.io/vinpaco/

## Tecnologías usadas
- **TypeScript**: Para escribir toda la lógica de la aplicación, ofreciendo tipado estático, autocompletado y un código más seguro y robusto.
- **HTML5 & Vanilla CSS**: Para construir la estructura y el estilo visual de la interfaz de usuario sin necesidad de frameworks adicionales.
- **HTML5 Canvas API**: Para el procesamiento de imágenes a nivel de píxel, la extracción de los colores originales y el renderizado interactivo con zoom de la paleta generada.
- **esbuild**: Como empaquetador (bundler) ultrarrápido para transcompilar el código TypeScript y generar el archivo `visor.js` minificado.
- **Node.js & npm**: Para la gestión de las dependencias de desarrollo y la ejecución de los scripts de compilación.
- **live-server**: Para el servidor de desarrollo local con capacidad de recarga en tiempo real (*live-reload*).

## Estructura del Proyecto
```text
vinpaco
├── index.html           # Interfaz de usuario principal
├── Makefile             # Comandos automatizados (build, dev, serve)
├── build.sh             # Script de empaquetado con esbuild
├── package.json         # Dependencias de desarrollo (TypeScript, esbuild)
├── tsconfig.json        # Configuración del compilador TypeScript
└── static/
    ├── css/
    │   └── style.css    # Estilos globales y de componentes
    └── js/
        ├── main.ts         # Punto de entrada de la aplicación
        ├── palette.ts      # Algoritmo de cuantización (K-Means) y conversión de espacios de color (LAB/RGB)
        ├── state.ts        # Almacenamiento del estado global (imagen original, colores generados)
        ├── types.ts        # Definiciones de tipos e interfaces
        ├── ui.ts           # Construcción de la cuadrícula de chips y actualización de componentes
        ├── interactions.ts # Registro de eventos (drag&drop, botones) y orquestación de acciones
        ├── canvas.ts       # Dibujado de la imagen, zoom, color pick y cuadrícula en los <canvas>
        ├── utils.ts        # Funciones matemáticas y conversiones (hex, rgb)
        └── visor.js        # Bundle autogenerado por esbuild listo para el navegador
```

## Desarrollo local
### Requisitos
- Node.js 18+
- npm

### Instalación
```bash
npm install
```
1. **Terminal 1** - Compilar TypeScript con watch automático:
   ```bash
   npm run dev
   ```
   Esto compilará `static/js/main.ts` a `static/js/visor.js` automáticamente cuando se hagan cambios.

2. **Terminal 2** - Servir los archivos localmente:
   ```bash
   npx live-server --no-browser
   ```

3. Abre el navegador en:
   ```
   http://localhost:8080
   ```

Se puede hacer esto mediante  
```make dev```  
```make serve```  
Abrir ```http://localhost:8080```   

```make stop``` para apagar todo.  

Los cambios en TypeScript se recompilan automáticamente y el navegador se actualiza al guardar.

## Build para producción
```bash
npm run build
```
o
```bash
make build
```
Genera el archivo compilado y minificado en `static/js/visor.js`.


