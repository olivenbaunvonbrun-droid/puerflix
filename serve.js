const http = require('http');
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const PORT = 3000;
const DIST = path.join(__dirname, 'dist');
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

// Cloud Database Storage (JSON-backed cloud store per user)
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cloud_db.json');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getCloudDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading cloud db:', e);
    }
  }
  return { users: {}, shares: {} };
}

function saveCloudDb(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving cloud db:', e);
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Helper to resolve channel or playlist from YouTube
async function resolveYouTubeItem(input) {
  const trimmed = input.trim();

  // 1. Playlist check
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/) || trimmed.match(/^(PL[a-zA-Z0-9_-]+)$/);
  if (playlistMatch) {
    const playlistId = playlistMatch[1];
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const rssRes = await fetch(rssUrl);
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const parsed = xmlParser.parse(xml);
      const title = parsed?.feed?.title || `Playlist (${playlistId.slice(0, 8)})`;
      let avatarUrl = undefined;
      const firstEntry = Array.isArray(parsed?.feed?.entry) ? parsed.feed.entry[0] : parsed?.feed?.entry;
      if (firstEntry && firstEntry['media:group']?.['media:thumbnail']?.['@_url']) {
        avatarUrl = firstEntry['media:group']['media:thumbnail']['@_url'];
      }
      return {
        id: playlistId,
        type: 'PLAYLIST',
        title: title.replace(/ - YouTube$/, ''),
        handle: 'Playlist',
        avatarUrl,
        addedAt: Date.now(),
        enabled: true,
      };
    }
    throw new Error('Playlist não encontrada ou privada no YouTube.');
  }

  // 2. Channel ID check (UC...)
  const channelIdMatch = trimmed.match(/UC[a-zA-Z0-9_-]{22}/);
  if (channelIdMatch) {
    const channelId = channelIdMatch[0];
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRes = await fetch(rssUrl);
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const parsed = xmlParser.parse(xml);
      const title = parsed?.feed?.title || `Canal (${channelId.slice(0, 8)})`;
      return {
        id: channelId,
        type: 'CHANNEL',
        title: title.replace(/ - YouTube$/, ''),
        handle: `@${channelId.slice(0, 10)}`,
        avatarUrl: `https://yt3.googleusercontent.com/ytc/AIdro_placeholder=s176-c-k-c0x00ffffff-no-rj`,
        addedAt: Date.now(),
        enabled: true,
      };
    }
  }

  // 3. Handle check (@handle)
  const handleMatch = trimmed.match(/@([a-zA-Z0-9_.-]+)/) || trimmed.match(/^[a-zA-Z0-9_.-]{3,30}$/);
  const handle = handleMatch ? (trimmed.startsWith('@') ? trimmed : `@${trimmed.replace(/.*youtube\.com\//, '').replace(/^@/, '')}`) : `@${trimmed}`;
  
  const pageUrl = `https://www.youtube.com/${handle}`;
  const pageRes = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    }
  });

  if (pageRes.ok) {
    const html = await pageRes.text();
    const idMatch = 
      html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) ||
      html.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/) ||
      html.match(/"browseId":"(UC[a-zA-Z0-9_-]{22})"/) ||
      html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/) ||
      html.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    
    const channelId = idMatch?.[1];
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
    const title = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '') : handle;
    const avatarMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
    const avatarUrl = avatarMatch?.[1] || undefined;

    if (channelId) {
      return {
        id: channelId,
        type: 'CHANNEL',
        title,
        handle,
        avatarUrl,
        addedAt: Date.now(),
        enabled: true,
      };
    }
  }

  throw new Error(`Não foi possível localizar o canal ou playlist para "${trimmed}". Verifique se o link está correto.`);
}

