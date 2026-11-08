"""Rebuild the self-contained HTML from the untouched live snapshot and edits.
Python standard library only. Does not publish or access a network.
"""
from pathlib import Path
import re
import json
import shutil

ROOT = Path(__file__).resolve().parent
source = (ROOT / 'original.html').read_text()
css = '\n'.join((ROOT / name).read_text() for name in ['enhancements.css','layout.css','workflow-v2.css','profile-v2.css','visual-v3.css','product-v4.css','visual-v5.css','recipe-3d.css','pastry.css','generation-workshop.css','workshop.css','capsule-v14.css','home-deck.css'])
js = '\n'.join((ROOT / name).read_text() for name in ['enhancements.js','workflow-v2.js','profile-v2.js','product-v4.js','pastry-ui.js','template-assets.js','workshop.js','generation-workshop.js','home-deck.js'])

def remove_function(text, name):
    match = re.search(r'(?:async )?function '+re.escape(name)+r'\(', text)
    if not match:
        raise ValueError('Missing original function: '+name)
    start = match.start()
    begin = text.index('{', match.end())
    depth, quote, escaped, line_comment, block_comment = 0, None, False, False, False
    i = begin
    while i < len(text):
        c, following = text[i], text[i:i+2]
        if line_comment:
            if c == '\n': line_comment = False
        elif block_comment:
            if following == '*/': block_comment = False; i += 1
        elif quote:
            if escaped: escaped = False
            elif c == '\\': escaped = True
            elif c == quote: quote = None
        elif following == '//': line_comment = True; i += 1
        elif following == '/*': block_comment = True; i += 1
        elif c in "'\"`": quote = c
        elif c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return text[:start] + text[i+1:]
        i += 1
    raise ValueError('Unclosed function '+name)

market='''<section id="market" hidden>
<div class="marketHeading"><div><small>Yumio / MARKET</small><h1>创作集市<span class="titleDot">.</span></h1></div><div class="marketActions"><span class="wallet"></span><a class="primary" href="#studio">进入工坊 ↗</a></div></div>
<div class="marketToolbar"><div id="marketRec" class="marketRec"></div><div class="marketJump" aria-label="集市分区"><button data-market="caps">材料胶囊</button><button data-market="recipes">3D 打印菜谱</button></div></div>
<div class="marketOverview">
<section id="marketCaps" class="marketColumn"><div class="sectionHead"><div class="sectionIdentity"><span class="sectionNumber">01</span><h2>材料胶囊 <span>5</span></h2></div><div class="filters" aria-label="筛选材料"><button id="allCaps" aria-pressed="true">全部</button><button id="matchCaps" aria-pressed="false">按档案筛选</button></div></div><div id="shelf" class="shelf"></div>
<div id="loaded" class="marketLoaded" aria-live="polite"></div><details class="traceDetails"><summary>配料与批次资料 <span>＋</span></summary><div class="lotControl"><b>黑巧克力批次</b><select id="lotPicker" aria-label="黑巧克力批次"><option value="0">AK-261108-05 · 资料已登记</option><option value="1">AK-261109-05 · 声明待补充</option></select></div><div id="trace" class="records"></div></details></section>
<section id="marketRecipes" class="marketColumn"><div class="sectionHead"><div class="sectionIdentity"><span class="sectionNumber">02</span><h2>3D 打印菜谱 <span>6</span></h2></div><span class="sectionTag"><span class="wallet"></span></span></div><div id="recipeGrid" class="stockGrid"></div><p class="recipeDisclaimer">图片为按示例造型与配方制作的静态 3D 渲染，非实际打印成品照片。概念菜谱仅供交互演示；实际制作需核对配料与工艺。</p></section>
</div><div id="stockGrid" hidden></div><div id="exchangeNote" aria-live="polite"></div></section>
'''

