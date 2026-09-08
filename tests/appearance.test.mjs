import test from 'node:test';
import assert from 'node:assert/strict';
import { isAppearancePreference, normalizeAppearance } from '../src/lib/appearance-shared.ts';
import { readBoundedJson } from '../src/lib/bounded-json.ts';
test('appearance rejects unknown palettes, modes and malformed input',()=>{
 for(const value of [null,[],{palette:'red',mode:'dark'},{palette:'sparky',mode:'auto'},{palette:'__proto__',mode:'light'}])assert.equal(isAppearancePreference(value),false);
 assert.deepEqual(normalizeAppearance(null),{palette:'sparky',mode:'system'});
 for(const palette of ['sparky','beatrice','ocean','sunset','graphite'])for(const mode of ['light','dark','system'])assert.ok(isAppearancePreference({palette,mode}));
});
test('bounded appearance payload rejects oversized streamed bodies',async()=>{
 await assert.rejects(readBoundedJson(new Request('http://localhost',{method:'PUT',body:JSON.stringify({palette:'x'.repeat(700),mode:'dark'})}),512));
});
