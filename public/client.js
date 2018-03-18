/* global io, Hammer, Reveal */
/* eslint-disable no-console */

let socket = io();
const mc = new Hammer.Manager(document.body, {
  recognizers: [
    [Hammer.Tap, { taps: 2, posThreshold: 20 }],
    [Hammer.Press, { threshold: 50, time: 200 }],
    [Hammer.Pinch],
    [Hammer.Swipe],
  ],
});
const UP_KEY = 38;
const DOWN_KEY = 40;
const LEFT_KEY = 37;
const RIGHT_KEY = 39;
let id = null;
const statusDom = document.getElementById('status');
const previewDom = document.getElementById('preview');
const indexDom = document.getElementById('index');

mc
  .on('tap', (e) => {
    // socket.emit('overview');
    socket.emit('move', { direction: 'right' });
    e.preventDefault();
  })
  .on('swipedown', (e) => {
    socket.emit('move', { direction: 'up' });
    e.preventDefault();
  })
  .on('swipeup', (e) => {
    socket.emit('move', { direction: 'down' });
    e.preventDefault();
  })
  .on('swiperight', (e) => {
    socket.emit('move', { direction: 'left' });
    e.preventDefault();
  })
  .on('swipeleft', (e) => {
    socket.emit('move', { direction: 'right' });
    e.preventDefault();
  });

document.addEventListener('keydown', (e) => {
  switch (e.which) {
    case UP_KEY:
      socket.emit('move', { direction: 'up' });
      break;
    case DOWN_KEY:
      socket.emit('move', { direction: 'down' });
      break;
    case LEFT_KEY:
      socket.emit('move', { direction: 'left' });
      break;
    case RIGHT_KEY:
      socket.emit('move', { direction: 'right' });
      break;
    default:
      return;
  }
  // Prevent page scroll after arrow key press
  e.preventDefault();
}, false);

function connectionCallback() {
  socket.emit('client');
  socket.emit('getSlides');
  socket.emit('getIndex');

  socket.on('id', (newId) => {
    id = newId;
    statusDom.textContent = `Connected. ID: ${id}`;
  });

  socket.on('hostStatus', (status) => {
    if (!status) {
      alert('Host not connected'); /* eslint-disable-line no-alert */
    }
  });

  socket.on('returnSlides', (slides) => {
    // Remove all doms in preview
    while (previewDom.firstChild) {
      previewDom.removeChild(previewDom.firstChild);
    }
    for (const slide of slides) {
      const section = document.createElement('section');
      section.innerHTML = slide;
      previewDom.appendChild(section);
    }
    Reveal.initialize({
      touch: false,
      controls: false,
      keyboard: {
        UP_KEY: null,
        DOWN_KEY: null,
        LEFT_KEY: null,
        RIGHT_KEY: null,
      },
    });
  });

  socket.on('returnIndex', (index) => {
    const { h, v, f } = index;
    indexDom.textContent = `Slide: ${h}, Verticle: ${v}, Fragment:${f}`;
    try {
      Reveal.slide(h, v, f);
      Reveal.next();
    } catch (err) {
      console.error(err);
      console.log('Reveal might not be initialized');
      // const interval = setInterval(() => {
      //   try {
      //     Reveal.slide(h, v, f);
      //     Reveal.next();
      //     clearInterval(interval);
      //   } catch (err2) {
      //     console.error(err2);
      //   }
      // }, 1000);
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    statusDom.textContent = 'Connecting...';
  });
  socket.on('reconnecting', (attempt) => {
    console.log('reconnecting attempt', attempt);
  });
  socket.on('reconnect', (attempt) => {
    console.log('reconnected after attempt', attempt);

    // Disconnect from old socket when connect is called again
    socket.disconnect();
    socket = io.connect();
    socket.on('connect', connectionCallback);
  });
}

socket.on('connect', connectionCallback);
