import sys

with open('src/app/hub/tha-spot-feed.fallback.ts', 'r') as f:
    content = f.read()

# Fix the misplaced previewVideo and bannerImage in rooms rules
# The issue is they were added inside "rules": { ... } of GameRoom,
# but GameRoom rules doesn't have these properties. Games do.

# I need to find where they were added and move them to games.
# Actually, I'll just remove them from rules and make sure they are in games.

import re

# Remove from rules blocks
content = re.sub(r'"previewVideo": "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-dj-playing-at-a-club-24545-large.mp4",\s+"bannerImage": "https://images.unsplash.com/photo-1514525253361-bee243870eb2\?auto=format&fit=crop&w=1200&q=80",', '', content)

# Now add them to the first game in the "games": [ ... ] list if they are not there
# Wait, games already have these properties in my previous sed attempt if I targeted correctly.
# Let's check a game entry.
with open('src/app/hub/tha-spot-feed.fallback.ts', 'w') as f:
    f.write(content)
