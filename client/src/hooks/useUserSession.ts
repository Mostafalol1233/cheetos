import { useState, useEffect } from 'react';

// Generate a persistent session ID for the user
export function useUserSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let storedSessionId = localStorage.getItem('cheetos_gaming_session_id');
    
    if (!storedSessionId) {
      storedSessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('cheetos_gaming_session_id', storedSessionId);
    }
    
    setSessionId(storedSessionId);
  }, []);

  return sessionId;
}