studio='''<section id="studio" hidden>
<div class="benchTitle"><div><small>Yumio / STUDIO</small><h1>创作工坊<span class="titleDot">.</span></h1></div><span class="sessionBadge">交互演示</span><button class="mobileCanvasJump" id="jumpCanvas" type="button">创作工具 ↓</button></div>
<div id="workspace" class="benchLayout">
<aside class="benchShelf" aria-label="创作工具"><div class="toolShelfHeader"><b>创作工具</b><button type="button" class="mobileReturn" id="returnCanvas">返回作品 ↑</button><span class="toolScrollHint">下方可滚动</span></div><div class="toolShortcuts" aria-label="快速定位创作工具"><button type="button" data-tool-section="commandForm">输入</button><button type="button" data-tool-section="photoSection">照片</button><button type="button" data-tool-section="materialPicker">材料</button><button type="button" data-tool-section="freetools">素材</button></div><div class="toolScroll" tabindex="0" aria-label="创作工具内容，可滚动">
<form id="commandForm" class="smartInput"><label for="assetSearch"><span>✧</span> 智能输入</label><div class="smartRow"><input id="assetSearch" placeholder="搜索素材 / 输入调整指令" aria-label="搜索素材或输入调整指令" autocomplete="off"><button type="submit" aria-label="执行输入">↗</button></div><div id="commandExamples" class="commandExamples"><button type="button" data-command="添加星星">添加星星</button><button type="button" data-command="改成绿色">改成绿色</button><button type="button" data-command="旋转 30 度">旋转 30°</button></div><output id="commandStatus" aria-live="polite"></output></form>
<div id="freetools"><div class="shelfTitle"><h2>素材库</h2><span>44 种造型</span></div><button type="button" class="featuredStamp" id="addFlowerStamp"><img width="60" height="60" src="assets/model-import/flower-preview.webp" alt=""><span><small>Hi3D 模型</small><strong>花瓣点心浮雕</strong></span><b aria-hidden="true">＋</b></button><div id="pastryStarters" aria-label="快速拼入点心"></div><div id="assetCategories" class="assetCategories" aria-label="素材分类"></div><div id="shapes" class="shapes"></div><div id="markChoices" class="stampGrid" hidden><button data-mark="" aria-pressed="true"><span>○</span>不使用</button><button data-mark="✦"><span>✦</span>星光</button><button data-mark="♡"><span>♡</span>爱心</button><button data-mark="✿"><span>✿</span>花朵</button></div><p id="assetCount" class="assetCount"></p><details class="stampImport"><summary>Hi3D 模型浮雕</summary><p>将 GLB 的顶面轮廓和高低起伏压成点心浮雕。模型只在本机读取。</p><a href="https://www.hitem3d.ai/zh/workspace?panel=generate-3d" target="_blank" rel="noopener">打开 Hi3D 工作台 ↗</a><input id="stampFile" type="file" accept=".glb" aria-label="导入 GLB 模型"><p id="stampStatus" role="status"></p></details><details class="ownedSection"><summary>已收藏菜谱</summary><div id="ownedTools"></div><a href="#market" id="exploreAssets">浏览菜谱 ↗</a></details></div>
<section class="photoSection" id="photoSection"><div class="shelfTitle"><h2>从照片开始</h2><span>提取轮廓</span></div><div id="copytools"><div class="photoDrop" id="photoDrop"><span class="photoGlyph" aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 18 5-5 4 3 3-6 4 8"/></svg></span><b>拖入一张参考图</b><div class="inline"><label class="upload">上传照片<input id="upload" type="file" accept="image/png,image/jpeg,image/webp" aria-label="上传参考照片"></label><label class="upload secondaryUpload">拍照<input id="camera" type="file" accept="image/png,image/jpeg,image/webp" capture="environment" aria-label="拍摄参考照片"></label></div><small>PNG / JPG / WebP · ≤ 12 MB</small></div><img id="sourceImg" hidden class="localImg" alt="上传的参考图片"><p id="analysis" aria-live="polite" class="note"></p></div></section>
<section class="materialPicker" id="materialPicker"><div class="shelfTitle"><h2>材料选择 <span class="multiLabel">可多选</span></h2><a href="#profile" id="activeProfileLink">个人档案 ↗</a></div><div id="materialOptions" class="materialOptions" role="group" aria-label="选择作品材料，可多选"></div><select id="flavor" hidden aria-label="兼容材料控件" tabindex="-1"></select><p id="benchBatch" hidden></p><div id="materialNotice" class="materialNotice" role="status" aria-live="polite" hidden></div><p id="gate" hidden></p></section>

</div></aside>
<div class="benchMain" tabindex="-1"><div class="workHeader"><div><small>YOUR CREATION</small><h2>当前作品</h2></div><div class="printControls"><span id="printReadiness" aria-live="polite"></span><button id="readinessAction" type="button" class="readinessAction">选择材料</button><button id="printBtn" class="primary" title="仅演示打印过程">模拟打印 ↗</button></div></div><div class="benchHead"><div class="undoTools"><button id="undo" class="tiny" aria-label="撤销上一步" title="撤销 Ctrl/⌘ Z">↶ 撤销</button><button id="redo" class="tiny" aria-label="重做上一步" title="重做 Ctrl/⌘ Shift Z">↷ 重做</button></div><div class="inline"><button id="doodleToggle" class="tiny" aria-pressed="false">✎ 画笔</button><input id="brushColor" class="colorInput" type="color" value="#55554b" aria-label="画笔颜色"><button id="materialToggle" class="tiny" aria-pressed="false" title="切换部件区分色与胶囊材质色">区分色</button></div></div>
<div class="compactViewTabs" role="tablist" aria-label="作品视图"><button type="button" id="viewTab3d" role="tab" aria-controls="perspectiveView" aria-selected="true" data-view="perspective">透视预览 · 3D</button><button type="button" id="viewTab2d" role="tab" aria-controls="topView" aria-selected="false" tabindex="-1" data-view="top">顶视编辑 · 2D</button></div><div class="viewPair" id="viewPair" data-compact-view="perspective">
<div class="viewCard" id="perspectiveView"><div class="viewCardHead"><b>透视预览 <span>01 / 3D</span></b><button data-expand="perspective" aria-expanded="false" aria-label="放大或还原透视预览">⛶</button></div><canvas tabindex="0" id="scene" width="840" height="500" aria-description="拖动改变方向和倾角；滚轮缩放；左右方向键旋转。" aria-label="食物造型挤出透视预览"></canvas><div id="modelTools" class="viewFoot"><button id="explodePastry" class="tiny" aria-pressed="false">分层查看</button><button id="resetView" class="tiny">复位</button><button id="rotate" class="tiny">旋转预览</button><button id="wire" class="tiny">线框</button><label>切层 <input id="layer" type="range" min="1" max="12" value="12" aria-label="预览打印层数"> <output id="layerOut">12/12</output></label></div></div>
<div class="viewCard" id="topView"><div class="viewCardHead"><b>顶视编辑 <span>02 / 2D</span></b><button data-expand="top" aria-expanded="false" aria-label="放大或还原顶视编辑">⛶</button></div><div id="editor" class="editor" aria-label="部件摆放区"></div><div id="edActions" class="viewFoot editorSelection"><span id="selectionName"></span><input id="partColor" type="color" value="#c4c58a" aria-label="选中部件颜色"><button class="tiny" data-edit="lower">下移一层</button><button class="tiny" data-edit="raise">上移一层</button></div></div>
</div><p id="benchHint" hidden></p><div id="printState" aria-live="polite"></div></div>
</div></section>
'''

