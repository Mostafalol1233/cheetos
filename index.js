// Root entrypoint shim — import and run the backend server in ./backend
// This allows running `node index.js` from the repository root.

(async () => {
  try {
    // Ensure we're resolving relative to the backend directory
    const path = './backend/index.js';
    await import(path);
  } catch (err) {
    console.error('Failed to start backend from root index.js:', err);
    process.exitCode = 1;
  }
})();
