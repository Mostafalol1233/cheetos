// Root shim to re-export backend/whatsapp.js for environments that run node index.js at repo root
export * from './backend/whatsapp.js';
export { default } from './backend/whatsapp.js';
