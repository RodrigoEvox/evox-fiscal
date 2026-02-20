import { spawn } from 'child_process';
import * as pty from 'node-pty';

// Use node-pty for proper TTY handling
const term = pty.spawn('npx', ['drizzle-kit', 'generate', '--name', 'v17_chat_history'], {
  name: 'xterm-color',
  cols: 120,
  rows: 30,
  cwd: '/home/ubuntu/evox-fiscal',
  env: process.env,
});

let buffer = '';

term.onData((data) => {
  process.stdout.write(data);
  buffer += data;
  
  // When we see the selection prompt, send Enter to select default (create column)
  if (buffer.includes('create column') && buffer.includes('rename column')) {
    setTimeout(() => {
      term.write('\r');
      buffer = '';
    }, 300);
  }
  
  // Check for completion
  if (buffer.includes('migration file') || buffer.includes('No schema changes')) {
    setTimeout(() => {
      console.log('\n\nGenerate complete. Running migrate...');
      const migrate = spawn('npx', ['drizzle-kit', 'migrate'], {
        cwd: '/home/ubuntu/evox-fiscal',
        stdio: 'inherit',
      });
      migrate.on('close', (code) => {
        console.log(`Migrate exited with code ${code}`);
        process.exit(0);
      });
    }, 1000);
  }
});

term.onExit(({ exitCode }) => {
  if (exitCode !== 0) {
    console.log(`\nGenerate exited with code ${exitCode}`);
  }
});

// Timeout after 120 seconds
setTimeout(() => {
  console.log('\nTimeout reached');
  term.kill();
  process.exit(1);
}, 120000);
