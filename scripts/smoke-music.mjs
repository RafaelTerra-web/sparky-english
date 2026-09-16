import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const url='http://127.0.0.1:3221';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:950},serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 assert.equal(await page.getByRole('button',{name:'Caderno',exact:true}).count(),0);
 await page.getByRole('button',{name:'Músicas',exact:true}).filter({visible:true}).click();
 await page.getByRole('button',{name:/Abrir sessão/}).click();
 await page.locator('.music-session').waitFor();
 for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 const catalog=await page.request.get(url+'/api/music').then(r=>r.json());assert.ok(catalog.catalog.length);
 const track=catalog.catalog[0];
 const source=await page.request.get(url+'/api/music/audio',{headers:{Range:'bytes=0-99'}});assert.equal(source.status(),206);assert.equal((await source.body()).length,100);
 const noAuth=await page.request.get('http://127.0.0.1:3220/api/music');assert.equal(noAuth.status(),401);
 const foreign=await page.request.patch(url+'/api/media-progress',{headers:{Origin:'https://example.test'},data:{}});assert.equal(foreign.status(),403);
 const before=await page.request.get(url+'/api/media-progress?trackId='+track.id).then(r=>r.json());
 const invalid=await page.request.patch(url+'/api/media-progress',{headers:{Origin:url},data:{trackId:track.id,baseRevision:before.revision,state:{...before,heard:['unknown']}}});assert.equal(invalid.status(),400);
 const stale=await page.request.patch(url+'/api/media-progress',{headers:{Origin:url},data:{trackId:track.id,baseRevision:before.revision+1,state:before}});assert.equal(stale.status(),409);
 assert.deepEqual(errors,[]);
 console.log('Music smoke passed: responsive UI, account isolation, ranges, validation and conflicts.');
} finally {await browser.close();}
