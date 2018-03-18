/* global io, Reveal */
/* eslint-disable no-console */

const url = 'http://localhost:3002';
if (typeof io !== 'undefined') {
  let socket = io(url);
  // let id = null;

  const changeEvent = (_event) => {
    // event.previousSlide, event.currentSlide, event.indexh, event.indexv
    socket.emit('returnIndex', Reveal.getIndices());
  };

  Reveal.addEventListener('fragmentshown', changeEvent);
  Reveal.addEventListener('fragmenthidden', changeEvent);
  Reveal.addEventListener('slidechanged', changeEvent);

  const getSlidesObj = () => {
    const slides = Reveal.getSlides();
    return slides.map(s => s.innerHTML);
  };

  const connectionCallback = () => {
    socket.emit('host', true);
    socket.emit('returnIndex', Reveal.getIndices()); // Set client index when host refresh

    // socket.on('id', (newId) => {
    //   id = newId;
    // });

    socket.on('overview', () => {
      Reveal.toggleOverview();
    });

    socket.on('getSlides', () => {
      socket.emit('returnSlides', getSlidesObj());
    });

    socket.on('getIndex', () => {
      socket.emit('returnIndex', Reveal.getIndices());
    });

    socket.on('move', (data) => {
      switch (data.direction) {
        case 'up':
          Reveal.up();
          break;
        case 'down':
          Reveal.down();
          break;
        case 'left':
          Reveal.left();
          break;
        case 'right':
          Reveal.right();
          break;
        default:
          console.log('Unknown direction');
      }
    });

    socket.on('disconnect', () => {
      console.log('disconnect');
    });
    socket.on('reconnecting', (attempt) => {
      console.log('reconnecting attempt', attempt);
    });
    socket.on('reconnect', (attempt) => {
      console.log('reconnected after attempt', attempt);

      // Disconnect from old socket when connect is called again
      socket.disconnect();
      socket = io.connect(url);
      socket.on('connect', connectionCallback);
    });
  };

  socket.on('connect', connectionCallback);
}
