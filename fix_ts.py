import sys

with open('src/app/components/tha-spot/tha-spot.component.ts', 'r') as f:
    lines = f.readlines()

# 1. Fix featuredGame duplicate by keeping only the one that uses recommendedGames
# and adding the fallback to it if needed.
# Actually, the one at line 188 in the log is the original one.
# My added one at 97 is a duplicate.
# Wait, I already removed it with sed 97,106d. Let's re-verify.

# 2. Fix handlePresenceAction and the weird functions injected inside it.
start_fix = -1
end_fix = -1
for i, line in enumerate(lines):
    if 'handlePresenceAction(entry: SocialPresence) {' in line:
        start_fix = i
    if start_fix != -1 and 'getPromotionRoute(promotion: PromotionCard) {' in line:
        end_fix = i
        break

if start_fix != -1 and end_fix != -1:
    new_handle_presence = [
        "  handlePresenceAction(entry: SocialPresence) {\n",
        "    this.setActiveRoom(entry.roomId);\n",
        "    const game = this.getPresenceGame(entry);\n",
        "    if (game) {\n",
        "      this.openPreview(game);\n",
        "      return;\n",
        "    }\n",
        "  }\n",
        "\n",
        "  onGameClick(game: Game) {\n",
        "    this.launchGame(game);\n",
        "  }\n",
        "\n",
        "  isPlaying() {\n",
        "    return !!this.currentGame();\n",
        "  }\n",
        "\n",
        "  toggleIntel() {\n",
        "    this.showIntelPanel.update((value) => !value);\n",
        "  }\n\n"
    ]
    lines[start_fix:end_fix] = new_handle_presence

with open('src/app/components/tha-spot/tha-spot.component.ts', 'w') as f:
    f.writelines(lines)
