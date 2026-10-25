#!/usr/bin/env bash
# Epic #14: preserve the original gates and add observable per-check evidence.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
source .loop/lib/check.sh
check base-lint M3 "npm run -s lint"
check base-typecheck M3 "npm run -s typecheck && npm run -s typecheck:functions"
check base-tests M3 "env CI=1 npm test"
check os-kpi-contract M2 "npx --no-install vitest run functions/__tests__/kpis.test.ts"
if ! fast; then
  check base-build M3 "npm run -s build"
  check os-kpi-api M2 "node .loop/harness/kpi-api.mjs"
  check os-issue-contracts M1 "node .loop/harness/issues.mjs --live"
  check os-drawing M1 "node .loop/harness/drawing.mjs"
fi
finish
