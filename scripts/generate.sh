#!/usr/bin/env bash
# Daily pipeline: pick theme → claude -p writes the drop → validate → render.
# Each run starts a new kit with the next unused idea (drops/<day>, then
# drops/<day>-2, -3… for later runs that day). APPEND=1 adds assets to the
# day's latest kit instead.
# Used by .github/workflows/daily.yml and by `scripts/test-local.sh --generate`.
#
# Env: DATE, THEME, ICONS, ICONS3D, BANNERS, VIDEOS (see scripts/prepare-drop.ts),
#      MAX_TURNS (default 300), RENDER=1 to also batch-render full-res files locally
#      (the site renders everything on demand, so CI skips this), RENDER_FLAGS,
#      CLAUDE_MODEL (default claude-opus-5-5).
set -Eeuo pipefail
# Never fail silently: name the line and command that stopped the run.
trap 'echo "✗ generate.sh failed at line $LINENO: $BASH_COMMAND" >&2' ERR
cd "$(dirname "$0")/.."

pnpm -s tsx scripts/prepare-drop.ts
DATE=$(cat .daily/date)
MODE=$(cat .daily/mode)

# Fingerprint the kit's existing asset files: an append run may add assets but
# must not change or delete any (brief.md and drop.json may be updated).
fingerprint() {
  [ -d "drops/$DATE" ] || return 0
  find "drops/$DATE" -type f -name '*.ts*' -print0 | xargs -0 shasum 2>/dev/null | sort || true
}
existing=$(fingerprint)
# Count assets without find failing on a new date (pipefail would end the script).
count_assets() { if [ -d "drops/$DATE" ]; then find "drops/$DATE" -name index.tsx | wc -l | tr -d ' '; else echo 0; fi; }
assets_before=$(count_assets)

before=$(git status --porcelain --untracked-files=all | sort)

echo "→ claude -p generating drops/$DATE ($MODE) …"
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

# Assets Claude marked for removal (its index.tsx is just "// discard"). Claude
# can write files but not delete them, so scratch work is cleared here.
find "drops/$DATE" -name index.tsx -print0 | while IFS= read -r -d '' f; do
  if [ "$(tr -d '[:space:]' < "$f")" = "//discard" ]; then
    echo "→ discarding $(dirname "$f")"
    rm -rf "$(dirname "$f")"
  fi
done

if [ "$MODE" = append ]; then
  changed=$(comm -23 <(echo "$existing") <(fingerprint) | awk '{print $2}')
  if [ -n "$changed" ]; then
    echo "✗ append run changed or deleted existing assets:"
    echo "$changed"
    exit 1
  fi
  assets_after=$(count_assets)
  if [ "$assets_after" -le "$assets_before" ]; then
    echo "✗ append run added no assets"
    exit 1
  fi
  echo "→ appended $((assets_after - assets_before)) assets to drops/$DATE"
fi

# Record which idea this kit came from; prepare-drop skips used ideas by this field.
IDEA=$(cat .daily/idea 2>/dev/null || true)
if [ "$MODE" = new ] && [ -n "$IDEA" ] && [ -f "drops/$DATE/drop.json" ]; then
  IDEA="$IDEA" node -e '
    const f = process.argv[1], d = require("./" + f);
    d.idea = process.env.IDEA;
    require("fs").writeFileSync(f, JSON.stringify(d, null, 2) + "\n");
  ' "drops/$DATE/drop.json"
fi

echo "→ independent validation"
pnpm validate --drop "$DATE"

if [ "${RENDER:-}" = 1 ]; then
  echo "→ rendering"
  pnpm render --drop "$DATE" ${RENDER_FLAGS:-}
fi
echo "✓ drop $DATE ready"