const COUNTRY_LOCALES = {
  BR: { gl: 'BR', hl: 'pt-BR', acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8' },
  PT: { gl: 'PT', hl: 'pt-PT', acceptLanguage: 'pt-PT,pt;q=0.9,en;q=0.8' },
  US: { gl: 'US', hl: 'en-US', acceptLanguage: 'en-US,en;q=0.9' },
  GB: { gl: 'GB', hl: 'en-GB', acceptLanguage: 'en-GB,en;q=0.9' },
  ES: { gl: 'ES', hl: 'es-ES', acceptLanguage: 'es-ES,es;q=0.9,en;q=0.8' },
  FR: { gl: 'FR', hl: 'fr-FR', acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.8' },
  IT: { gl: 'IT', hl: 'it-IT', acceptLanguage: 'it-IT,it;q=0.9,en;q=0.8' },
  DE: { gl: 'DE', hl: 'de-DE', acceptLanguage: 'de-DE,de;q=0.9,en;q=0.8' },
  JP: { gl: 'JP', hl: 'ja-JP', acceptLanguage: 'ja-JP,ja;q=0.9,en;q=0.8' },
  ALL: { gl: '', hl: 'pt-BR', acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8' },
};

// Helper to search channels directly from YouTube with nationality preference
async function searchYouTubeChannels(query, country = 'BR') {
  const locale = COUNTRY_LOCALES[(country || 'BR').toUpperCase()] || COUNTRY_LOCALES.BR;
  let url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`;
  if (locale.gl) {
    url += `&gl=${locale.gl}`;
  }
  if (locale.hl) {
    url += `&hl=${locale.hl}`;
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': locale.acceptLanguage,
    }
  });
  const html = await res.text();
  const initialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!initialDataMatch) return [];
  const data = JSON.parse(initialDataMatch[1]);
  const channels = [];

  function extractChannelRenderers(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.channelRenderer) {
      const c = obj.channelRenderer;
      let avatar = c.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';
      if (avatar.startsWith('//')) avatar = `https:${avatar}`;

      channels.push({
        id: c.channelId,
        type: 'CHANNEL',
        title: c.title?.simpleText || 'Canal',
        handle: c.subscriberCountText?.simpleText || `@${c.channelId.slice(0, 10)}`,
        avatarUrl: avatar,
        description: c.descriptionSnippet?.runs?.map(r => r.text).join('') || '',
        addedAt: Date.now(),
        enabled: true,
      });
      return;
    }
    for (const key of Object.keys(obj)) {
      extractChannelRenderers(obj[key]);
    }
  }
  extractChannelRenderers(data);
  return channels.slice(0, 15);
}

// Helper to extract videos from a channel or playlist videos page when RSS XML fails
async function fetchVideosFromChannelPage(channelId, handle, playlistId) {
  let targetUrl = '';
  if (playlistId) {
    targetUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  } else if (handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    targetUrl = `https://www.youtube.com/${cleanHandle}/videos`;
  } else if (channelId) {
    targetUrl = `https://www.youtube.com/channel/${channelId}/videos`;
  }

  if (!targetUrl) return [];

  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    }
  });

  if (!res.ok) return [];

  const html = await res.text();
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!match) return [];

  try {
    const data = JSON.parse(match[1]);
    const list = [];
    const seen = new Set();

    function walk(o) {
      if (!o || typeof o !== 'object') return;
      if (o.lockupViewModel) {
        const vm = o.lockupViewModel;
        const id = vm.contentId;
        const title = vm.metadata?.lockupMetadataViewModel?.title?.content;
        const thumb = vm.contentImage?.thumbnailViewModel?.image?.sources?.slice(-1)[0]?.url;
        if (id && title && !seen.has(id)) {
          seen.add(id);
          list.push({ id, title, thumb });
        }
        return;
      }
      if (o.videoRenderer) {
        const vr = o.videoRenderer;
        const id = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText;
        const thumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url;
        if (id && title && !seen.has(id)) {
          seen.add(id);
          list.push({ id, title, thumb });
        }
        return;
      }
      for (const k of Object.keys(o)) walk(o[k]);
    }

    walk(data);
    return list;
  } catch (e) {
    console.error('Error parsing ytInitialData in fallback:', e);
    return [];
  }
}

