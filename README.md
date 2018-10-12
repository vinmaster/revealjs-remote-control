# Revealjs Remote Control

![Screenshot](/screenshot.png)

A small plugin to allow remote control and view of next section for [reveal.js](https://github.com/hakimel/reveal.js). Right now it only supports viewing next section and movement between sections

The preview next section is using a small subset of reveal.js syntax and sending the innerHTML to the connected remote control clients

# Installation

- Copy this repo into plugin folder in reveal.js
- Run `npm install` in that folder
- Paste this into `dependencies` in `Reveal.initialize` "{ src: 'http://localhost:3002/socket.io/socket.io.js', async: true }, { src: 'plugin/remote-control/remote.js', async: true }"

# Running

- `npm start` or `node server.js`
- Goto "localhost:3002" in your local machine or find that machine's network port and use with port 3002

