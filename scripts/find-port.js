/**
 * Find an available port starting from the given port number.
 * Increments by 1 until a free port is found.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const net = require('net');

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(startPort, '127.0.0.1', () => {
      server.close();
      resolve(startPort);
    });

    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

const startPort = Number(process.env.PORT) || 3000;

findAvailablePort(startPort).then((port) => {
  console.log('Starting on port', port);
  require('child_process').spawn('npx', ['next', 'dev', '-p', String(port)], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NEXTAUTH_URL: `http://localhost:${port}` },
  });
});
