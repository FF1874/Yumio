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
cat > "$base/Caddyfile" <<'CADDY'
{
  admin off
  auto_https off
}
:8080 {
  root * /srv
  header X-Content-Type-Options nosniff
  @api path /api/generation/create /api/generation/status /api/generation/model
  handle @api {
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
    file_server
  }
}
CADDY
img=$(docker inspect -f '{{.Image}}' side-b-web-1)
net=$(docker inspect -f '{{range $n, $v := .NetworkSettings.Networks}}{{$n}}{{end}}' side-b-web-1)
docker run --rm --network none -v "$base/Caddyfile:/etc/caddy/Caddyfile:ro" "$img" caddy validate --config /etc/caddy/Caddyfile
if ! docker inspect yumio-web >/dev/null 2>&1; then
 docker run -d --name yumio-web --restart unless-stopped --network "$net" --cap-drop ALL --security-opt no-new-privileges --memory 96m --log-opt max-size=2m --log-opt max-file=2 -v "$base/public:/srv:ro" -v "$base/Caddyfile:/etc/caddy/Caddyfile:ro" "$img"
fi
sleep 2
docker exec side-b-web-1 wget -qO /tmp/yumio-index-check.html http://yumio-web:8080/
docker exec side-b-web-1 grep -q '<title>Yumio' /tmp/yumio-index-check.html
cfg=/opt/side-b/deployment/Caddyfile
cp "$cfg" original
python3 - <<'PY'
from pathlib import Path
s=Path('original').read_text();marker='reverse_proxy app:4173 {';assert s.count(marker)==1 and '/yumio' not in s
s=s.replace(marker,'redir /yumio /yumio/ 308\n  handle_path /yumio/* {\n    reverse_proxy yumio-web:8080\n  }\n  '+marker)
Path('candidate').write_text(s)
PY
docker cp candidate side-b-web-1:/tmp/YumioCaddyfile
docker exec side-b-web-1 caddy validate --config /tmp/YumioCaddyfile --adapter caddyfile
backup=/opt/yumio/Caddyfile.pre-yumio-$(date -u +%Y%m%dT%H%M%SZ)
cp -p "$cfg" "$backup"
curl -fsS --max-time 10 https://43.110.27.83/ -o before
rollback(){ cp "$backup" "$cfg"; docker restart side-b-web-1 >/dev/null; }
trap rollback ERR
cp candidate "$cfg"
docker restart side-b-web-1 >/dev/null
curl -fsS --retry 7 --retry-delay 2 --retry-all-errors --max-time 12 https://43.110.27.83/yumio/ -o yumio.html
grep -q '<title>Yumio' yumio.html
curl -fsS --max-time 12 https://43.110.27.83/ -o after
cmp before after
trap - ERR
echo YUMIO_PUBLIC_READY
