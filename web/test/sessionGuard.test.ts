import test from "node:test";
import assert from "node:assert/strict";

import { sealSessionData, unsealSessionData } from "../src/lib/session";

test("sealed session unseals with same password", async () => {
  const password = "x".repeat(32);
  const ttl = 60;

  const seal = await sealSessionData({ userId: "user_123" }, password, ttl);
  const unsealed = await unsealSessionData(seal, password, ttl);

  assert.deepEqual(unsealed, { userId: "user_123" });
});

test("invalid session seal is rejected", async () => {
  const password = "x".repeat(32);
  const ttl = 60;

  const seal = await sealSessionData({ userId: "user_123" }, password, ttl);
  const unsealed = await unsealSessionData(seal, "y".repeat(32), ttl);

  assert.equal(unsealed?.userId, undefined);
});