# Preserve legacy input bindings for saved recipes, model imports and editor commands.
material = re.search(r'<section class="materialPicker".*?</section>', studio, re.S)[0]
legacy_rail = studio.split('<aside class="benchShelf"',1)[1].split('</aside>',1)[0]
legacy_rail = ('<aside class="benchShelf"' + legacy_rail + '</aside>').replace(material,'')
compat = legacy_rail + """
<button id="jumpCanvas"></button><button id="doodleToggle"></button><input id="brushColor" type="color">
<button id="materialToggle"></button><button id="wire"></button><input id="layer" type="range"><output id="layerOut"></output>
<div id="edActions"><span id="selectionName"></span><input id="partColor" type="color"></div><p id="benchHint"></p>
"""
studio = (ROOT/'workshop.html').read_text().replace('<!--MATERIAL-->',material).replace('<!--COMPAT-->',compat)

source = re.sub(r'<section id="market" hidden>.*?(?=<section id="studio")', lambda _: market, source, flags=re.S)
source = re.sub(r'<section id="studio" hidden>.*?(?=<section id="about")', lambda _: studio, source, flags=re.S)
source = re.sub(r'<section id="about" hidden>.*?</section>', '', source, flags=re.S)
source = re.sub(r'<a[^>]*href="#about"[^>]*>.*?</a>', '', source)
source = re.sub(r'<template id="approved">.*?</template>', '', source, flags=re.S)
source = source.replace("'market','about'", "'market'")
source = re.sub(r"\$\('copy'\)\.append.*?(?=document.addEventListener\('click')", '', source, count=1, flags=re.S)
source = re.sub(r'const packshots=\[[^\n]+?\];', "const packshots=Array.from({length:5},(_,id)=>'assets/capsules/'+id+'.webp');", source)
# Presets are shared by the stock cards, draft initialization and exported cover renderer.
# Replace the old current-price balance calculation with acquisition-time receipts.
source = re.sub(r"try\{const saved=JSON\.parse\(localStorage\.getItem\('ankuan.exchange.v1'\)\).*?\nconst points=.*?;", lambda _: (ROOT / 'recipe-wallet.js').read_text(), source, count=1)
recipe_source = (ROOT / 'food-recipes.js').read_text()
source = re.sub(r'const goods=\[.*?\n\];', lambda _: recipe_source+'\nconst goods=studioRecipes;', source, count=1, flags=re.S)


