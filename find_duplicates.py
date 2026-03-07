import sys

with open('src/app/services/audio-engine.service.ts', 'r') as f:
    lines = f.readlines()

in_literal = False
keys = set()
for i, line in enumerate(lines):
    if '{' in line:
        # This is a very naive check
        pass
    if 'sendA:' in line:
        print(f"Line {i+1}: {line.strip()}")
    if 'sendB:' in line:
        print(f"Line {i+1}: {line.strip()}")
