#!/usr/bin/env bash
# Usage: scripts/capture.sh <out-dir>   (requires app on :3000 and API on :3001)
set -e
OUT=${1:-prints/antes}; mkdir -p "$OUT"
BASE=http://localhost:3000
PAGES="dashboard:/ crm:/crm projects:/projects inventory:/inventory assets:/assets teams:/teams contractors:/contractors sst:/sst agenda:/agenda integrations:/integrations reports:/reports profile:/profile"
TOKEN=$(curl -s -X POST localhost:3001/api/auth/login -H 'content-type: application/json' -d '{"email":"admin@sgiman.pt","password":"123456"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
S=cap
playwright-cli -s=$S close >/dev/null 2>&1 || true
playwright-cli -s=$S open about:blank >/dev/null
# Optional: CDN_SHIM=<file.js> serves blocked CDNs locally (sandbox only)
if [ -n "$CDN_SHIM" ]; then playwright-cli -s=$S run-code --filename="$CDN_SHIM" >/dev/null; fi
playwright-cli -s=$S goto "$BASE" >/dev/null
for VP in "desktop:1440:900" "mobile:390:844"; do
  IFS=: read NAME W H <<<"$VP"
  playwright-cli -s=$S resize $W $H >/dev/null
  playwright-cli -s=$S localstorage-clear >/dev/null
  playwright-cli -s=$S goto "$BASE/" >/dev/null; sleep 1.5
  playwright-cli -s=$S screenshot --filename="$OUT/login-$NAME.png" --full-page >/dev/null
  playwright-cli -s=$S localstorage-set sgi_token "$TOKEN" >/dev/null
  for P in $PAGES; do
    KEY=${P%%:*}; ROUTE=${P#*:}
    playwright-cli -s=$S goto "$BASE/#$ROUTE" >/dev/null
    playwright-cli -s=$S reload >/dev/null; sleep 2
    playwright-cli -s=$S screenshot --filename="$OUT/$KEY-$NAME.png" >/dev/null
    echo "✓ $OUT/$KEY-$NAME.png"
  done
done
playwright-cli -s=$S close >/dev/null
