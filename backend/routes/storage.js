// Compatibility shim: re-export backend/storage.js for imports from routes/
import { storage } from '../storage.js';
export { storage };
