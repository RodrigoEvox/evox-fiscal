import { spawn } from 'child_process';

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd: '/home/ubuntu/evox-fiscal',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    let output = '';
    let errOutput = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
      
      // Auto-select first option (create column) by sending Enter
      if (text.includes('create column') || text.includes('renamed from another column')) {
        setTimeout(() => {
          proc.stdin.write('\n');
        }, 100);
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      errOutput += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Process exited with code ${code}\n${errOutput}`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  console.log('=== Running drizzle-kit generate ===');
  try {
    await runCommand('npx', ['drizzle-kit', 'generate', '--name', 'geg_v36']);
    console.log('\n=== Generate completed ===');
  } catch (e) {
    console.error('Generate error:', e.message);
    process.exit(1);
  }

  console.log('\n=== Running drizzle-kit migrate ===');
  try {
    await runCommand('npx', ['drizzle-kit', 'migrate']);
    console.log('\n=== Migrate completed ===');
  } catch (e) {
    console.error('Migrate error:', e.message);
    process.exit(1);
  }
}

main();
