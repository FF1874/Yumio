#!/usr/bin/env bash
set -euo pipefail
if (( EUID != 0 )); then exec sudo bash "$0" "$@"; fi
base=/opt/yumio/release-938e596
tmp=$(mktemp -d /tmp/yumio-install-XXXXXXXX)
cd "$tmp"
curl -fsSL --retry 2 --max-time 75 https://codeload.github.com/FF1874/Yumio/tar.gz/938e5963eff981b15f7ffd60bac75ae204891cf6 -o repo.tar.gz
tar -xzf repo.tar.gz --strip-components=1 --exclude='*/assets/recipes/README.md' --wildcards '*/index.html' '*/assets'
echo 'aa8805fdf7ad7f5e0117e4d9fca962f253ce2f2d4b2d2d7177600e7e3486efc4  index.html' | sha256sum -c -
python3 - <<'PY'
import hashlib
from pathlib import Path
files=sorted(p for p in Path('assets').rglob('*') if p.is_file())
manifest=''.join(p.as_posix()+' '+hashlib.sha256(p.read_bytes()).hexdigest()+chr(10) for p in files)
assert hashlib.sha256(manifest.encode()).hexdigest()=='46025c6064a301ac49234d1eacab73dcb733453a413b6e0a78129c03dff18191'
p=Path('index.html');s=p.read_text();assert s.count("fetch('/api/generation/'")==1
p.write_text(s.replace("fetch('/api/generation/'","fetch('api/generation/'"))
PY
mkdir -p "$base/public"
cp -r index.html assets "$base/public/"
web=side-b-web-1
docker inspect "$web" --format '{{.State.Running}}' | grep -qx true
docker exec "$web" mkdir -p /data/yumio-releases/938e596
tar -C "$base/public" -cf - index.html assets | docker exec -i "$web" tar -xf - -C /data/yumio-releases/938e596
docker exec "$web" grep -q '<title>Yumio' /data/yumio-releases/938e596/index.html
cfg=/opt/side-b/deployment/Caddyfile
cp "$cfg" original
cat > yumio-route <<'ROUTE'
  redir /yumio /yumio/ 308
  handle_path /yumio/* {
    @generation path /api/generation/create /api/generation/status /api/generation/model
    handle @generation {
      @caller {
        method POST
        header Origin https://43.110.27.83
        header Content-Type application/json*
      }
      handle @caller {
        request_body {
          max_size 2600000
        }
        reverse_proxy https://ankuan-studio-visual.qbj26qz7cw.chatgpt.site {
          header_up Host ankuan-studio-visual.qbj26qz7cw.chatgpt.site
          header_up Origin https://ankuan-studio-visual.qbj26qz7cw.chatgpt.site
          header_up -Cookie
          header_up -Authorization
          header_up -Referer
          header_down -Set-Cookie
        }
      }
      respond 403
    }
    handle {
      root * /data/yumio-releases/938e596
      header X-Content-Type-Options nosniff
      file_server
    }
  }
ROUTE
python3 - <<'PYTHON'
from pathlib import Path
s=Path('original').read_text()
import re
marker=re.compile(r'(?m)^([ \t]*)reverse_proxy\s+app:4173\s*\{')
assert len(marker.findall(s))==1, 'Existing application route was not found'
r=Path('yumio-route').read_text()
if r not in s:
    assert '/yumio' not in s, 'An unrelated existing Yumio route needs review'
    s=marker.sub(lambda m:r+m.group(0),s,count=1)
Path('candidate').write_text(s)
PYTHON
docker exec -i "$web" sh -c 'cat > /tmp/YumioCaddyfile' < candidate
docker exec "$web" caddy validate --config /tmp/YumioCaddyfile --adapter caddyfile
check_url(){ curl --noproxy '*' --resolve 43.110.27.83:443:127.0.0.1 -fsS --max-time 12 --retry 4 --retry-delay 1 --retry-all-errors "$@"; }
check_url https://43.110.27.83/ -o before
if ! cmp -s candidate original; then
  backup=/opt/yumio/Caddyfile.pre-yumio-$(date -u +%Y%m%dT%H%M%SZ)
  cp -p "$cfg" "$backup"
  rollback(){ cp "$backup" "$cfg"; docker restart "$web" >/dev/null; }
  trap rollback ERR
  cat candidate > "$cfg"
  docker restart "$web" >/dev/null
fi
check_url https://43.110.27.83/yumio/ -o yumio.html
cmp yumio.html "$base/public/index.html"
check_url https://43.110.27.83/ -o after
cmp before after
trap - ERR
# Remove only the obsolete test container if its app directory matches this release.
if test "$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/srv"}}{{.Source}}{{end}}{{end}}' yumio-web 2>/dev/null || true)" = "$base/public"; then
  docker rm -f yumio-web >/dev/null
fi
echo YUMIO_PUBLIC_READY
