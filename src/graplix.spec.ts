import * as withMultipleDepth from "./fixtures/with-multiple-depth";
import * as withSelf from "./fixtures/with-self";
import { graplix } from "./graplix";

test("check - with multiple depth - authorized", async () => {
  const { check } = graplix(withMultipleDepth.input);

  const authorized = await check({
    user: withMultipleDepth.users[0],
    relation: "can_delete",
    object: withMultipleDepth.artifacts[0],
    context: withMultipleDepth.context,
  });

  expect(authorized).toBe(true);
});

test("check - with multiple depth - denied", async () => {
  const { check } = graplix(withMultipleDepth.input);

  const authorized = await check({
    user: withMultipleDepth.users[1],
    relation: "can_delete",
    object: withMultipleDepth.artifacts[0],
    context: withMultipleDepth.context,
  });

  expect(authorized).toBe(false);
});

test("check - with self - authorized", async () => {
  const { check } = graplix(withSelf.input);

  const authorized = await check({
    context: withSelf.context,
    user: withSelf.projects[0],
    object: withSelf.artifacts[0],
    relation: "can_delete",
  });

  expect(authorized).toBe(true);
});
