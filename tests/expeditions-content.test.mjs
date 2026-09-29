import test from 'node:test';
import assert from 'node:assert/strict';
import { expeditionEpisodes, expeditionFamilies, expeditionWorlds, getExpeditionEpisode } from '../src/lib/expeditions-content.ts';
import { expeditionOffers } from '../src/lib/expeditions-catalog.ts';

const hasBothLanguages = value => typeof value?.pt === 'string' && value.pt.trim().length > 0
  && typeof value?.en === 'string' && value.en.trim().length > 0;

test('pilot has two three-episode worlds and one short case in all three level families', () => {
  assert.equal(expeditionWorlds.length, 3);
  assert.equal(expeditionWorlds.filter(world => world.kind === 'expedition').length, 2);
  assert.equal(expeditionWorlds.filter(world => world.kind === 'case').length, 1);
  assert.equal(expeditionEpisodes.length, 21);
  for (const world of expeditionWorlds) {
    const publicOffer = expeditionOffers.find(offer => offer.id === world.id);
    assert.ok(publicOffer);
    assert.equal(publicOffer.price, world.price);
    assert.equal(publicOffer.offerVersion, world.contentVersion);
    assert.deepEqual(publicOffer.episodeIds, world.episodeIds);
    assert.deepEqual(publicOffer.title, world.title);
    assert.deepEqual(publicOffer.description, world.promise);
    assert.deepEqual(publicOffer.preview, world.preview);
    assert.deepEqual(publicOffer.characters, world.characters);
    assert.deepEqual(publicOffer.souvenir, world.souvenir);
    assert.ok(hasBothLanguages(world.title));
    assert.ok(hasBothLanguages(world.promise));
    assert.ok(hasBothLanguages(world.preview.scene));
    assert.ok(hasBothLanguages(world.preview.prompt));
    assert.ok(world.preview.options.length >= 2);
    for (const family of expeditionFamilies) for (const id of world.episodeIds) {
      const matches = expeditionEpisodes.filter(episode => episode.id === id && episode.family === family);
      assert.equal(matches.length, 1, `${id}:${family} must have one authored version`);
      assert.equal(getExpeditionEpisode(id, family), matches[0]);
    }
  }
});

test('every episode has distinct assessed contexts and unambiguous token/option keys', () => {
  const ids = new Set();
  for (const episode of expeditionEpisodes) {
    const key = `${episode.id}:${episode.family}`;
    assert.ok(!ids.has(key), `duplicate episode ${key}`);
    ids.add(key);
    assert.ok(hasBothLanguages(episode.problem), key);
    assert.ok(hasBothLanguages(episode.attempt), key);
    assert.ok(hasBothLanguages(episode.newLearning.explanation), key);
    assert.ok(hasBothLanguages(episode.reveal), key);
    assert.ok(hasBothLanguages(episode.consequence), key);
    assert.ok(hasBothLanguages(episode.canDo.descriptor), key);
    assert.equal(episode.canDo.modality, 'recognition-and-structure');
    assert.notEqual(episode.application.context.en, episode.recall.context.en, key);
    assert.notEqual(episode.transfer.context.en, episode.recall.context.en, key);
    assert.notEqual(episode.application.context.en, episode.transfer.context.en, key);
    assert.equal(episode.decision.options.length, 2);
    assert.equal(new Set(episode.decision.options.map(option => option.id)).size, 2);
    for (const option of episode.decision.options) {
      assert.ok(hasBothLanguages(option.text), key);
      assert.ok(hasBothLanguages(option.consequence), key);
    }
    for (const question of [episode.application, episode.recall]) {
      assert.equal(question.kind, 'choice');
      assert.equal(question.options.length, 3, `${key}:${question.id}`);
      assert.equal(new Set(question.options.map(option => option.id)).size, 3);
      assert.equal(new Set(question.options.map(option => option.text)).size, 3);
      assert.ok(question.options.some(option => option.id === question.answerId));
      assert.ok(hasBothLanguages(question.feedback.correct));
      assert.ok(hasBothLanguages(question.feedback.incorrect));
    }
    const order = episode.transfer;
    assert.equal(order.kind, 'order');
    assert.ok(order.tokens.length >= 3 && order.tokens.length <= 16, `${key}: order length`);
    assert.equal(new Set(order.tokens.map(token => token.id)).size, order.tokens.length);
    assert.deepEqual([...order.tokens.map(token => token.id)].sort(), [...order.answerTokenIds].sort());
    assert.ok(order.tokens.every(token => /^[a-f0-9]{24}$/.test(token.id)), `${key}: token IDs must not reveal answer positions`);
    assert.notDeepEqual(order.tokens.map(token => token.id), order.answerTokenIds, `${key}: display order must not be the answer`);
    assert.ok(hasBothLanguages(order.feedback.correct));
    assert.ok(hasBothLanguages(order.feedback.incorrect));
  }
});