function generateRssXml(videos, title = 'Channel Videos') {
  const entries = videos.map(v => `
  <entry>
    <yt:videoId>${v.id}</yt:videoId>
    <title><![CDATA[${v.title}]]></title>
    <published>${new Date().toISOString()}</published>
    <media:group>
      <media:title><![CDATA[${v.title}]]></media:title>
      <media:thumbnail url="${v.thumb || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}"/>
      <media:description><![CDATA[]]></media:description>
    </media:group>
  </entry>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <title>${title}</title>
  ${entries}
</feed>`;
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = parsedUrl.pathname;

  // API: Search channels on YouTube
  if (pathname === '/api/search-channels') {
    const query = parsedUrl.searchParams.get('query') || '';
    const country = parsedUrl.searchParams.get('country') || 'BR';
    if (!query.trim()) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, channels: [] }));
      return;
    }
    try {
      const channels = await searchYouTubeChannels(query.trim(), country);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, channels }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API: Resolve Channel or Playlist
  if (pathname === '/api/resolve') {
    const input = parsedUrl.searchParams.get('input');
    if (!input) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Parâmetro input ausente' }));
      return;
    }
    try {
      const item = await resolveYouTubeItem(input);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, item }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API: Proxy RSS feed for Channel or Playlist
  if (pathname === '/api/rss') {
    const channelId = parsedUrl.searchParams.get('channel_id');
    const playlistId = parsedUrl.searchParams.get('playlist_id');
    const handle = parsedUrl.searchParams.get('handle');

    let targetUrl = '';
    if (playlistId) {
      targetUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    } else if (channelId) {
      targetUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }

    // 1. Try YouTube RSS XML feed first
    if (targetUrl) {
      try {
        const rssRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        });
        if (rssRes.ok) {
          const text = await rssRes.text();
          if (text.includes('<entry>')) {
            res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
            res.end(text);
            return;
          }
        }
      } catch (err) {
        console.warn('Direct RSS fetch failed, attempting page fallback:', err.message);
      }
    }

    // 2. Fallback: extract videos directly from channel / playlist videos page
    try {
      const videos = await fetchVideosFromChannelPage(channelId, handle, playlistId);
      if (videos && videos.length > 0) {
        const generatedXml = generateRssXml(videos);
        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
        res.end(generatedXml);
        return;
      }
    } catch (e) {
      console.error('Fallback scraping failed:', e.message);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Could not load videos for this channel');
    return;
  }

  // API: Cloud Auth (Google)
  if (pathname === '/api/cloud/auth-google' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const name = body.name || email.split('@')[0] || 'Usuário Google';
      const avatarUrl = body.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
      const id = body.googleId || (email ? 'google_' + Buffer.from(email).toString('hex').slice(0, 16) : 'usr_' + Date.now());

      const db = getCloudDb();
      if (!db.users[id]) {
        db.users[id] = {
          userProfile: { id, name, email, avatarUrl, isLoggedIn: true, lastSyncedAt: Date.now() },
          channels: [],
          playlists: [],
          categories: [],
          history: [],
          settings: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        db.users[id].userProfile.name = name;
        db.users[id].userProfile.avatarUrl = avatarUrl;
        db.users[id].userProfile.isLoggedIn = true;
        db.users[id].updatedAt = Date.now();
      }
      saveCloudDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        user: db.users[id].userProfile,
        data: db.users[id],
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API: Cloud Sync (Save user data)
  if (pathname === '/api/cloud/sync' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const userId = body.userId;
      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'userId obrigatório' }));
        return;
      }
      const db = getCloudDb();
      if (!db.users[userId]) {
        db.users[userId] = {
          userProfile: { id: userId, name: 'Usuário', email: '', isLoggedIn: true, lastSyncedAt: Date.now() },
        };
      }
      const existing = db.users[userId];
      db.users[userId] = {
        ...existing,
        channels: body.channels !== undefined ? body.channels : existing.channels || [],
        playlists: body.playlists !== undefined ? body.playlists : existing.playlists || [],
        categories: body.categories !== undefined ? body.categories : existing.categories || [],
        history: body.history !== undefined ? body.history : existing.history || [],
        settings: body.settings !== undefined ? body.settings : existing.settings || null,
        updatedAt: Date.now(),
      };
      if (db.users[userId].userProfile) {
        db.users[userId].userProfile.lastSyncedAt = Date.now();
      }
      saveCloudDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, lastSyncedAt: db.users[userId].updatedAt }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API: Cloud Get Data (Load user data)
  if (pathname === '/api/cloud/data' && req.method === 'GET') {
    const userId = parsedUrl.searchParams.get('userId');
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'userId ausente' }));
      return;
    }
    const db = getCloudDb();
    const data = db.users[userId] || null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data }));
    return;
  }

  // API: Create Channel Share Code / Link
  if (pathname === '/api/cloud/share' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const channels = body.channels || [];
      const sharedBy = body.sharedBy || 'Pais PuerFlix';
      const code = 'PF-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const db = getCloudDb();
      db.shares[code] = {
        code,
        channels,
        sharedBy,
        createdAt: Date.now(),
      };
      saveCloudDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        code,
        shareUrl: `http://localhost:${PORT}/?import=${code}`,
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API: Get Shared Channels by Code
  if (pathname === '/api/cloud/share' && req.method === 'GET') {
    const code = (parsedUrl.searchParams.get('code') || '').trim().toUpperCase();
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Código ausente' }));
      return;
    }
    const db = getCloudDb();
    const share = db.shares[code];
    if (!share) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Lista compartilhada não encontrada ou expirada' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, share }));
    return;
  }

  // Serve landing page
  if (pathname.startsWith('/landing')) {
    let relPath = pathname.replace(/^\/landing\/?/, '');
    if (!relPath || relPath === '/') relPath = 'index.html';
    const landingFilePath = path.join(__dirname, 'landing', relPath);
    if (fs.existsSync(landingFilePath) && fs.statSync(landingFilePath).isFile()) {
      const ext = path.extname(landingFilePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(landingFilePath).pipe(res);
      return;
    }
  }

  // Serve root APK file
  if (pathname === '/puertube.apk' || pathname === '/PuerFlix_Oficial.apk') {
    const apkPath = path.join(__dirname, 'puertube.apk');
    if (fs.existsSync(apkPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="PuerFlix_Oficial.apk"',
      });
      fs.createReadStream(apkPath).pipe(res);
      return;
    }
  }

  // Serve assets from root assets/
  if (pathname.startsWith('/assets/')) {
    const assetFilePath = path.join(__dirname, pathname);
    if (fs.existsSync(assetFilePath) && fs.statSync(assetFilePath).isFile()) {
      const ext = path.extname(assetFilePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(assetFilePath).pipe(res);
      return;
    }
  }

  // Static files server
  let filePath = path.join(DIST, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`PuerFlix Server with API & Search proxy running at http://localhost:${PORT}`);
});
