#!/usr/bin/env bash
#
# Server half of .github/workflows/deploy.yml. It is never copied to the
# server: the workflow streams it in over ssh (`ssh prod bash -s -- ... <
# this file`), so the box always runs the version from the commit being
# deployed.
#
#   deploy   <app_dir> <sha>   build what the workflow staged, then switch it live
#   rollback <app_dir>         put back what the last deploy replaced
#
# Before `deploy` runs, the workflow has rsynced the commit's FE/, API/ and
# demo-store/ into <app_dir>/.deploy/<name>/, and .gitignore into
# <app_dir>/.deploy/root/. The Vite FE builds there beside the live one, and
# each Node app's npm deps are installed with the live Node; nothing live is
# touched unless all of that passes. A Vite `dist/` folder can be moved after
# `npm run build`, so the FE switch is a rename, not a rebuild in place.
#
# Files in the live folders that exist only on this box and must survive
# every deploy:
#   - .env, .env.production ...: gitignored, so each FE build copies them in
#     from the live app rather than expecting them in the upload;
#   - API/: uploads/ (KYC documents) and gitignored credential files that can
#     sit anywhere in the tree. Node apps delete only files an earlier deploy
#     put there (see switch_node_app).
#
# Everything is in functions and main runs on the last line: bash reads this
# script from stdin, and a command that reads stdin (npm, pm2) would
# otherwise swallow the rest of it.

set -Eeuo pipefail

# Vite apps: npm ci + npm run build, then swap dist/ and node_modules/.
APPS=(FE)
# Plain Node apps: npm ci, syntax-check, then manifest-based code switch.
NODE_APPS=(API demo-store)
ROOT_FILES=(.gitignore)
# Moved into place whole, so each one changes in a single rename.
SWAPPED=(dist node_modules)

log() { printf '==> %s\n' "$*"; }
die() { printf '::error::%s\n' "$*"; exit 1; }

# Replaces a file in one rename, so nginx never serves half of one.
install_file() { cp -p "$1" "$2.deploy-tmp" && mv -f "$2.deploy-tmp" "$2"; }

# The pm2 processes running from one folder, found by working directory so
# nothing here depends on what they were named when the box was set up. pm2
# can print banner lines ("[PM2] Spawning PM2 daemon ...") before its JSON,
# so the list is the last line that parses as an array.
pm2_names_for() {
  pm2 jlist 2>/dev/null | node -e '
    const fs = require("fs");
    const real = (p) => { try { return fs.realpathSync(p); } catch { return p; } };
    let list = [];
    for (const line of fs.readFileSync(0, "utf8").split("\n").reverse()) {
      try { const v = JSON.parse(line); if (Array.isArray(v)) { list = v; break; } } catch {}
    }
    const want = real(process.argv[1]);
    for (const p of list)
      if (real((p.pm2_env || {}).pm_cwd || "") === want) console.log(p.name);
  ' "$1"
}

# Default pm2 process name for a folder when none is already registered.
default_pm2_name() {
  case "$1" in
    FE) echo paygate-fe ;;
    API) echo paygate-api ;;
    demo-store) echo demo-store ;;
    *) return 1 ;;
  esac
}

# Fills PM2 with every process to reload: FE, API and demo-store. A folder
# with no process gets the name this box uses, and apply_pm2 starts it.
# PM2_NAMES (a repository variable, space-separated) overrides the lookup.
resolve_pm2_names() {
  PM2=()
  if [ -n "${PM2_NAMES:-}" ]; then
    read -ra PM2 <<<"$PM2_NAMES"
    return
  fi
  local dir found
  for dir in "${APPS[@]}" "${NODE_APPS[@]}"; do
    found=$(pm2_names_for "$APP_DIR/$dir")
    if [ -n "$found" ]; then
      # One name per line; split on purpose.
      # shellcheck disable=SC2206
      PM2+=($found)
    else
      PM2+=("$(default_pm2_name "$dir")")
    fi
  done
}

