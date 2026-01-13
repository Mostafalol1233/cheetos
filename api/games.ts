import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = process.env.BACKEND_URL || 'http://fi4.bot-hosting.net:22135';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = (req.method || 'GET').toUpperCase();
 
  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Auth-Token, Authorization',
    );
    res.status(200).end();
    return;
  }
 
  try {
    const incomingUrl = req.url || '';
    const qIndex = incomingUrl.indexOf('?');
    const query = qIndex >= 0 ? incomingUrl.slice(qIndex) : '';
 
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (v === undefined) continue;
      if (Array.isArray(v)) headers[k] = v.join(',');
      else headers[k] = String(v);
    }
    delete headers.host;
    delete headers['content-length'];
 
    const targetUrl = `${BACKEND_URL}/api/games${query}`;
    const init: RequestInit = {
      method,
      headers,
    };
 
    if (method !== 'GET' && method !== 'HEAD') {
      init.body = req.body !== undefined ? JSON.stringify(req.body) : undefined;
      if (!headers['content-type'] && !headers['Content-Type']) {
        (init.headers as Record<string, string>)['content-type'] = 'application/json';
      }
    }
 
    const response = await fetch(targetUrl, init);
 
    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);
    if (contentType) res.setHeader('content-type', contentType);
 
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      res.json(data);
      return;
    }
 
    const text = await response.text();
    res.send(text);
  } catch (error) {
    console.error('Error proxying games request:', error);
    res.status(500).json({ error: 'Failed to proxy games request' });
  }
}