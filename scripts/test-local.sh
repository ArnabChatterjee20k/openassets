#!/usr/bin/env bash
# Local test harness.
#
#   ./scripts/test-local.sh              quick: validate everything, check the validator
#                                        rejects bad code, render latest drop (no video), build site
#   ./scripts/test-local.sh --full       also render videos
#   ./scripts/test-local.sh --generate   also run the real generator (claude -p) for a small
#                                        test drop (DATE defaults to today; THEME optional)
#   ./scripts/test-local.sh --serve      finish by serving the built site at http://localhost:4173
#
# Flags combine, e.g. `--generate --serve`.
set -euo pipefail
cd "$(dirname "$0")/.."

FULL=0 GENERATE=0 SERVE=0
for arg in "$@"; do
  case $arg in
    --full) FULL=1 ;;
    --generate) GENERATE=1 ;;
    --serve) SERVE=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "unknown flag $arg"; exit 2 ;;
  esac
done

step() { printf '\n\033[1;34m== %s\033[0m\n' "$*"; }
ok() { printf '\033[32m✓ %s\033[0m\n' "$*"; }

step "Environment"
node -v && pnpm -v
[ -d node_modules ] || pnpm install
pnpm exec playwright install chromium >/dev/null
ok "dependencies ready"

step "Validate all drops"
pnpm validate

step "Validator rejects unsafe/broken assets"
BAD=drops/1999-01-01
trap 'rm -rf "$BAD"' EXIT
mkdir -p "$BAD/icons/bad"
echo '{"date":"1999-01-01","theme":"Bad","description":"Deliberately broken drop.","palette":["#000000","#ffffff","#ff0000"]}' > "$BAD/drop.json"
cat > "$BAD/icons/bad/index.tsx" <<'TSX'
import { z } from 'zod';
export const meta = { kind: 'icon' as const, name: 'Bad' };
export const schema = z.object({ c: z.string() });
export const variants = {};
export function leak() { return fetch('https://example.com'); } // never called
export default function Bad() { return <svg viewBox="0 0 24 24" />; }
TSX
if out=$(pnpm -s validate --drop 1999-01-01 --no-browser 2>&1); then
  echo "$out"; echo "✗ validator accepted a bad asset"; exit 1
fi
for expect in 'fetch() is not allowed' 'external URLs' 'needs a .default()' 'at least 2 variants'; do
  grep -q "$expect" <<<"$out" || { echo "$out"; echo "✗ validator missed: $expect"; exit 1; }
done
rm -rf "$BAD"
ok "validator caught every planted problem"

if [ "$GENERATE" = 1 ]; then
  step "Generate a small test drop with claude -p"
  command -v claude >/dev/null || { echo "✗ claude CLI not found"; exit 1; }
  ICONS=${ICONS:-2} ICONS3D=${ICONS3D:-1} BANNERS=${BANNERS:-1} VIDEOS=${VIDEOS:-1} \
    RENDER_FLAGS=$([ "$FULL" = 1 ] || echo --no-video) ./scripts/generate.sh
  ok "generated drops/$(cat .daily/date) (uncommitted — review with git status / pnpm dev)"
else
  step "Render latest drop$([ "$FULL" = 1 ] || echo ' (no video; use --full for video)')"
  pnpm render $([ "$FULL" = 1 ] || echo --no-video)
fi

step "Build site"
pnpm -s build >/dev/null
ok "site built to dist/"

ok "all local checks passed"

if [ "$SERVE" = 1 ]; then
  step "Serving dist/ at http://localhost:4173 (Ctrl-C to stop)"
  pnpm preview --port 4173
fi
