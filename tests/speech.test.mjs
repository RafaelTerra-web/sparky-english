import test from "node:test";
import assert from "node:assert/strict";
import { BrowserSpeechProvider, compareTranscript, normalizeSpeech, chooseTranscript, recognitionMessage } from "../src/lib/speech.ts";

test("proper-name spelling variants are accepted without loosening the rest of the sentence", () => {
  assert.equal(normalizeSpeech("Hi, I’m Ana!"), "hi i am ana");
  for (const [target, heard] of [["Hi, I'm Ana.", "Hi I am Anna"], ["Sara knows John.", "Sarah knows Jon"], ["I'm Sofia.", "I am Sophia"]]) {
    const result = compareTranscript(target, heard);
    assert.equal(result.exact, true); assert.equal(result.nameVariantAccepted, true);
  }
  for (const [target, heard] of [
    ["I can help Ana.", "I cannot help Anna"], ["Ana has two books.", "Anna has three books"],
    ["I'm Ana.", "I am Anna and this is a joke"], ["Ana likes Sara.", "Sarah likes Anna"],
    ["I think I can.", "I think can"], ["I'm Ana.", "I am Emma"], ["", ""],
  ]) assert.equal(compareTranscript(target, heard).exact, false, target + " / " + heard);
  assert.equal(compareTranscript("I can't do it.", "I can not do it").exact, true);
  assert.equal(compareTranscript("We haven't finished.", "We have not finished").exact, true);
  assert.equal(compareTranscript("What is your name?", "What's your name").exact, true);
  assert.equal(compareTranscript("He's a teacher.", "He is a teacher").exact, true);
  assert.equal(compareTranscript("Ana is twenty years old.", "Anna is 20 years old").exact, true);
  assert.equal(compareTranscript("Ana is twenty years old.", "Anna is 21 years old").exact, false);
  assert.equal(compareTranscript("It is 1.5 metres.", "It is one point five metres").exact, true);
  assert.equal(compareTranscript("It is 1.5 metres.", "It is 1 5 metres").exact, false);
  assert.equal(compareTranscript("It is -5 degrees.", "It is five degrees").exact, false);
  assert.equal(compareTranscript("It is -5 degrees.", "It is minus five degrees").exact, true);
  assert.equal(compareTranscript("He has finished.", "He is finished").exact, false);
  assert.equal(compareTranscript("This is Ana's bag.", "This is Anna's bag").exact, true);
  assert.equal(compareTranscript("This is Ana's bag.", "This is Anna bag").exact, false);
  assert.equal(compareTranscript("Lia has gone to the supermarket.", "Lea has gone to the supermarket").exact, true);
  assert.equal(compareTranscript("The organisation favours her judgement.", "The organization favors her judgment").exact,true);
  assert.equal(compareTranscript("The authors caution us.", "The authors cautioned us").exact,false);
  assert.equal(compareTranscript("She seems worried.", "He seems worried").exact,false);
  assert.deepEqual(compareTranscript("I'm Ana.", "I am Anna hello").extraWords, ["hello"]);
  assert.equal("score" in compareTranscript("Hello.", "Hello."), false);
});
test("comparison is bounded and extra or repeated speech cannot create a match", () => {
  const result = compareTranscript("Hello.", "Hello ".repeat(10000));
  assert.equal(result.exact, false); assert.equal(result.limited, true);
  assert.ok(result.extraWords.length <= 160);
  assert.equal(compareTranscript("Ana likes tea.", "Anna likes tea tea").exact, false);
  assert.equal(chooseTranscript("I'm Ana.", ["I am Emma", "I am Anna"]), "I am Anna");
  assert.equal(chooseTranscript("I like tea.", ["I like", "like tea"]), "I like");
});
test("recognition lifecycle prevents duplicate and stale callbacks and always stops the microphone", t => {
  const instances = [];
  class MockRecognition {
    constructor() { instances.push(this); }
    start() { this.onstart?.(); }
    abort() { this.aborted = true; }
  }
  const provider = new BrowserSpeechProvider();
  assert.equal(provider.canRecognize(), false);
  globalThis.window = { isSecureContext: true, SpeechRecognition: MockRecognition };
  t.after(() => { provider.stop(); delete globalThis.window; });
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let heard = "", ends = 0, error = "";
  const callbacks = { onStart() {}, onResult: value => { heard = value; }, onEnd: () => ends++, onError: value => { error = value; } };
  provider.recognize("en-US", callbacks);
  let recognition = instances.at(-1);
  assert.equal(recognition.maxAlternatives, 3);
  assert.equal(recognition.continuous, false);
  const stale = recognition.onresult;
  recognition.onresult({ results: [{ isFinal: true, length: 2, 0: { transcript: "I am Anna" }, 1: { transcript: "I am Ana" } }] });
  assert.equal(heard, "I am Anna"); assert.equal(ends, 1); assert.equal(recognition.aborted, true);
  stale({ results: [{ isFinal: true, 0: { transcript: "stale" } }] });
  assert.equal(heard, "I am Anna");
  provider.recognize("en-US", callbacks);
  recognition = instances.at(-1);
  recognition.onerror({ error: "not-allowed" });
  assert.equal(error, "not-allowed"); assert.equal(ends, 2);
  provider.recognize("en-US", callbacks);
  recognition = instances.at(-1);
  t.mock.timers.tick(20001);
  assert.equal(error, "timeout"); assert.equal(ends, 3); assert.equal(recognition.aborted, true);
  provider.recognize("en-US", callbacks);
  recognition = instances.at(-1);
  const lateEnd = recognition.onend;
  provider.stop(); lateEnd(); assert.equal(ends, 3);
  assert.match(recognitionMessage("network"), /internet/);
});
