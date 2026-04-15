import sys
import re

with open('src/app/hub/tha-spot-feed.fallback.ts', 'r') as f:
    content = f.read()

video = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-dj-playing-at-a-club-24545-large.mp4"
banner = "https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1200&q=80"

# Find the games array
games_match = re.search(r'"games":\s*\[(.*?)\]', content, re.DOTALL)
if games_match:
    games_content = games_match.group(1)

    # Update each game object
    def add_props(m):
        obj = m.group(0)
        if '"previewVideo"' not in obj:
            # Add after the first {
            obj = obj.replace('{', f'{{\n      "previewVideo": "{video}",\n      "bannerImage": "{banner}",', 1)
        return obj

    updated_games = re.sub(r'\{[^{}]*\}', add_props, games_content)
    content = content.replace(games_content, updated_games)

with open('src/app/hub/tha-spot-feed.fallback.ts', 'w') as f:
    f.write(content)
