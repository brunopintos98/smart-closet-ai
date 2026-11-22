import { describe, expect, it } from "vitest";
import { detectOccasion } from "./occasionKeywords";

describe("detectOccasion", () => {
  it.each([
    ["Tengo un casamiento a la noche", "formal"],
    ["Hoy voy al gym después del laburo", "sport"],
    ["Reunión con un cliente importante", "office"],
    ["Cena con amigos en Palermo", "dinner"],
    ["Paseo por la plaza", "casual"],
    ["OFICINA", "office"],
  ])("'%s' → %s", (text, expected) => {
    expect(detectOccasion(text)?.occasion).toBe(expected);
  });

  it("returns null when nothing matches", () => {
    expect(detectOccasion("no sé qué hacer")).toBeNull();
    expect(detectOccasion("   ")).toBeNull();
  });

  it("matches whole words only", () => {
    // "barato" contains "bar" but is not a night out.
    expect(detectOccasion("algo barato")).toBeNull();
  });
});
