#!/usr/bin/env bash
# Auto-answer all drizzle-kit generate prompts with Enter (create column)
cd /home/ubuntu/evox-fiscal

# Use expect to auto-answer all interactive prompts
expect -c '
set timeout 300
spawn npx drizzle-kit generate
while {1} {
  expect {
    "create column" { send "\r"; exp_continue }
    "rename column" { exp_continue }
    "renamed from another column" { exp_continue }
    "will be created" { exp_continue }
    eof { break }
    timeout { break }
  }
}
wait
' 2>&1

echo "=== GENERATE DONE ==="

# Now run migrate
npx drizzle-kit migrate 2>&1

echo "=== MIGRATE DONE ==="
