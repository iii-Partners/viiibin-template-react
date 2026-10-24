#!/usr/bin/env bash
# viiibin-template-react harness (hand-bootstrapped): wraps the repo's own lint/typecheck/build/test.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
fail=0
has(){ node -e 'process.exit((require("./package.json").scripts||{})[process.argv[1]]?0:1)' "$1" 2>/dev/null; }
run(){ local n="$1"; shift; printf '%-22s ' "$n"; if "$@"; then echo PASS; else echo FAIL; fail=1; fi; }
[ -d node_modules ] || npm ci >/dev/null 2>&1 || npm install >/dev/null 2>&1 || true
has lint && run lint npm run -s lint
has typecheck && run typecheck npm run -s typecheck
has build && run build npm run -s build
has test && run test env CI=1 npm test
exit $fail
