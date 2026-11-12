import { spawn } from 'node:child_process';

const build = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { stdio: 'inherit' });
const server = spawn(process.execPath, ['--env-file-if-exists=.env.local', 'server/index.mjs'], { stdio: 'inherit' });

const shutdown = (signal) => {
  build.kill(signal);
  server.kill(signal);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