# online / launching / stopped / errored, or empty when pm2 has no such process.
pm2_status() {
  pm2 jlist 2>/dev/null | node -e '
    const fs = require("fs");
    let list = [];
    for (const line of fs.readFileSync(0, "utf8").split("\n").reverse()) {
      try { const v = JSON.parse(line); if (Array.isArray(v)) { list = v; break; } } catch {}
    }
    const name = process.argv[1];
    for (const p of list)
      if (p.name === name) { console.log((p.pm2_env || {}).status || ""); break; }
  ' "$1"
}

# A name that is not already in pm2. The three app names are the ones this
# script knows how to create; anything else has to be started on the server
# once, and later deploys only reload it.
start_pm2() {
  local name="$1"
  case "$name" in
    paygate-fe)
      pm2 start npm --name "$name" --cwd "$APP_DIR/FE" -- run preview -- --host 0.0.0.0 --port 4173
      ;;
    paygate-api)
      pm2 start npm --name "$name" --cwd "$APP_DIR/API" -- start
      ;;
    demo-store)
      pm2 start npm --name "$name" --cwd "$APP_DIR/demo-store" -- start
      ;;
    *)
      die "pm2 process '$name' is not running, and this deploy does not know how to start it. Start it once on the server; later deploys will reload it."
      ;;
  esac
}

# Online processes are reloaded. A stopped or deleted one is started, and a
# deleted one is created from the commands above. pm2 save runs only when
# something was started, so a reboot keeps it.
apply_pm2() {
  local name status started=0
  for name in "${PM2[@]}"; do
    if ! pm2 describe "$name" >/dev/null 2>&1; then
      log "Starting pm2: $name"
      start_pm2 "$name"
      started=1
      continue
    fi
    status=$(pm2_status "$name")
    if [ "$status" = "online" ] || [ "$status" = "launching" ]; then
      log "Reloading pm2: $name"
      pm2 reload "$name"
    else
      log "pm2 $name is ${status:-stopped}, starting it again"
      pm2 start "$name"
      started=1
    fi
  done
  [ "$started" -eq 0 ] || pm2 save
}

# True when the last switch left something to go back to.
have_previous() {
  local app d
  for app in "${NODE_APPS[@]}"; do
    if [ -d "$PREV/$app" ]; then return 0; fi
  done
  for app in "${APPS[@]}"; do
    for d in "${SWAPPED[@]}"; do
      if [ -e "$PREV/$app/$d" ]; then return 0; fi
    done
  done
  return 1
}

switch_app() {
  local app="$1" stage="$DEPLOY/$1" live="$APP_DIR/$1" d
  # Code and config. --delete only inside src/, which holds nothing but code;
  # everywhere else files are added and updated, never removed. --checksum
  # compares contents rather than size and mtime; the staged tree is small.
  if [ -d "$stage/src" ]; then
    rsync -a --checksum --delete "$stage/src/" "$live/src/"
  fi
  rsync -a --checksum --exclude=/src/ --exclude=/node_modules/ --exclude=/dist/ \
    --include=/.env.example --exclude=/.env --exclude='/.env.*' \
    "$stage/" "$live/"
  mkdir -p "$PREV/$app"
  for d in "${SWAPPED[@]}"; do
    if [ -e "$live/$d" ]; then mv "$live/$d" "$PREV/$app/$d"; fi
    mv "$stage/$d" "$live/$d"
  done
}

