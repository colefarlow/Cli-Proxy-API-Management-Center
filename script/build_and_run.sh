#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
TASK_ROOT="$PWD"
if [[ ! -f dist/index.html ]]; then
  echo 'First build the frontend on LinuxBox3; see docs/atelier/README.md.' >&2
  exit 1
fi
mkdir -p .build/AppIcon.iconset
xcrun swift script/make_icon.swift .build/AppIcon.iconset
iconutil -c icns .build/AppIcon.iconset -o native/ProxyAtelier/AppIcon.icns
xcodegen generate --spec native/project.yml --project native >/dev/null
"$HOME/.local/bin/siteos-build-lock" --max-wait 25 -- xcodebuild \
  -project native/ProxyAtelier.xcodeproj -scheme ProxyAtelier -configuration Release \
  -destination 'platform=macOS' -derivedDataPath "$TASK_ROOT/.build/DerivedData" \
  "CONFIGURATION_BUILD_DIR=$TASK_ROOT/.build/AppProducts" \
  CODE_SIGN_IDENTITY=- build > .build/xcodebuild.log 2>&1 || { tail -65 .build/xcodebuild.log; exit 1; }
TASK_APP="$TASK_ROOT/.build/AppProducts/Proxy Atelier.app"
test -f "$TASK_APP/Contents/Resources/index.html"
test -f "$TASK_APP/Contents/Resources/remote_request.py"
codesign --verify --deep --strict "$TASK_APP"
# Stop only this app when rebuilding. The proxy and its Safari fallback are independent.
if pgrep -x 'Proxy Atelier' >/dev/null; then
  pkill -x 'Proxy Atelier'
  for iteration in {1..30}; do
    if ! pgrep -x 'Proxy Atelier' >/dev/null; then break; fi
    sleep 0.1
  done
fi
if [[ "${1:-}" == '--install' ]]; then
  TASK_INSTALL="$HOME/Applications/Proxy Atelier.app"
  if [[ -e "$TASK_INSTALL" ]]; then
    /usr/bin/ditto "$TASK_INSTALL" "$TASK_ROOT/.build/Previous Proxy Atelier.app"
  fi
  /usr/bin/ditto "$TASK_APP" "$TASK_INSTALL"
  TASK_APP="$TASK_INSTALL"
fi
/usr/bin/open -n "$TASK_APP"
if [[ "${1:-}" == '--verify' || "${1:-}" == '--install' ]]; then
  for iteration in {1..20}; do
    if pgrep -x 'Proxy Atelier' >/dev/null; then echo "Built, signed, and launched: $TASK_APP"; exit 0; fi
    sleep 0.25
  done
  echo 'App launch was not observed.' >&2; exit 1
fi