for name in ['outline','benchScale','analyze','syncBench','setMode','addPiece','paintEditor','editPiece','stockCard','setMarket','renderMarket','useGood','renderStatus','refreshShelf','scan','askProfile','profileChange','saveFamily','restoreFamily','makeResult']:
    source = remove_function(source, name)
for prefix in ["$('viewTabs').onclick=", "$('decorTools').ontoggle=", "$('markChoices').onclick=", "$('inscription').oninput="]:
    source = re.sub(r'^'+re.escape(prefix)+r'.*\n', '', source, flags=re.M)

# Only workflow-v2.js owns simulation. Remove the original result-producing handler
# rather than leaving a dormant path that refers to the deleted result elements.
start = source.index("$('printBtn').onclick=async()=>{")
end = source.index("};", source.index("document.querySelector('.viewSwitch').onclick=", start))+2
source = source[:start] + source[end:]

# Original state and safety checks remain in place. Adjust only rendering details.
source = source.replace("const scale=free?115:166;", "const items=currentPieces(),levels=pieceLevels(items),renderZoom=viewZoom*cameraFit(items,levels,free?115:166);\n const scale=(free?115:166)*renderZoom;")
source = re.sub(r" const items=currentPieces\(\),levels=\[\];for\(let i=0;i<items.length;i\+\+\).*?\n", "", source)
source = source.replace("296+(x*sa+y*ca)*scale*.46-z*65", "296+(x*sa+y*ca)*scale*viewPitch-z*65*renderZoom")
source = source.replace("for(const {p,i} of parts){\n", "for(const {p,i} of parts){\n  const color=materialColors?capsules[state.capsule??3].color:(p.color||assetColor(p.kind));\n")
source = source.replace("g.transform(ca,.46*sa,-sa,.46*ca,0,0)", "g.transform(ca,viewPitch*sa,-sa,viewPitch*ca,0,0)")
source = source.replace("Math.round((free?24:36)*anchor.s)", "Math.round((free?24:36)*anchor.s*renderZoom)")
source = source.replace("g.fillStyle='#536659';g.font='17px monospace';g.fillText('3D / '", "drawStrokes3D(g,project,levels,renderZoom);\n  g.fillStyle='#536659';g.font='17px monospace';g.fillText('3D / '")
source = source.replace("(state.mode==='copy'&&state.analyzing)", "state.analyzing")

# Remove the obsolete market modal workflow. The new handler adds without replacing work.
start = source.index("document.addEventListener('click',e=>{\n const b=e.target.closest('[data-market]")
end = source.index("\n$('familyPanel').open=true;", start) + 1
source = source[:start] + """document.addEventListener('click',e=>{const b=e.target.closest('[data-settings],#exploreAssets,#findStock');if(!b)return;if(b.id==='exploreAssets'||b.id==='findStock'){setMarket('models');return}dismiss();$('familyPanel').open=true;location.hash='profile'});\n""" + source[end:]

