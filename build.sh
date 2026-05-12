#!/bin/bash
# Script de build para compilar TypeScript con esbuild
# Uso: ./build.sh

INPUT_FILE="./static/js/main.ts"
OUTPUT_FILE="./static/js/visor.js"

# Verificar si node_modules existe, si no, instalar dependencias
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
fi

# Ejecutar esbuild
npx esbuild "$INPUT_FILE" --bundle --outfile="$OUTPUT_FILE" --target=es2020 --minify

echo "Build completado. Archivo generado: $OUTPUT_FILE"