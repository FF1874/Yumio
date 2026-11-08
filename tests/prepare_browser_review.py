from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=(root/'index.html').read_text().replace('<script>','<script>window.__productErrors=[];window.addEventListener("error",e=>window.__productErrors.push(e.message));window.addEventListener("unhandledrejection",e=>window.__productErrors.push(String(e.reason)));',1)
(root/'dist/qa-product-app.html').write_text(s)
(root/'dist/qa-product.html').write_text((root/'tests/browser_layout.html').read_text())
print('Browser review prepared: open qa-product.html in the local preview. Do not publish QA pages.')