# Replace legacy profile UI and bindings before adding the new module.
# Replace only the original profile section.
source = re.sub(r'<section id="profile" hidden>.*?</section>', lambda _: (ROOT / 'profile-v2.html').read_text(), source, count=1, flags=re.S)
source = source.replace('>我的</a>', '>个人档案库</a>')
source = source.replace('打印出成分安全、款式与同伴一致的零食、饼干和巧克力。','探索适配已登记忌口条件的零食、饼干和巧克力造型。本页为交互演示，不是实际食品安全或医疗保证。')
a=source.index("$('checks').innerHTML="); b=source.index("$('shelf').innerHTML=",a)
source=source[:a]+source[b:]
a=source.index("const continueBtn=document.createElement('button')"); b=source.index("\ndocument.addEventListener('click',e=>{const b=e.target.closest('[data-settings]",a)
source=source[:a]+source[b:]
source=re.sub(r"^\$\('samples'\)\.(?:innerHTML|onclick)=.*\n",'',source,flags=re.M)
source=source.replace("const conflicts=c=>state.profile.filter(tag=>Object.hasOwn(c.tags,tag));", "const conflicts=c=>ingredientConflicts(c);" )
source=source.replace("if(c.incomplete)return 'unknown';", "if(c.incomplete||!state.confirmed||profileRestrictions().unknown.length)return 'unknown';")
source=source.replace("if(needed)scan(needed.cap);else if(!state.confirmed)askProfile();else location.hash='market';", "if(needed)scan(needed.cap);else if(!state.confirmed)askProfile();else $('flavor').focus();")
source=source.replace('。示例配方校验通过。','。仅完成模拟，不代表真实食品安全。')
source=source.replace('装入胶囊 <span>↗</span>', '选择材料 <span>↗</span>').replace('aria-label="装入', 'aria-label="选择材料')
source=source.replace("'待建档校验'", "'请完善档案'").replace("'本批次档案匹配'", "'未发现已登记冲突'")
source=source.replace('变更批次后需重新校验。','变更批次后自动更新材料提示。').replace('一件作品使用一款胶囊，打印前仍需校验。','一件作品使用一款胶囊，材料冲突会自动提示。')

source = re.sub(r'const allowed=\(\)=>[^\n]+;', 'const allowed=()=>materialsAllowed();', source)
source = source.replace('capsules[state.capsule??3].color','materialPreviewColor()')

# V3 editorial reduction: product concept rather than safety guarantees.
source = source.replace('SHIP IT SUNDAY / #015','Yumio / FOOD DESIGN')
source = re.sub(r'(<div class="hero"><div>.*?<h2>).*?(</h2><p>).*?(</p>)', lambda m: m[1]+'一款可玩、可定制、<span>无需清洗的</span><span>胶囊食品3D打印机</span>' +m[2]+'让过敏儿童也能吃上自己喜欢、同伴也有的零食；<br>让家长更省心，更放心。'+m[3], source, count=1, flags=re.S)
source = re.sub(r'<div class="stats">.*?</div>\s*<div class="sectionHead">', '<div class="homeConcept"><span>产品概念 · 交互演示</span><p>配料比对不等于安全保证，实际食用需核对配料与交叉接触风险。</p></div><div class="sectionHead">', source, count=1, flags=re.S)
# The hero CTA and primary navigation are the only home entry points.
source, removed_entries = re.subn(
    r'<div class="sectionHead"><h2>创作入口</h2></div><div class="tiles">.*?</div>(?=</section>)',
    '', source, count=1, flags=re.S)
if removed_entries != 1:
    raise ValueError('Expected exactly one obsolete home entry section')
source = source.replace('<b>胶囊校验</b>','<b>材料与菜谱</b>').replace('按忌口档案检查配料','查看配料，寻找创作灵感')
source = source.replace('照片、素材与涂鸦，在同一个工作台','从照片或素材开始，用涂鸦装饰')
source = source.replace('未装入胶囊','未选择材料')
source = source.replace("document.querySelector('.stats')", "document.querySelector('.homeConcept')")
source=source.replace('const parts=items.map','const pastryOffsets=pastryBases(items,levels,separated&&!state.printing);\n const parts=items.map')
source=source.replace(' const cosine=Math.cos(p.angle)', """ if(p.relief){drawStamp(g,p,project,pastryOffsets[i],color,state.layer,state.wire,state.angle);continue}
 if(pastrySpecs[p.kind]){
   pastrySurface(g,p,project,pastryOffsets[i],color,state.layer,state.wire,state.angle);continue;
 }
 const cosine=Math.cos(p.angle)""")
