# Experimenting with WebRTC

The purpose of this app was just to dip my toes into WebRTC and signaling SDP offers/answers using websockets. It is currently only set up for local environments (experimenting), as no STUN or TURN servers are being used.

To run it locally, run `yarn install && yarn dev`. In two separate browser windows, you can then visit **localhost:3001** and join the same room. Be sure to allow the camera + mic permissions.
