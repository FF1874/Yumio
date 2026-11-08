// Static asset and recipe rendering regressions; browser image decoding is checked separately.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'enhancements.js'),'utf8');
const start=script.indexOf('function recipeRender(');
const end=script.indexOf('function setMarket(',start);
const source=script.slice(start,end);
const noop=()=>'';
const s={owned:[],recipeState:noop,escapeHtml:x=>x,recipeDetails:()=>'<details class="recipeDetails"></details>'};
s.atob=atob;vm.createContext(s);vm.runInContext(source,s);
const ids=['cake-strawberry-mango','cake-rose-berry','pizza-tomato-basil','pizza-pepper-mushroom','cookie-citrus-wreath','cookie-cocoa-letters'];
const hashes=new Set();let total=0;
for(const id of ids){
 const file=path.join(root,'assets','recipes',id+'.webp');
 const data=fs.readFileSync(file);
 assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
 assert.ok(data.length<180000,'efficient image: '+id);total+=data.length;
 hashes.add(require('node:crypto').createHash('sha256').update(data).digest('hex'));
 assert.deepEqual(fs.readFileSync(path.join(root,'dist','assets','recipes',id+'.webp')),data,'published image matches source: '+id);
 const html=vm.runInContext(`stockCard({id:${JSON.stringify(id)},cover:'assets/recipes/'+${JSON.stringify(id)}+'.webp',name:'Test',sub:'Materials',price:0})`,s);
 assert.match(html,new RegExp('src="assets/recipes/'+id+'\\.webp"'));
 assert.match(html,/loading="lazy" decoding="async"/);assert.match(html,/width="810" height="585"/);
 assert.match(html,/的 3D 成品/);assert.match(html,/class="recipeDetails"/);assert.match(html,/data-good=/);
 assert.doesNotMatch(html,/stockArt|<svg|<canvas|<video/);
}
assert.equal(hashes.size,6,'six distinct images');assert.ok(total<800000,'total image budget');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/非实际打印成品照片/);assert.match(html,/recipe-3d|recipeRenderImage/);
assert.ok(!/qa-.*\.html/.test(fs.readdirSync(path.join(root,'dist')).join(' ')),'no QA page in publish output');
console.log('PASS: six distinct WebP renders, asset parity, image semantics, lazy loading, unchanged recipe controls and no extra rendering runtime. '+total+' bytes total.');