source=source.replace('base=levels[i]*.72','base=levels[i]*(separated&&!state.printing?1.65:.72)').replace('const z=levels[items.indexOf(anchor)]*.72','const z=levels[items.indexOf(anchor)]*(separated&&!state.printing?1.65:.72)')
source=source.replace("freeParts=[part('球',0,.12,.58),part('球',-.46,-.31,.25),part('球',.46,-.31,.25)]","freeParts=[part('花边塔壳',0,0,.80),part('莓果夹心',0,0,.59),part('玫瑰花冠',0,0,.34)].map(p=>({...p,color:pastrySpecs[p.kind][0]}))")
flower = json.loads((ROOT/'assets/model-import/flower-relief.json').read_text())
source=source.replace('const part=(kind', 'const featuredFlower='+json.dumps(flower,separators=(',',':'))+';\n'+(ROOT/'pastry.js').read_text()+'\nconst part=(kind',1)
# Keep the drawing surface quiet; view labels and actions live outside the canvas.
source=source.replace("g.fillStyle='#f2f0e5';g.fillRect(0,0,W,H);","g.fillStyle='#f5f3ea';g.fillRect(0,0,W,H);")
source=source.replace("g.fillText('3D / '+(state.wire?'WIREFRAME':'MODEL'),23,33);","")
source=source.replace("g.fillText(String(state.layer).padStart(2,'0')+' / 12',W-24,H-21);","")
start=source.index(" const ellipse=(x,y,rx,ry,fill)=>",source.index("function draw(){"))
end=source.index(" const items=currentPieces()",start)
source=source[:start]+" wkDrawServingSurface(g,W,H);\n"+source[end:]
source=source.replace("$('layer').value=String(state.layer);", "if(typeof wkPositionSelection==='function' && $('currentTemplate').textContent)wkPositionSelection();\n $('layer').value=String(state.layer);")
gallery = """<figure class="productGallery"><img id="productGalleryImage" src="assets/home/printer.webp" alt="食品打印机在打印花形点心，旁边是两颗可替换的原料胶囊" width="1536" height="1024" fetchpriority="high"><figcaption aria-label="产品图片"><button data-product-image="printer" type="button" aria-pressed="true">整机</button><button data-product-image="structure" type="button" aria-pressed="false">胶囊结构</button></figcaption></figure>"""
source = re.sub(r'<figure class="photo">.*?</figure>', lambda _: gallery, source, count=1, flags=re.S)
source = re.sub(r'(<div class="actions"><a class="primary" href="#studio">开始体验.*?</a>)', lambda m: m[1]+'<button type="button" class="secondary" data-open-intro>产品介绍</button>', source, count=1)
source = source.replace('<div class="homeConcept">', (ROOT/'home-deck.html').read_text()+'<div class="homeConcept">', 1)
source = source.replace('</style></head>', '\n'+css+'\n</style></head>',1)
source = source.replace("setMode('copy');updateSample();updateRoute();", '\n'+js+"\ninitializeProfilesV2();setMode('free');updateRoute();wkStart();",1)
(ROOT / 'index.html').write_text(source)
(ROOT / 'dist').mkdir(exist_ok=True)
(ROOT / 'dist' / 'index.html').write_text(source)
recipe_assets = ROOT / 'assets' / 'recipes'
published_assets = ROOT / 'dist' / 'assets' / 'recipes'
published_assets.mkdir(parents=True, exist_ok=True)
for asset in recipe_assets.glob('*.webp'):
    shutil.copy2(asset, published_assets / asset.name)
shutil.copytree(ROOT/'assets/home', ROOT/'dist/assets/home', dirs_exist_ok=True)
shutil.copytree(ROOT/'assets/capsules', ROOT/'dist/assets/capsules', dirs_exist_ok=True)
script = source.split('<script>',1)[1].split('</script>',1)[0]
(ROOT / 'app-check.js').write_text(script)
shutil.copytree(ROOT/'assets/templates', ROOT/'dist/assets/templates', dirs_exist_ok=True)
print('Built index.html:', len(source.encode()), 'bytes')

shutil.copytree(ROOT/'assets/model-import', ROOT/'dist/assets/model-import', dirs_exist_ok=True)

shutil.copytree(ROOT/'assets/pastries', ROOT/'dist/assets/pastries', dirs_exist_ok=True)

# Rebuild the deployable Worker from exactly these static assets.
import runpy
runpy.run_path(str(ROOT/'scripts/build_worker.py'))
