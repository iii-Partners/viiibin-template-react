# shellcheck shell=bash
# .loop/lib/check.sh: tiny pass/fail framework for validate.sh (sourced, not executed)
LOOP_DIR=".loop"
mkdir -p "$LOOP_DIR/artifacts/checks" "$LOOP_DIR/artifacts/screenshots" "$LOOP_DIR/state"
__CHECK_JSON=""
__PASS=0
__FAIL=0
__FAILED_IDS=""
__START=$(date +%s)

fast() { [ "${VALIDATE_FAST:-0}" = "1" ]; }

# A heavy check — a full health sweep, or a kpi refresh that calls all seven pillars and takes ~50s — has
# repeatedly killed `wrangler dev` mid-run, silently, with nothing in its own log. Every later check then failed
# with ECONNREFUSED: one infrastructure death became ten false reds, twice in one day. That is worse than a
# missing check, because it teaches you to discount the harness.
#
# So re-assert the server before each check that needs it. This does NOT weaken anything: a check whose
# assertion genuinely fails still fails, and a server that cannot be restarted still fails every check. It only
# stops one crash cascading into a wall of reds that hides whatever the real result was.
ensure_dev() {
  [ "${NEEDS_DEV:-0}" = "1" ] || return 0
  if [ -s "$LOOP_DIR/state/dev.port" ] && node -e 'fetch("http://127.0.0.1:"+process.argv[1]+"/api/admin/operator/health",{signal:AbortSignal.timeout(5000)}).then(function(r){process.exit(r.ok?0:1)}).catch(function(){process.exit(1)})' "$(cat "$LOOP_DIR/state/dev.port")" 2>/dev/null; then return 0; fi
  printf '      · dev server not answering — restarting before this check\n'
  bash "$LOOP_DIR/harness/lib/devserver.sh" start >/dev/null 2>&1 || true
}

# check <id> <milestone> "<shell command>"
check() {
  local id="$1" ms="$2" cmd="$3"
  ensure_dev
  local log="$LOOP_DIR/artifacts/checks/$id.log"
  local t0; t0=$(date +%s)
  if bash -c "$cmd" >"$log" 2>&1; then
    local st="pass"; __PASS=$((__PASS + 1))
    printf 'PASS  %-28s %s\n' "$id" "$ms"
  else
    local st="fail"; __FAIL=$((__FAIL + 1)); __FAILED_IDS="$__FAILED_IDS $id"
    printf 'FAIL  %-28s %s   (log: %s)\n' "$id" "$ms" "$log"
    tail -n 20 "$log" | sed 's/^/      | /'
  fi
  local dt=$(( $(date +%s) - t0 ))
  __CHECK_JSON="$__CHECK_JSON{\"id\":\"$id\",\"milestone\":\"$ms\",\"status\":\"$st\",\"seconds\":$dt},"
}

finish() {
  local total=$((__PASS + __FAIL)) ok=true
  [ "$__FAIL" -gt 0 ] && ok=false
  printf '{"pass":%s,"passed":%d,"failed":%d,"fast":%s,"seconds":%d,"at":"%s","checks":[%s]}\n' \
    "$ok" "$__PASS" "$__FAIL" "$( fast && echo true || echo false )" \
    "$(( $(date +%s) - __START ))" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${__CHECK_JSON%,}" \
    > "$LOOP_DIR/state/last-validate.json"
  # iii-eye#1012 (local-fleet #161, ported): the verdict is the ledger's. Every check above ran and printed its own
  # PASS/FAIL; known-reds.mjs decides which FAILs are news (NEW RED, non-zero) and which are ledgered standing findings
  # (KNOWN RED, counted in the summary). .loop/known-reds.json is committed; .loop/BLOCKED is not a ledger.
  echo
  if ! command -v node >/dev/null 2>&1; then
    echo "----"; echo "HARNESS RED: node is not on PATH, so .loop/known-reds.json cannot be judged — $__FAIL/$total failed:$__FAILED_IDS"; exit 1
  fi
  node "$LOOP_DIR/lib/known-reds.mjs"
  exit $?
}
