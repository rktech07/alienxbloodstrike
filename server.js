const http = require('http');
const fs   = require('fs');
const path = require('path');

const port    = 8080;
const rootDir = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.wav':  'audio/wav',
    '.mp4':  'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf':  'application/font-ttf',
    '.eot':  'application/vnd.ms-fontobject',
    '.otf':  'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    // CORS headers for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Handle config save
    if (req.method === 'POST' && req.url === '/save-config') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                fs.writeFile(path.join(rootDir, 'config.json'), JSON.stringify(parsed, null, 4), err => {
                    if (err) { res.writeHead(500); res.end(JSON.stringify({ error: 'Save failed' })); }
                    else     { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({ ok: true })); }
                });
            } catch(e) {
                res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Static file serving
    let urlPath = req.url.split('?')[0]; // strip query params
    if (urlPath === '/') urlPath = '/index.html';

    let filePath   = path.join(rootDir, urlPath);
    
    // Support clean URLs: if path has no extension and .html exists, use it
    if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
    }

    const ext        = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, {'Content-Type':'text/plain'});
                res.end('404 Not Found: ' + urlPath);
            } else {
                res.writeHead(500, {'Content-Type':'text/plain'});
                res.end('500 Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(port, () => {
    console.log(`\n🔥 BloodStrike Hub server running at:\n   http://localhost:${port}/\n   Admin Panel: http://localhost:${port}/admin.html\n`);
});
