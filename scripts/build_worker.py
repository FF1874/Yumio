"""Package the same static app and sponsored generation service in the Sites Worker."""
import base64
import json
import mimetypes
from pathlib import Path
from shutil import copy2, copytree
root=Path(__file__).resolve().parents[1]
out=root/'dist'
assets={}
for file in [out/'index.html',*sorted((out/'assets').rglob('*'))]:
    if file.is_file():
        web_types={'.glb':'model/gltf-binary','.webp':'image/webp','.wasm':'application/wasm','.js':'text/javascript'}
        mime=web_types.get(file.suffix) or mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        if mime.startswith('text/'): mime+='; charset=utf-8'
        assets['/'+file.relative_to(out).as_posix()]=[mime,base64.b64encode(file.read_bytes()).decode()]
(out/'server').mkdir(exist_ok=True)
(out/'server/index.js').write_text('const siteFiles='+json.dumps(assets,separators=(',',':'))+';\n'+(root/'hi3d-worker.js').read_text())
(out/'.openai').mkdir(exist_ok=True)
copy2(root/'.openai/hosting.json',out/'.openai/hosting.json')

copytree(root/'drizzle',out/'.openai/drizzle',dirs_exist_ok=True)