# A Node app has no build: its code is what runs, so the switch copies it
# over. Gitignored files can sit anywhere in its tree, so nothing is deleted
# by folder. Each deploy records the files it uploaded
# (.deploy/manifests/<app>) and removes only those the previous deploy
# recorded and this one dropped. Every live file it overwrites or removes is
# copied to $PREV/<app> first, with a list of the files it adds, so
# restore_node_app can undo it exactly. node_modules/ is the server's own
# and is never taken from the staged tree.
switch_node_app() {
  local app="$1"
  local stage="$DEPLOY/$app" live="$APP_DIR/$app" prev="$PREV/$app"
  local manifest="$DEPLOY/manifests/$app" new="$DEPLOY/manifests/$app.new" old f
  mkdir -p "$DEPLOY/manifests" "$prev/files"
  (cd "$stage" && find . -type f ! -path './node_modules/*' | sed 's|^\./||' | LC_ALL=C sort) > "$new"
  old=/dev/null
  if [ -f "$manifest" ]; then
    old="$manifest"
    cp -p "$manifest" "$prev/manifest"
  fi

  LC_ALL=C sort -u "$old" "$new" > "$prev/touched"
  while IFS= read -r f; do
    if [ -e "$live/$f" ]; then
      mkdir -p "$prev/files/$(dirname "$f")"
      cp -p "$live/$f" "$prev/files/$f"
    fi
  done < "$prev/touched"
  while IFS= read -r f; do
    if [ ! -e "$live/$f" ]; then printf '%s\n' "$f"; fi
  done < "$new" > "$prev/added"

  rsync -a --checksum --exclude=/node_modules/ "$stage/" "$live/"
  LC_ALL=C comm -23 "$old" "$new" > "$prev/dropped"
  while IFS= read -r f; do
    rm -f "$live/$f"
  done < "$prev/dropped"
  mv -f "$new" "$manifest"

  if [ "$app" = API ]; then
    # KYC uploads are written here and nothing else guarantees the API
    # process can write into the folder.
    mkdir -p "$live/uploads/kyc"
    chmod -R u+rwX "$live/uploads"
  fi
}

restore_node_app() {
  local app="$1"
  local prev="$PREV/$app" live="$APP_DIR/$app" f
  if [ ! -d "$prev" ]; then return 0; fi
  if [ -d "$prev/files" ]; then rsync -a --checksum "$prev/files/" "$live/"; fi
  if [ -f "$prev/added" ]; then
    while IFS= read -r f; do rm -f "$live/$f"; done < "$prev/added"
  fi
  rm -f "$DEPLOY/manifests/$app.new"
  if [ -f "$prev/manifest" ]; then
    mv -f "$prev/manifest" "$DEPLOY/manifests/$app"
  else
    rm -f "$DEPLOY/manifests/$app"
  fi
  rm -rf "$prev"
}

# Prepare a Node app for switch: copy live env into the stage, parse-check
# every JS file, npm ci, and sync node_modules into the live folder (not
# rolled back — same role as a Python venv).
prepare_node_app() {
  local app="$1"
  local stage="$DEPLOY/$app" live="$APP_DIR/$app"

  log "Checking $app with $(node --version 2>&1)"
  find "$stage" -type f -name '*.js' ! -path '*/node_modules/*' -print0 \
    | xargs -0 -n1 node --check

  log "Installing $app dependencies"
  find "$stage" -maxdepth 1 -type f -name '.env*' ! -name .env.example -delete
  find "$live" -maxdepth 1 -type f -name '.env*' ! -name .env.example -exec cp -p {} "$stage/" \;
  (cd "$stage" && npm ci --omit=dev --no-audit --no-fund)
  mkdir -p "$live"
  rsync -a --checksum --delete "$stage/node_modules/" "$live/node_modules/"
}

# Puts back what the last switch moved into $PREV: the FE's dist and
# node_modules, each Node app's code, and the root files. Not rolled back:
# FE source files (only their builds run), and packages npm installed into
# each Node app's node_modules. Used by a failed switch and by `rollback`.
restore() {
  local app d f
  for app in "${APPS[@]}"; do
    for d in "${SWAPPED[@]}"; do
      if [ ! -e "$PREV/$app/$d" ]; then continue; fi
      rm -rf "$DEPLOY/discard" && mkdir -p "$DEPLOY/discard"
      if [ -e "$APP_DIR/$app/$d" ]; then mv "$APP_DIR/$app/$d" "$DEPLOY/discard/"; fi
      mv "$PREV/$app/$d" "$APP_DIR/$app/$d"
      rm -rf "$DEPLOY/discard"
    done
  done
  for app in "${NODE_APPS[@]}"; do
    restore_node_app "$app"
  done
  for f in "${ROOT_FILES[@]}"; do
    if [ -f "$PREV/root/$f" ]; then mv -f "$PREV/root/$f" "$APP_DIR/$f"; fi
  done
  apply_pm2
}

