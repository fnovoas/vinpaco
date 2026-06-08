# VInPaCo - Visor Interactivo de Paleta de Colores
Herramienta interactiva para detectar, generar y visualizar paletas de colores de imágenes pequeñas usando K-Means en espacio LAB.  

>VInPaCo es útil para cuando se quiere pasar una imagen de poca resolución o tipo pixel art a otro medio color por color, y se va a trabajar con una paleta de colores limitada escogida al gusto; como para pintar en físico sobre una cuadrícula o para hacer un bordado.

## Uso
0. Accede a https://fnovoas.github.io/vinpaco/
1. Carga una imagen (en general, de poca resolución y que contenga pocos colores).  
Al subirla, el sistema aplica estos límites:
   - **Resolución:** si la dimensión mayor mide entre 1000 y 1999 px, se escala automáticamente para que quede en 999 px, manteniendo la proporción. Si alguna dimensión es 2000 px o más, la imagen se rechaza.
   - **Colores:** si la imagen tiene más de 500 colores únicos (pero menos de 5000), se reduce automáticamente su paleta a 500 colores. Con 5000 colores o más, se rechaza.
2. Elige la cantidad de colores para la paleta (entre 1 y 500) y pulsa **Generar paleta** si quieres una paleta distinta a la aplicada al cargar.
3. Visualiza la vista previa, pudiendo habilitar y deshabilitar cada uno de los colores, y obtener las coordenadas y color de cada pixel haciendo clic. Puedes marcar con clic derecho los colores de la lista para recordarte cuáles ya has pintado.
4. Descarga la imagen resultante (aplicada la paleta y solo con los colores que tengas habilitados en el momento).

## Tecnologías usadas
- **TypeScript**: Para escribir toda la lógica de la aplicación, ofreciendo tipado estático, autocompletado y un código más seguro y robusto.
- **HTML5 & Vanilla CSS**: Para construir la estructura y el estilo visual de la interfaz de usuario sin necesidad de frameworks adicionales.
- **HTML5 Canvas API**: Para el procesamiento de imágenes a nivel de píxel, la extracción de los colores originales y el renderizado interactivo con zoom de la paleta generada.
- **esbuild**: Como empaquetador (bundler) ultrarrápido para transcompilar el código TypeScript y generar el archivo `visor.js` minificado.
- **Node.js & npm**: Para la gestión de las dependencias de desarrollo y la ejecución de los scripts de compilación.
- **live-server**: Para el servidor de desarrollo local con capacidad de recarga en tiempo real (*live-reload*).

## Estructura del proyecto
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
```make start```  
Abrir ```http://localhost:8080```   

```make stop``` para apagar todo. ```make restart``` detiene, espera 2 segundos y vuelve a iniciar.  

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

## El algoritmo  
Se usa **K-Means** para reducir la cantidad de colores de una imagen, un proceso conocido como **cuantización de paleta**. A diferencia del K-Means tradicional que trabaja directamente con todos los píxeles a la vez, esta implementación primero agrupa los colores únicos presentes en la imagen y cuenta exactamente cuántas veces aparece cada uno. Luego, para asegurar que los colores resultantes sean visualmente coherentes, convierte estos colores únicos del espacio tradicional **RGB** al espacio de color **LAB**, en el cual las distancias matemáticas representan de manera mucho más fiel las diferencias de color tal como las percibe el ojo humano.

Para comenzar a buscar los colores representativos o "centros", el algoritmo utiliza un método de inicialización avanzado conocido como **K-Means++**. En lugar de elegir los colores iniciales completamente al azar, elige el primer centro aleatoriamente pero dándole más probabilidad a los colores más frecuentes de la imagen. Los siguientes centros se escogen asignando mayor probabilidad a aquellos colores que se encuentran más alejados de los centros que ya fueron elegidos. Esta técnica garantiza que los colores iniciales de la paleta estén bien distribuidos y dispersos, lo que ayuda a evitar resultados de mala calidad o colores repetidos.

Una vez establecidos los centros iniciales, arranca el proceso iterativo central de K-Means, el cual se ejecuta de forma "ponderada". En cada iteración, el algoritmo asigna cada color único de la imagen original al centro más cercano midiendo la distancia en el espacio LAB. Al momento de recalcular y mover la posición de estos centros, no se hace un promedio simple de los colores asignados, sino que se toma en cuenta el "peso" o frecuencia original de cada color. Es decir, un color que ocupa miles de píxeles arrastrará el centro hacia él con mucha más fuerza que un color que aparece en un solo píxel. Estos ajustes se repiten hasta que los centros ya no se mueven significativamente o hasta alcanzar un máximo de veinte iteraciones.

Dado que el resultado final del algoritmo puede depender mucho de la suerte que se tuvo al elegir los colores en el primer paso, la implementación ejecuta este proceso completo diez veces distintas desde cero. En cada uno de estos intentos, calcula un valor de inercia, que básicamente mide qué tan compactos y precisos quedaron los grupos de colores. Al terminar todos los intentos, el algoritmo descarta los demás y se queda exclusivamente con el conjunto de centros que logró la menor inercia, lo que representa matemáticamente la paleta óptima para esa imagen.

En la etapa final, esos centros óptimos descubiertos en el espacio LAB se convierten de regreso al formato RGB estándar. El algoritmo hace un último recorrido por cada píxel de la imagen original, evalúa a cuál de estos nuevos colores de la paleta reducida se asemeja más, y reemplaza el color original por el nuevo, generando así la imagen resultante con los colores cuantizados y asegurándose de respetar intactos los píxeles que eran originalmente transparentes.
