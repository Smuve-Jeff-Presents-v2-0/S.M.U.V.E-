import re

# --- Fix ThaSpotComponent ---
with open('src/app/components/tha-spot/tha-spot.component.ts', 'r') as f:
    lines = f.readlines()

# Remove all featuredGame = computed declarations and we will add one back.
new_lines = []
skip_featured = False
for line in lines:
    if 'featuredGame = computed' in line:
        continue
    new_lines.append(line)

# Now find activeRoom and add the storefront signals after it
for i, line in enumerate(new_lines):
    if 'activeRoom = signal<string>(\'all\');' in line:
        new_lines.insert(i+1, "  featuredGame = computed(() => this.games().find(g => g.badgeIds?.includes('featured')) || this.games()[0]);\n")
        new_lines.insert(i+2, "  trendingGames = computed(() => this.games().filter(g => g.badgeIds?.includes('trending')));\n")
        new_lines.insert(i+3, "  newGames = computed(() => this.games().filter(g => g.badgeIds?.includes('new-drop')));\n")
        new_lines.insert(i+4, "  genreRails = computed(() => {\n    const genres = [...new Set(this.games().map(g => g.genre).filter(Boolean))];\n    return genres.map(genre => ({\n      title: genre,\n      games: this.games().filter(g => g.genre === genre)\n    }));\n  });\n")
        break

# Fix previewGame -> openPreview
content = "".join(new_lines)
content = content.replace('this.previewGame(', 'this.openPreview(')

# Fix mangled handlePresenceAction block
# It looks like:
# handlePresenceAction(entry: SocialPresence) {
#   this.setActiveRoom(entry.roomId);
#   const game = this.getPresenceGame(entry);
#   if (game) {
#     this.openPreview(game);
#     return;
#   }
#   if (entry.relationship === 'rival' && !this.showIntelPanel()) {
#     this.onGameClick(game: Game) { ... }
#   }
# }
# We need to clean this up.

mangled_pattern = re.compile(r'handlePresenceAction\(entry: SocialPresence\).*?getPromotionRoute', re.DOTALL)
clean_block = """handlePresenceAction(entry: SocialPresence) {
    this.setActiveRoom(entry.roomId);
    const game = this.getPresenceGame(entry);
    if (game) {
      this.openPreview(game);
      return;
    }
  }

  onGameClick(game: Game) {
    this.launchGame(game);
  }

  isPlaying() {
    return !!this.currentGame();
  }

  toggleIntel() {
    this.showIntelPanel.update((value) => !value);
  }

  getPromotionRoute"""

content = mangled_pattern.sub(clean_block, content)

with open('src/app/components/tha-spot/tha-spot.component.ts', 'w') as f:
    f.write(content)

# --- Fix Fallback Feed ---
with open('src/app/hub/tha-spot-feed.fallback.ts', 'r') as f:
    fb_content = f.read()

# Remove misplaced properties from rules
fb_content = re.sub(r'"previewVideo": "[^"]*",\s*"bannerImage": "[^"]*",', '', fb_content)

# Correctly add to games
video = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-dj-playing-at-a-club-24545-large.mp4"
banner = "https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1200&q=80"

# Find games array
games_match = re.search(r'("games":\s*\[)(.*?)(\]\s*\};)', fb_content, re.DOTALL)
if games_match:
    games_list = games_match.group(2)
    # Match each object { ... }
    def add_to_game(m):
        obj = m.group(0)
        if '"previewVideo"' not in obj:
            obj = obj.replace('{', f'{{\n      "previewVideo": "{video}",\n      "bannerImage": "{banner}",', 1)
        return obj

    fixed_list = re.sub(r'\{[^{}]*\}', add_to_game, games_list)
    fb_content = fb_content.replace(games_list, fixed_list)

with open('src/app/hub/tha-spot-feed.fallback.ts', 'w') as f:
    f.write(fb_content)
