// Console filter for production - hides API calls and sensitive data
(function() {
  if (process.env.NODE_ENV !== 'production') return;
  
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
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
    const str = typeof message === 'string' ? message : JSON.stringify(message);
    return filterPatterns.some(pattern => pattern.test(str));
  }
  
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
  
  // Keep console.warn and console.error for debugging
})();
