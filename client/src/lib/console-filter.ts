// Console filter for production - hides API calls and sensitive data
(function() {
  'use strict';
  
  // Only run in production
  if (process.env.NODE_ENV !== 'production') return;
  
  // Store original methods
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Filter patterns to hide
  const filterPatterns = [
    /fetch.*api/i,
    /api/i,
    /token/i,
    /authorization/i,
    /bearer/i,
    /password/i,
    /secret/i,
    /key/i,
    /admin/i,
    /auth/i,
    /login/i,
    /jwt/i,
    /session/i,
    /cookie/i,
  ];
  
  function shouldFilter(message: any): boolean {
    if (!message) return false;
    const str = typeof message === 'string' ? message : JSON.stringify(message);
    return filterPatterns.some(pattern => pattern.test(str));
  }
  
  // Override console methods with filtering
  console.log = function(...args: any[]) {
    if (!args.some(shouldFilter)) {
      originalLog.apply(console, args);
    }
  };
  
  console.info = function(...args: any[]) {
    if (!args.some(shouldFilter)) {
      originalInfo.apply(console, args);
    }
  };
  
  console.debug = function(...args: any[]) {
    if (!args.some(shouldFilter)) {
      originalDebug.apply(console, args);
    }
  };
  
  // Filter warnings and errors but be less aggressive
  console.warn = function(...args: any[]) {
    // Only filter very sensitive warnings
    const hasSensitive = args.some(arg => {
      const str = typeof arg === 'string' ? arg : JSON.stringify(arg);
      return /(token|password|secret|key|auth)/i.test(str);
    });
    
    if (!hasSensitive) {
      originalWarn.apply(console, args);
    }
  };
  
  console.error = function(...args: any[]) {
    // Only filter very sensitive errors
    const hasSensitive = args.some(arg => {
      const str = typeof arg === 'string' ? arg : JSON.stringify(arg);
      return /(token|password|secret|key|auth)/i.test(str);
    });
    
    if (!hasSensitive) {
      originalError.apply(console, args);
    }
  };
  
  // Export for potential use elsewhere
  (window as any).__consoleFilter = {
    shouldFilter,
    patterns: filterPatterns
  };
})();
