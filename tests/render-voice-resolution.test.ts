import test from "node:test";
import assert from "node:assert/strict";

import { resolveRenderVoice } from "../src/lib/server/render";

test("legacy studio voice ids always resolve to the local fallback voice", () => {
  assert.equal(resolveRenderVoice("fable", "en-CA-Liam"), "en-CA-Liam");
  assert.equal(resolveRenderVoice("adam", "en-GB-RyanNeural"), "en-GB-RyanNeural");
  assert.equal(resolveRenderVoice("en-US-JennyNeural", "en-CA-Liam"), "en-US-JennyNeural");
  assert.equal(resolveRenderVoice("random", "en-CA-Liam"), "en-CA-Liam");
});
