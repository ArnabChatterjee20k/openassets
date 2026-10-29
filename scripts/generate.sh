#!/usr/bin/env bash
# Daily pipeline: pick theme → claude -p writes the drop → validate → render.
# Used by .github/workflows/daily.yml and by `scripts/test-local.sh --generate`.
#
# Env: DATE, THEME, ICONS, ICONS3D, BANNERS, VIDEOS (see scripts/prepare-drop.ts),
#      MAX_TURNS (default 300), SKIP_RENDER=1, RENDER_FLAGS (e.g. --no-video),
#      CLAUDE_MODEL (default claude-opus-5-5).
set -euo pipefail
cd "$(dirname "$0")/.."

pnpm -s tsx scripts/prepare-drop.ts
DATE=$(cat .daily/date)

before=$(git status --porcelain --untracked-files=all | sort)

echo "→ claude -p generating drops/$DATE …"
# Edit(...) rules cover every file-writing tool. Claude may render stills and read
# the contact sheets (review/ is gitignored), use skills and read Remotion docs.
claude -p "$(cat .daily/prompt.md)" \
  --model "${CLAUDE_MODEL:-claude-opus-5-5}" \
  --allowedTools "Read,Glob,Grep,Skill,Edit(drops/$DATE/**),Bash(pnpm validate:*),Bash(pnpm stills:*),WebFetch(domain:www.remotion.dev)" \
  --max-turns "${MAX_TURNS:-300}" \
  --output-format text | tee .daily/claude.log

# Guard: Claude may only touch drops/$DATE.
after=$(git status --porcelain --untracked-files=all | sort)
outside=$(comm -13 <(echo "$before") <(echo "$after") | awk '{print $2}' | grep -v "^drops/$DATE/" || true)
if [ -n "$outside" ]; then
  echo "✗ Claude changed files outside drops/$DATE:"
  echo "$outside"
  exit 1
fi
[ -f "drops/$DATE/drop.json" ] || { echo "✗ drops/$DATE/drop.json was not created"; exit 1; }

echo "→ independent validation"
pnpm validate --drop "$DATE"

if [ "${SKIP_RENDER:-}" != 1 ]; then
  echo "→ rendering"
  pnpm render --drop "$DATE" ${RENDER_FLAGS:-}
fi
echo "✓ drop $DATE ready"
