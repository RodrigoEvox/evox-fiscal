#!/usr/bin/env python3
import pexpect
import sys
import os

os.chdir('/home/ubuntu/evox-fiscal')

# Step 1: drizzle-kit generate
print("=== Running drizzle-kit generate ===")
child = pexpect.spawn('npx drizzle-kit generate --name geg_v36', timeout=120, encoding='utf-8')
child.logfile_read = sys.stdout

while True:
    try:
        idx = child.expect([
            r'create column',           # Interactive prompt asking about column
            r'renamed from another',     # Another variant
            r'Migration .* generated',   # Success
            r'No schema changes',        # No changes needed
            pexpect.EOF,
            pexpect.TIMEOUT
        ], timeout=30)
        
        if idx in [0, 1]:
            # Send Enter to select the first option (create column)
            child.sendline('')
        elif idx in [2, 3]:
            print("\n=== Generate completed successfully ===")
            child.expect(pexpect.EOF, timeout=10)
            break
        elif idx == 4:
            print("\n=== Generate process ended ===")
            break
        elif idx == 5:
            print("\n=== Timeout, sending Enter ===")
            child.sendline('')
    except pexpect.EOF:
        print("\n=== Generate process ended (EOF) ===")
        break
    except pexpect.TIMEOUT:
        print("\n=== Timeout ===")
        child.sendline('')

child.close()
print(f"Generate exit status: {child.exitstatus}")

if child.exitstatus != 0:
    print("Generate failed, exiting")
    sys.exit(1)

# Step 2: drizzle-kit migrate
print("\n=== Running drizzle-kit migrate ===")
child2 = pexpect.spawn('npx drizzle-kit migrate', timeout=120, encoding='utf-8')
child2.logfile_read = sys.stdout

try:
    child2.expect(pexpect.EOF, timeout=60)
except pexpect.TIMEOUT:
    print("\n=== Migrate timeout ===")

child2.close()
print(f"\nMigrate exit status: {child2.exitstatus}")
