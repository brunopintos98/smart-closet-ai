import { describe, expect, it } from "vitest";
import { isJpeg, readJpegSize } from "./jpeg";
import { CATALOG_MAX_BYTES, validateCatalogImage } from "./limits";
import { normalizeCatalogOutput } from "./schema";

/** Smallest JPEG-like header with an SOF0 frame of the given size. */
function fakeJpeg(width: number, height: number, padTo = 0): Uint8Array {
  const app0 = [0xff, 0xe0, 0x00, 0x10, ...new Array(14).fill(0)];
  const sof0 = [0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, ...new Array(10).fill(0)];
  const bytes = [0xff, 0xd8, ...app0, ...sof0, 0xff, 0xd9];
  const out = new Uint8Array(Math.max(bytes.length, padTo));
  out.set(bytes);
  return out;
}

describe("readJpegSize", () => {
  it("reads width and height from the frame header", () => {
    expect(readJpegSize(fakeJpeg(1024, 768))).toEqual({ width: 1024, height: 768 });
  });

  it("rejects non-JPEG data", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(isJpeg(png)).toBe(false);
    expect(readJpegSize(png)).toBeNull();
  });

  it("returns null for a truncated header", () => {
    expect(readJpegSize(fakeJpeg(1024, 768).slice(0, 12))).toBeNull();
  });
});

describe("validateCatalogImage", () => {
  it("accepts the client's compressed photos", () => {
    expect(validateCatalogImage(fakeJpeg(1024, 768), readJpegSize)).toBeNull();
  });

  it("rejects empty, oversized and huge-resolution images", () => {
    expect(validateCatalogImage(new Uint8Array(), readJpegSize)).toBe("badImage");
    expect(validateCatalogImage(fakeJpeg(800, 600, CATALOG_MAX_BYTES + 1), readJpegSize)).toBe("tooLarge");
    expect(validateCatalogImage(fakeJpeg(4000, 3000), readJpegSize)).toBe("tooLarge");
  });

  it("rejects anything that is not a JPEG", () => {
    expect(validateCatalogImage(new TextEncoder().encode("hola, no soy una foto"), readJpegSize)).toBe("badImage");
  });
});

describe("normalizeCatalogOutput", () => {
  const valid = {
    isGarment: true,
    name: "  Campera   de jean ",
    category: "outerwear",
    kind: "jacket",
    color: "denim",
    warmth: "medium",
    formality: 2,
    occasions: ["casual", "casual", "office"],
    rainFriendly: false,
  };

  it("cleans the name and removes duplicate occasions", () => {
    expect(normalizeCatalogOutput(valid)).toEqual({
      name: "Campera de jean",
      category: "outerwear",
      kind: "jacket",
      color: "denim",
      warmth: "medium",
      formality: 2,
      occasions: ["casual", "office"],
      rainFriendly: false,
    });
  });

  it("clamps formality to 1-5", () => {
    expect(normalizeCatalogOutput({ ...valid, formality: 9 })?.formality).toBe(5);
    expect(normalizeCatalogOutput({ ...valid, formality: -3 })?.formality).toBe(1);
  });

  it("drops a kind that does not match the category", () => {
    expect(normalizeCatalogOutput({ ...valid, category: "footwear", kind: "dress" })?.kind).toBeUndefined();
  });

  it("returns null when the photo is not a garment", () => {
    expect(normalizeCatalogOutput({ ...valid, isGarment: false })).toBeNull();
  });

  it("returns null for invalid enums, missing fields or an empty name", () => {
    expect(normalizeCatalogOutput({ ...valid, color: "fucsia" })).toBeNull();
    expect(normalizeCatalogOutput({ name: "x" })).toBeNull();
    expect(normalizeCatalogOutput({ ...valid, name: "   " })).toBeNull();
    expect(normalizeCatalogOutput(null)).toBeNull();
  });

  it("truncates very long names", () => {
    expect(normalizeCatalogOutput({ ...valid, name: "a".repeat(200) })?.name).toHaveLength(60);
  });
});
