Home Hue
========

A Node.js + Particle Photon project for wireless control of Hue lights.

Setup
=====

The general setup is:

1. At least one Particle Photon with two buttons connected to D0 and D1

2. A Node.js server that receives commands over TCP and the web, and in
response issues commands to a Hue Bridge on the same network.  (This 
server runs nicely on a Raspberry Pi)

Turn the Photons on first.  When the Node.js server boots, it will call the
Photons based on the ID listed in config.js to register the server's IP,
which will then cause the Photons to open TCP connections to the server.

Installation
------------

1. Follow the instructions to edit config.example.js and then save the changes
as "config.js".

2. Install photon/main.ino on each of your Photon boards and hook up a button 
to both D0 and D1.

3. run `npm install` in the root of this folder.

4. run `node main.js` to start the server