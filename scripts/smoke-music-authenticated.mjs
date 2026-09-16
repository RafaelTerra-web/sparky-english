// Run against localhost or an exact candidate URL with an existing authorized
// Playwright storage state. Never mints production sessions or bypasses Vercel.
import assert from 'node:assert/strict';
import { request } from 'playwright';
import { musicBaseURL, musicSessionOptions } from './music-smoke-browser.mjs';

const base = new URL(musicBaseURL);
const local = ['localhost','127.0.0.1'].includes(base.hostname);
if (!local && (base.protocol !== 'https:' || !process.env.MUSIC_STORAGE_STATE)) {
  throw Error('Remote smoke requires HTTPS and MUSIC_STORAGE_STATE from an authorized session.');
}
const api = await request.newContext({...musicSessionOptions,baseURL:base.origin});
try {
  const catalog = await api.get('/api/music');
  assert.equal(catalog.status(),200,'An existing authenticated session is required (no protection bypass).');
  const lesson=(await catalog.json()).catalog[0];
  assert.ok(lesson,'Music release bundle must be present');
  assert.equal(lesson.version,'full-song-timing-2');
  assert.equal(lesson.lines.length,49);
  const synthetic=lesson.id==='synthetic-ui-check';
  if(synthetic) assert.ok(local&&process.env.MUSIC_ALLOW_SYNTHETIC==='1','Synthetic fixture requires explicit local opt-in');
  else {
    assert.equal(lesson.vocabulary.length,127);
    assert.equal(lesson.lines.reduce((sum,l)=>sum+l.words.length,0),285);
  }
  const audio=await api.get('/api/music/audio',{headers:{Range:'bytes=0-99'}});
  assert.equal(audio.status(),206);
  assert.equal((await audio.body()).length,100);
  assert.match(audio.headers()['content-range'],/^bytes 0-99\/\d+$/);
  const progressURL=`/api/media-progress?trackId=${encodeURIComponent(lesson.id)}`;
  const before=await api.get(progressURL);
  assert.equal(before.status(),200);
  const state=await before.json();
  // An idempotent content write tests storage without adding or removing any
  // saved word, checkpoint or completion from the user's progress.
  const saved=await api.patch('/api/media-progress',{headers:{Origin:base.origin},data:{trackId:lesson.id,baseRevision:state.revision,state}});
  assert.equal(saved.status(),200,'Persistence failed, or another session changed the revision; rerun after it settles');
  const result=await saved.json();
  assert.equal(result.revision,state.revision+1);
  assert.deepEqual({...result,revision:state.revision},state);
  const recovered=await api.get(progressURL);
  assert.equal(recovered.status(),200);
  assert.deepEqual(await recovered.json(),result);
  console.log(`PASS: ${base.origin}; authenticated catalog (${lesson.lines.length} lines, ${lesson.vocabulary.length} vocabulary entries), full-song-timing-2, Range 206, progress write/read. ${synthetic?'SYNTHETIC LOCAL FIXTURE — no real-audio or production validation.':''}`);
} finally {await api.dispose();}
