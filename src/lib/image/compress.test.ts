import { describe, expect, it } from "vitest";
import { fitWithin } from "./compress";

describe("fitWithin", () => {
  it("scales the longest side down to the limit and keeps the ratio", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1024, height: 768 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 768, height: 1024 });
  });

  it("never upscales small images", () => {
    expect(fitWithin(600, 400)).toEqual({ width: 600, height: 400 });
  });
});
