/* eslint-disable no-console */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3002;
const server = http.createServer(requestListener); // eslint-disable-line no-use-before-define
const io = require('socket.io')(server);

function requestListener(req, res) {
  console.log(`${req.method} ${req.url}`);

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Parse URL
  const parsedUrl = url.parse(req.url);
  // Specify directory to serve
  const publicDir = './public';
  // Extract URL path
  let pathname = `${publicDir}${parsedUrl.pathname}`;
  // Remove access to directory above this one
  pathname = pathname.replace(/^(\.)+/, '.');
  // Based on the URL path, extract the file extention. e.g. .js, .doc, ...
  const ext = path.parse(pathname).ext || '.html';
  // Maps file extention to MIME typere
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };

  if (ext === '.png' || ext === '.jpg') {
    // Depend on images folder in reveal.js directory
    pathname = `../../${parsedUrl.pathname}`;
  }

  fs.exists(pathname, (exist) => {
    if (!exist) {
      // If the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // If is a directory search for index file matching the extention
    if (fs.statSync(pathname).isDirectory()) pathname += `index${ext}`;

    // Read file from file system
    fs.readFile(pathname, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // If the file is found, set Content-type and send data
        res.setHeader('Content-type', map[ext] || 'text/plain');
        res.end(data);
      }
    });
  });
}
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  console.log(`Listening on ${bind}`);
}

let host = null;
const clients = [];
const requests = {};

function getSocket(socketId) {
  if (!io) {
    console.log('io is not set');
    return;
  }
  const sockets = io.sockets.connected;
  return sockets[socketId];
}

function emitToClients(msg, data) {
  for (const c of clients) {
    c.emit(msg, data);
  }
}

io.on('connection', (socket) => {
  requests[socket.id] = [];

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    const index = clients.indexOf(socket.id);
    if (index > -1) {
      clients.splice(index, 1);
    }
  });

  socket.on('host', () => {
    host = socket;
    socket.host = true;
    console.log('host connected');
    socket.emit('id', socket.id);
  });

  socket.on('client', () => {
    console.log('client connected');
    socket.host = false;
    clients.push(socket);
    socket.emit('id', socket.id);
    if (!host) {
      socket.emit('hostStatus', host);
    }
  });

  socket.on('getSlides', () => {
    if (!host) { return; }
    requests[socket.id].push('getSlides');
    host.emit('getSlides');
  });

  socket.on('returnSlides', (slides) => {
    if (!host) { return; }
    for (const id of Object.keys(requests)) {
      if (requests[id].includes('getSlides')) {
        requests[id] = requests[id].filter(r => r !== 'getSlides');
        const client = getSocket(id);
        if (client) {
          client.emit('returnSlides', slides);
        } else {
          console.log('Client not found', id);
        }
      }
    }
  });

  socket.on('getIndex', () => {
    if (!host) { return; }
    requests[socket.id].push('getIndex');
    host.emit('getIndex');
  });

  socket.on('returnIndex', (index) => {
    if (!host) { return; }
    emitToClients('returnIndex', index);
  });

  socket.on('overview', () => {
    if (!host) { return; }
    host.emit('overview');
  });

  socket.on('move', (data) => {
    if (!host) { return; }
    host.emit('move', {
      id: socket.id,
      ...data,
    });
  });
});

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
