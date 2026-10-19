import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  absoluteUrl,
  buildWhatsAppUrl,
  cn,
  formatPrice,
  normalisePath,
  phoneDigits,
  readingMinutes,
  slugify,
  stripHtml,
  truncate,
} from "../src/lib/utils.js";

describe("slugify", () => {
  test("lowercases and hyphenates", () => {
    assert.equal(slugify("Signature 9-Seater"), "signature-9-seater");
  });

  test("strips accents and punctuation", () => {
    assert.equal(slugify("Pondichéry — Weekend!"), "pondichery-weekend");
  });

  test("trims leading and trailing separators", () => {
    assert.equal(slugify("  --Hello World--  "), "hello-world");
  });

  test("caps length so a slug can never overflow the column", () => {
    assert.ok(slugify("a".repeat(200)).length <= 80);
  });

  test("returns an empty string when there is nothing usable", () => {
    assert.equal(slugify("!!!"), "");
  });
});

describe("formatPrice", () => {
  test("formats whole rupees in the Indian grouping", () => {
    // en-IN groups as 1,25,000 rather than 125,000.
    assert.match(formatPrice(125000) ?? "", /^₹1,25,000$/);
  });

  test("returns null for missing values rather than rendering NaN", () => {
    assert.equal(formatPrice(null), null);
    assert.equal(formatPrice(undefined), null);
    assert.equal(formatPrice(Number.NaN), null);
  });

  test("formats zero rather than treating it as absent", () => {
    assert.equal(formatPrice(0), "₹0");
  });
});

describe("truncate", () => {
  test("leaves short text untouched", () => {
    assert.equal(truncate("Short copy", 40), "Short copy");
  });

  test("cuts at a word boundary and appends an ellipsis", () => {
    const result = truncate("The quick brown fox jumps over the lazy dog", 20);
    assert.ok(result.endsWith("…"));
    assert.ok(result.length <= 21);
    assert.ok(!result.includes("  "));
  });
});

describe("stripHtml", () => {
  test("removes tags and decodes common entities", () => {
    assert.equal(stripHtml("<p>Tolls &amp; parking</p>"), "Tolls & parking");
  });

  test("collapses whitespace left behind by block tags", () => {
    assert.equal(stripHtml("<p>One</p><p>Two</p>"), "One Two");
  });
});

describe("readingMinutes", () => {
  test("always returns at least one minute", () => {
    assert.equal(readingMinutes(""), 1);
    assert.equal(readingMinutes(null), 1);
  });

  test("scales with word count at ~200 wpm", () => {
    assert.equal(readingMinutes(`<p>${"word ".repeat(600)}</p>`), 3);
  });
});

describe("normalisePath", () => {
  test("adds a leading slash and drops a trailing one", () => {
    assert.equal(normalisePath("fleet/"), "/fleet");
    assert.equal(normalisePath("/fleet"), "/fleet");
  });

  test("keeps the root as a single slash", () => {
    assert.equal(normalisePath("/"), "/");
  });
});

describe("phone and WhatsApp links", () => {
  test("strips formatting down to digits", () => {
    assert.equal(phoneDigits("+91 98765 43210"), "9198765 43210".replace(" ", ""));
  });

  test("builds a wa.me link with an encoded message", () => {
    const url = buildWhatsAppUrl("+91 98765 43210", "Hi there & thanks");
    assert.ok(url.startsWith("https://wa.me/919876543210?text="));
    assert.ok(url.includes("%26"), "ampersand should be percent-encoded");
  });

  test("returns an empty string when no number is configured", () => {
    assert.equal(buildWhatsAppUrl("", "Hello"), "");
  });
});

describe("absoluteUrl", () => {
  test("joins a base and a path without doubling slashes", () => {
    assert.equal(absoluteUrl("https://example.com/", "/fleet"), "https://example.com/fleet");
    assert.equal(absoluteUrl("https://example.com", "fleet"), "https://example.com/fleet");
  });

  test("maps the root path to the bare base", () => {
    assert.equal(absoluteUrl("https://example.com", "/"), "https://example.com");
  });
});

describe("cn", () => {
  test("drops falsy values", () => {
    assert.equal(cn("a", false, null, undefined, "b"), "a b");
  });
});
