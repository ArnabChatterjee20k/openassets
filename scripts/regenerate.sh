#!/usr/bin/env bash
# Regenerate one asset with claude -p, through the same skills and review loop
# as the daily drop. The old asset is replaced only if the new one validates.
#
#   ./scripts/regenerate.sh 2026-10-30/scenes/reading-room "Use a process-machine concept"
#
# Env: MAX_TURNS (default 150), CLAUDE_MODEL (default claude-opus-5-5).
set -euo pipefail
cd "$(dirname "$0")/.."

ID=${1:?usage: regenerate.sh <date>/<kind>/<slug> [note]}
NOTE=${2:-}
DATE=${ID%%/*}
REST=${ID#*/}
KIND=${REST%%/*}
OLD="drops/$ID"
[ -d "$OLD" ] || { echo "✗ $OLD not found"; exit 1; }

mkdir -p .daily
backup=".daily/backup-$(echo "$ID" | tr / -)"
rm -rf "$backup" && cp -R "$OLD" "$backup"

cat > .daily/regen-prompt.md <<EOF
Regenerate one asset of the kit in \`drops/$DATE/\`: replace \`$OLD/\` with a better one.

1. Load the skills **asset-craft**, **remotion-best-practices** and **remotion-markup**. Read \`CLAUDE.md\`, \`drops/$DATE/brief.md\`, \`drops/$DATE/drop.json\` and the current \`$OLD/index.tsx\` (that's what's being replaced, and why it fell short).
2. Note from the reviewer: ${NOTE:-make it substantially better.}
3. Write the new asset in \`drops/$DATE/$KIND/<new-slug>/index.tsx\` (a new slug is fine if the concept changes; keep the same kind). Keep the kit's palette and type direction.
4. Do the full asset-craft review loop: \`pnpm stills <id>\`, open the sheet, critique, fix. At least two passes.
5. If you used a new slug, delete the old folder's file by overwriting \`$OLD/index.tsx\` with the single line \`// removed\`. The script cleans it up.
6. Update the matching line in \`drops/$DATE/brief.md\`. Run \`pnpm validate --drop $DATE\` until it prints ✓.
Finish with a short summary of the new concept and what each review pass fixed.
EOF

echo "→ claude -p regenerating $ID …"
claude -p "$(cat .daily/regen-prompt.md)" \
  --model "${CLAUDE_MODEL:-claude-opus-5-5}" \
  --allowedTools "Read,Glob,Grep,Skill,Edit(drops/$DATE/**),Bash(pnpm validate:*),Bash(pnpm stills:*),WebFetch(domain:www.remotion.dev)" \
  --max-turns "${MAX_TURNS:-150}" \
  --output-format text | tee .daily/regen.log

# The old folder was marked for removal if the asset moved to a new slug.
if grep -qx '// removed' "$OLD/index.tsx" 2>/dev/null; then rm -rf "$OLD" "public/previews/$ID"; fi

if pnpm validate --drop "$DATE"; then
  echo "✓ regenerated $ID (backup in $backup)"
else
  echo "✗ validation failed — restoring the previous asset"
  rm -rf "$OLD" && cp -R "$backup" "$OLD"
  exit 1
fi