on_switch_error() {
  trap - ERR
  set +e
  log "Switch failed part-way, putting the previous version back"
  restore
  exit 1
}

deploy() {
  local sha="$1" app stage live envs f

  for app in "${APPS[@]}" "${NODE_APPS[@]}"; do
    [ -d "$DEPLOY/$app" ] || die "Nothing staged for $app in $DEPLOY/$app"
    if [ ! -d "$APP_DIR/$app" ]; then
      log "Creating $APP_DIR/$app"
      mkdir -p "$APP_DIR/$app"
    fi
  done
  for app in "${APPS[@]}" "${NODE_APPS[@]}"; do
    [ -f "$DEPLOY/$app/package.json" ] || die "$DEPLOY/$app has no package.json"
  done
  for f in "${ROOT_FILES[@]}"; do
    [ -f "$DEPLOY/root/$f" ] || die "$f was not staged"
  done
  # Before building anything: a missing process this script cannot start
  # would leave a finished build with nothing to serve it.
  resolve_pm2_names
  log "Will reload or start pm2: ${PM2[*]}"
  local name
  for name in "${PM2[@]}"; do
    pm2 describe "$name" >/dev/null 2>&1 && continue
    case "$name" in
      paygate-fe|paygate-api|demo-store) ;;
      *) die "pm2 process '$name' is not running, and this deploy does not know how to start it. Start it once on the server; later deploys will reload it." ;;
    esac
  done

  for app in "${APPS[@]}"; do
    stage="$DEPLOY/$app"
    live="$APP_DIR/$app"
    find "$stage" -maxdepth 1 -type f -name '.env*' ! -name .env.example -delete
    find "$live" -maxdepth 1 -type f -name '.env*' ! -name .env.example -exec cp -p {} "$stage/" \;
    envs=$(cd "$stage" && find . -maxdepth 1 -type f -name '.env*' ! -name .env.example | sed 's|^\./||' | tr '\n' ' ')
    if [ -z "$envs" ]; then log "warning: $live has no .env file, building $app without one"; fi
    log "Building $app (env: ${envs:-none})"
    (cd "$stage" && npm ci --no-audit --no-fund && npm run build)
    [ -d "$stage/dist" ] || die "$app build produced no dist/"
  done

  for app in "${NODE_APPS[@]}"; do
    prepare_node_app "$app"
  done

  log "Switching to $sha"
  rm -rf "$PREV"
  mkdir -p "$PREV/root"
  trap on_switch_error ERR
  for app in "${APPS[@]}"; do
    switch_app "$app"
  done
  for app in "${NODE_APPS[@]}"; do
    switch_node_app "$app"
  done
  for f in "${ROOT_FILES[@]}"; do
    if [ -f "$APP_DIR/$f" ]; then cp -p "$APP_DIR/$f" "$PREV/root/$f"; fi
    install_file "$DEPLOY/root/$f" "$APP_DIR/$f"
  done
  apply_pm2
  trap - ERR

  printf '%s deployed %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$sha" >> "$DEPLOY/history.log"
  log "Live: $sha"
}

rollback() {
  have_previous || die "Nothing to roll back to in $PREV"
  resolve_pm2_names
  log "Rolling back FE, API and demo-store to the previous version"
  restore
  printf '%s rolled back\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$DEPLOY/history.log"
}

main() {
  local mode="${1:-}" c
  APP_DIR="${2:-}"
  if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
    die "usage: deploy-remote.sh deploy|rollback <app_dir> [sha] (got app_dir '$APP_DIR')"
  fi
  DEPLOY="$APP_DIR/.deploy"
  PREV="$DEPLOY/previous"

  # Node may come from nvm, which a non-interactive ssh shell does not load.
  if ! command -v npm >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
    set +u
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
    set -u
  fi
  for c in node npm pm2 rsync; do
    command -v "$c" >/dev/null 2>&1 || die "$c is not on the server's PATH"
  done

  case "$mode" in
    deploy) deploy "${3:-unknown}" ;;
    rollback) rollback ;;
    *) die "Unknown mode '$mode' (deploy or rollback)" ;;
  esac
}

main "$@"
