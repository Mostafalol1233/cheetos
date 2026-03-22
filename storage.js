// Root shim to re-export backend/storage.js for environments that run node index.js at repo root
export * from './backend/storage.js';
export { default } from './backend/storage.js';
