const http = require('http');
const fs = require('fs');
const path = require('path');

let cachedHtml = '';
try {
  cachedHtml = require('./html_bundle.js');
} catch (e) {
  try {
    cachedHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  } catch (err) {
    cachedHtml = '<h1>Sistem Informasi Kerusakan Inventaris</h1>';
  }
}

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate'
  });
  res.end(cachedHtml);
});

module.exports = server;

if (require.main === module || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
  });
}
