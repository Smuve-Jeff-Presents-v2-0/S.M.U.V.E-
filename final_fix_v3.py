import re

# --- Fix ThaSpotComponent ---
with open('src/app/components/tha-spot/tha-spot.component.ts', 'r') as f:
    content = f.read()

# 1. Standardize spacing and remove excessive newlines
content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

# 2. Fix the handlePresenceAction block which had double braces/weirdness
content = re.sub(r'handlePresenceAction\(entry: SocialPresence\) \{.*?\}\s+\}',
                 r'handlePresenceAction(entry: SocialPresence) {\n    this.setActiveRoom(entry.roomId);\n    const game = this.getPresenceGame(entry);\n    if (game) {\n      this.openPreview(game);\n      return;\n    }\n  }',
                 content, flags=re.DOTALL)

# 3. Ensure previewGame is gone
content = content.replace('this.previewGame(', 'this.openPreview(')

# 4. Correct the fallback data correctly this time.
# The games: [ { "id": "1", ... } ] structure.
with open('src/app/hub/tha-spot-feed.fallback.ts', 'r') as f:
    fb_content = f.read()

# Remove all misplaced previewVideo/bannerImage
fb_content = re.sub(r'"previewVideo": "[^"]*",\s*', '', fb_content)
fb_content = re.sub(r'"bannerImage": "[^"]*",\s*', '', fb_content)

video = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-dj-playing-at-a-club-24545-large.mp4"
banner = "https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1200&q=80"

# Find the start of games array
start_index = fb_content.find('"games": [')
if start_index != -1:
    # Process only the part after "games": [
    header = fb_content[:start_index]
    games_part = fb_content[start_index:]

    # Add properties to objects in this part
    def add_props(m):
        obj = m.group(0)
        return obj.replace('{', f'{{\n      "previewVideo": "{video}",\n      "bannerImage": "{banner}",', 1)

    fixed_games = re.sub(r'\{[^{}]*\}', add_props, games_part)
    fb_content = header + fixed_games

with open('src/app/components/tha-spot/tha-spot.component.ts', 'w') as f:
    f.write(content)

with open('src/app/hub/tha-spot-feed.fallback.ts', 'w') as f:
    f.write(fb_content)
