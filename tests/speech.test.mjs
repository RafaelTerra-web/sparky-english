import test from "node:test";
import assert from "node:assert/strict";
import {
  BrowserSpeechProvider,
  compareTranscript,
  normalizeSpeech,
  mascotVoiceProfiles,
  recognitionMessage,
} from "../src/lib/speech.ts";

test("speech text comparison handles punctuation, contractions, word order and repeated words without a pronunciation score", () => {
  assert.equal(normalizeSpeech("Hi, I’m Ana!"), "hi i am ana");
  assert.equal(compareTranscript("Hi, I'm Ana.", "Hi I am Ana").exact, true);
  assert.equal(
    compareTranscript("I can do it.", "I cannot do it.").exact,
    false,
  );
  const repeat = compareTranscript("I think I can.", "I think can");
  assert.equal(repeat.words.filter((w) => w.recognized).length, 3);
  assert.equal(compareTranscript("I like her.", "Her like I").exact, false);
  assert.equal(compareTranscript("", "").exact, false);
  assert.equal("score" in repeat, false);
});
test("unsupported environments have a safe fallback and mascot profiles stay within synthesis bounds", () => {
  const p = new BrowserSpeechProvider();
  assert.equal(p.canSpeak(), false);
  assert.equal(p.canRecognize(), false);
  assert.deepEqual(p.voices(), []);
  for (const profile of Object.values(mascotVoiceProfiles)) {
    assert.ok(profile.pitch >= 0 && profile.pitch <= 2);
    assert.ok(profile.rate >= 0.1 && profile.rate <= 10);
  }
  assert.match(recognitionMessage("network"), /internet/);
  assert.match(recognitionMessage("not-allowed"), /microfone/);
});
test("browser adapter speaks selected English voice and aborts recognition on result, error, stop and timeout", (t) => {
  let recognition,
    utterance,
    cancelled = 0;
  class MockRecognition {
    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- Expose the constructed test double to drive browser events.
      recognition = this;
    }
    start() {
      this.started = true;
      this.onstart?.();
    }
    abort() {
      this.aborted = true;
    }
  }
  class MockUtterance {
    constructor(text) {
      this.text = text;
    }
  }
  const english = {
    voiceURI: "en-test",
    name: "Test English",
    lang: "en-US",
    localService: true,
  };
  globalThis.window = {
    isSecureContext: true,
    SpeechRecognition: MockRecognition,
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: {
      getVoices: () => [english, { ...english, voiceURI: "pt", lang: "pt-BR" }],
      speak: (value) => {
        utterance = value;
      },
      cancel: () => cancelled++,
    },
  };
  globalThis.SpeechSynthesisUtterance = MockUtterance;
  const provider = new BrowserSpeechProvider();
  t.after(() => {
    provider.stop();
    delete globalThis.window;
    delete globalThis.SpeechSynthesisUtterance;
  });
  t.mock.timers.enable({ apis: ["setTimeout"] });
  assert.equal(provider.voices().length, 1);
  let playbackEnded = false;
  provider.speak(
    "I'm Ana.",
    { voiceId: "en-test", mascot: "pinky", slow: true },
    () => {
      playbackEnded = true;
    },
  );
  assert.equal(utterance.lang, "en-US");
  assert.equal(utterance.pitch, 1.4);
  assert.equal(utterance.rate, 0.72);
  utterance.onend();
  assert.equal(playbackEnded, true);
  let heard = "",
    ended = 0,
    error = "";
  const callbacks = {
    onStart() {},
    onResult: (value) => (heard = value),
    onEnd: () => ended++,
    onError: (value) => (error = value),
  };
  provider.recognize("en-US", callbacks);
  assert.equal(recognition.continuous, false);
  assert.equal(recognition.lang, "en-US");
  recognition.onresult({
    results: [{ isFinal: true, 0: { transcript: "I am Ana" } }],
  });
  assert.equal(heard, "I am Ana");
  assert.equal(recognition.aborted, true);
  assert.equal(ended, 1);
  provider.recognize("en-US", callbacks);
  recognition.onerror({ error: "not-allowed" });
  assert.equal(error, "not-allowed");
  assert.equal(recognition.aborted, true);
  assert.equal(ended, 2);
  provider.recognize("en-US", callbacks);
  const lateResult = recognition.onresult;
  provider.stop();
  lateResult({
    results: [{ isFinal: true, 0: { transcript: "must not be delivered" } }],
  });
  assert.equal(heard, "I am Ana");
  assert.equal(recognition.aborted, true);
  provider.recognize("en-US", callbacks);
  t.mock.timers.tick(20001);
  assert.equal(error, "timeout");
  assert.equal(recognition.aborted, true);
  assert.equal(ended, 3);
  provider.speak(
    "Hello.",
    { voiceId: "en-test", mascot: "sparky", slow: false },
    () => {},
  );
  provider.stop();
  assert.equal(cancelled, 1);
});
