import { execSync } from 'child_process';

// Run drizzle-kit generate with --name flag to avoid interactive prompts
try {
  execSync('npx drizzle-kit generate --name geg_v36_fields', { 
    cwd: '/home/ubuntu/evox-fiscal',
    stdio: 'inherit',
    timeout: 60000
  });
  console.log('Generate completed');
} catch (e) {
  console.error('Generate failed:', e.message);
}

try {
  execSync('npx drizzle-kit migrate', {
    cwd: '/home/ubuntu/evox-fiscal', 
    stdio: 'inherit',
    timeout: 60000
  });
  console.log('Migrate completed');
} catch (e) {
  console.error('Migrate failed:', e.message);
}
