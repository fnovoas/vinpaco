/**
 * Punto de entrada de la aplicación
 * Orquesta la inicialización de todos los módulos
 */

import { setupInteractions } from './interactions';

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
const initializeApp = (): void => {
  setupInteractions();
};

// Esperar a que el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
