import test from "node:test";
import assert from "node:assert/strict";

import { isStalePosting } from "../src/lib/server/worker-recovery";

test("posting rows older than the timeout are treated as stale", () => {
  const now = new Date("2026-01-10T12:00:00.000Z");
  const stale = {
    status: "posting",
    createdAt: new Date("2026-01-10T11:00:00.000Z"),
  };

  assert.equal(isStalePosting(stale, now), true);
  assert.equal(isStalePosting({ status: "ready", createdAt: stale.createdAt }, now), false);
  assert.equal(isStalePosting({ status: "posting", createdAt: new Date("2026-01-10T11:59:00.000Z") }, now), false);
});
