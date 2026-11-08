// Real Chromium DOM/form/storage regressions using the unbundled profile sources.
// Other app actions are stubs here; run passive_profile_review.js for integration.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const html=()=>`<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:30px;font-family:Arial,sans-serif;background:#f8f9f5}button{cursor:pointer;padding:12px 18px;font:inherit;border-radius:8px}.marketHeading{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}.marketHeading h1{font-size:40px}.primary{font-weight:600} ${fs.readFileSync(path.join(root,'profile-v2.css'))}</style>${fs.readFileSync(path.join(root,'profile-v2.html'))}<script>const $=id=>document.getElementById(id);const state={};let clears=0;function clearApproval(){clears++}function renderStatus(){renderProfileSummary()}function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} ${fs.readFileSync(path.join(root,'profile-v2.js'))} initializeProfilesV2();$('profile').hidden=false;</script></html>`;
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html())});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}`;await page.goto(url);
 const value=expr=>page.evaluate(expr);const click=id=>page.locator('#'+id).click();const fill=(id,text)=>page.locator('#'+id).fill(text);
 assert.equal(await page.locator('#profileForm').isVisible(),false);assert.equal(await page.locator('#profileReadView').isVisible(),true);
 assert.equal(await page.locator('#viewSevere').textContent(),'小麦、鸡蛋黄');assert.equal(await value('localStorage.length'),0);
 await click('editProfile');assert.equal(await page.locator('#profileReadView').isVisible(),false);assert.equal(await value('state.confirmed'),false);
 await fill('profileName','不应保存');await fill('profileSevere','芝麻');await page.locator('#remember').check();await click('resetProfileEdit');
 assert.equal(await value('currentProfileV2().name'),'小知');assert.equal(await value('currentProfileV2().severe'),'小麦、鸡蛋黄');assert.equal(await value('archiveRememberV2'),false);assert.equal(await value('localStorage.length'),0);
 await click('addProfile');assert.equal(await value('archiveProfilesV2.length'),2);await fill('profileName','临时');await click('resetProfileEdit');assert.equal(await value('archiveProfilesV2.length'),1);assert.equal(await value('profileDisplayName()'),'小知');
 await click('addProfile');await fill('profileName','新档案');await fill('profileSevere','无已知过敏');await fill('profileOther','牛奶');await click('saveProfileV2');
 assert.equal(await value('profileDisplayName()'),'新档案');assert.deepEqual(await value('profileRestrictions().terms'),['牛奶']);assert.equal(await page.locator('#profileForm').isVisible(),false);assert.equal(await value('localStorage.length'),0);
 await click('editProfile');await fill('profileOther','未知食材');await page.locator('[data-profile-id="sample-xiaozhi"]').click();assert.equal(await value('profileDisplayName()'),'新档案');assert.match(await page.locator('#saveNote').textContent(),/先保存或取消/);await click('saveProfileV2');assert.deepEqual(await value('profileRestrictions().unknown'),['未知食材']);
 await click('editProfile');await fill('profileOther','');await click('saveProfileV2');assert.deepEqual(await value('profileRestrictions().unknown'),['其他忌口未填写']);
 await click('editProfile');await fill('profileOther','无其他忌口');await fill('profileSevere','');await click('saveProfileV2');assert.ok((await value('profileRestrictions().unknown')).includes('过敏信息未填写'));
 await click('editProfile');await fill('profileSevere','无已知过敏');await fill('profileMild','番茄');await page.locator('#remember').check();await click('saveProfileV2');assert.deepEqual(await value('profileRestrictions().terms'),['番茄']);assert.equal(await value('localStorage.length'),1);
 await page.reload();assert.equal(await value('profileDisplayName()'),'新档案');assert.equal(await value('archiveRememberV2'),true);assert.equal(await page.locator('#profileForm').isVisible(),false);
 await click('editProfile');await page.locator('#remember').uncheck();await fill('profileName','未提交');await click('resetProfileEdit');await page.reload();assert.equal(await value('profileDisplayName()'),'新档案');assert.equal(await value('archiveRememberV2'),true);
 await page.locator('[data-profile-id="sample-xiaozhi"]').click();assert.equal(await value('profileDisplayName()'),'小知');await page.reload();assert.equal(await value('profileDisplayName()'),'小知');assert.equal(await page.locator('#profileFictional').isVisible(),true);
 await click('editProfile');await fill('profileName','示例改名');await click('saveProfileV2');assert.equal(await page.locator('#profileFictional').isVisible(),true);
 await page.locator('.profileSettings summary').click();await click('clearProfileStorage');assert.equal(await value('localStorage.length'),0);await page.reload();assert.equal(await value('profileDisplayName()'),'小知');
 // Reload without opt-in restores the fictional sample, not entered health data.
 await click('editProfile');await fill('profileName','本次页面');await click('saveProfileV2');await page.reload();assert.equal(await value('profileDisplayName()'),'小知');
 // Old archives migrate without dropping restrictions; invalid archives fail closed to sample.
 await value("localStorage.setItem(archiveStorageKey,JSON.stringify({version:2,remember:true,active:'sample-xiaozhi',profiles:[Object.fromEntries(Object.entries(fictionalProfileV2).filter(([k])=>k!=='other'))]}))");await page.reload();assert.equal(await value('currentProfileV2().other'),'无其他忌口');assert.deepEqual(await value('state.profile'),['麸质','鸡蛋','番茄']);
 await value("localStorage.setItem(archiveStorageKey,'{broken')");await page.reload();assert.equal(await value('archiveRememberV2'),false);
 // Storage failure must retain session work and not claim persistence.
 await click('editProfile');await page.locator('#remember').check();await value("Storage.prototype.setItem=function(){throw new Error('quota')}");await click('saveProfileV2');assert.equal(await value('archiveRememberV2'),false);assert.match(await page.locator('#saveNote').textContent(),/失败/);
 fs.mkdirSync(path.join(root,'review'),{recursive:true});await page.screenshot({path:path.join(root,'review/profile-v3-readonly.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await value('document.documentElement.scrollWidth<=innerWidth'),true);await page.screenshot({path:path.join(root,'review/profile-v3-mobile.png'),fullPage:true});
 await click('editProfile');assert.equal(await value('document.documentElement.scrollWidth<=innerWidth'),true);await page.screenshot({path:path.join(root,'review/profile-v3-edit-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: real Chromium read-only/edit separation, cancel, save, new-profile cancel, switch guard, known/unknown/missing restrictions, opt-in persistence, reload, migration, storage failure, and desktop/mobile overflow.');
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
