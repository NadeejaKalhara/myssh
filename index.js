let fs = require('fs'),
  inspect = require('util').inspect,
  ssh2 = require('ssh2'),
  net = require('net');

new ssh2.Server({
  hostKeys: [fs.readFileSync('host.key')]
}, client => {
  console.log('Client connected!');
  client
    .on('authentication', ctx => {
      if (
        ctx.method === 'password'
        && ctx.username === 'nadee'
        && ctx.password === 'nadee'
      ) {
        ctx.accept();
      } else {
        ctx.reject();
      }
    })
    .on('ready', () => {
      console.log('Client authenticated!');
      client
        .on('session', (accept, reject) => {
          let session = accept();
          session.on('shell', function(accept, reject) {
            let stream = accept();
          });
        })
        .on('request', (accept, reject, name, info) => {
          if (name === 'tcpip-forward') {
            accept();
            net.createServer(function(socket) {
              socket.setEncoding('utf8');
              client.forwardOut(
                info.bindAddr, info.bindPort,
                socket.remoteAddress, socket.remotePort,
                (err, upstream) => {
                  if (err) {
                    socket.end();
                    return console.error('not working: ' + err);
                  }
                  upstream.pipe(socket).pipe(upstream);
                });
            }).listen(info.bindPort);
          } else {
            reject();
          }
        });
    });
}).listen(8080, function() {
});