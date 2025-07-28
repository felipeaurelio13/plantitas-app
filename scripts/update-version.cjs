#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Leer la versión del package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Generar el timestamp de build
const buildTimestamp = new Date().toISOString();
const buildDate = new Date().toLocaleDateString('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

// Leer el archivo de versión actual
const versionFilePath = path.join(__dirname, '..', 'src', 'config', 'version.ts');
let versionContent = fs.readFileSync(versionFilePath, 'utf8');

// Actualizar la versión y timestamp
versionContent = versionContent.replace(
  /export const APP_VERSION = ['"`][^'"`]*['"`];/,
  `export const APP_VERSION = '${version}';`
);

versionContent = versionContent.replace(
  /export const BUILD_TIMESTAMP = ['"`][^'"`]*['"`];/,
  `export const BUILD_TIMESTAMP = '${buildTimestamp}';`
);

versionContent = versionContent.replace(
  /export const BUILD_DATE = ['"`][^'"`]*['"`];/,
  `export const BUILD_DATE = '${buildDate}';`
);

// Escribir el archivo actualizado
fs.writeFileSync(versionFilePath, versionContent);

console.log(`✅ Versión actualizada a v${version} (${buildDate})`);
console.log(`📝 Timestamp de build: ${buildTimestamp}`);