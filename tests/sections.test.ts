import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  SECTION_DEFS,
  getSectionDef,
  isRepeater,
  parseSectionData,
  sBool,
  sList,
  sNum,
  sText,
  sectionDefaults,
} from "../src/lib/sections.js";

describe("section registry", () => {
  test("every section type is unique", () => {
    const types = SECTION_DEFS.map((d) => d.type);
    assert.equal(new Set(types).size, types.length);
  });

  test("every field name within a section is unique", () => {
    for (const def of SECTION_DEFS) {
      const names = def.fields.map((f) => f.name);
      assert.equal(new Set(names).size, names.length, `duplicate field in "${def.type}"`);
    }
  });

  test("every select field declares options and a valid default", () => {
    for (const def of SECTION_DEFS) {
      for (const field of def.fields) {
        if (isRepeater(field) || field.type !== "select") continue;
        assert.ok(field.options?.length, `${def.type}.${field.name} has no options`);
        if (field.default !== undefined) {
          const values = field.options!.map((o) => o.value);
          assert.ok(
            values.includes(field.default as string),
            `${def.type}.${field.name} default is not one of its options`,
          );
        }
      }
    }
  });

  test("the types the renderer handles all exist in the registry", () => {
    // Keeps the switch in section-renderer.tsx honest.
    const rendered = [
      "hero", "richText", "imageText", "fullImage", "gallery", "video", "stats",
      "featureGrid", "process", "fleetShowcase", "serviceShowcase", "routeShowcase",
      "packageShowcase", "articleShowcase", "pricing", "testimonials", "faq", "cta",
      "contactDetails",
    ];
    for (const type of rendered) {
      assert.ok(getSectionDef(type), `renderer handles "${type}" but the registry does not define it`);
    }
    assert.equal(rendered.length, SECTION_DEFS.length, "registry and renderer are out of sync");
  });
});

describe("sectionDefaults", () => {
  test("produces a value for every declared field", () => {
    for (const def of SECTION_DEFS) {
      const defaults = sectionDefaults(def.type);
      for (const field of def.fields) {
        assert.ok(field.name in defaults, `${def.type}.${field.name} missing from defaults`);
      }
    }
  });

  test("repeaters start as an empty array", () => {
    assert.deepEqual(sectionDefaults("hero").stats, []);
  });

  test("an unknown type yields an empty object rather than throwing", () => {
    assert.deepEqual(sectionDefaults("not-a-section"), {});
  });
});

describe("parseSectionData", () => {
  test("round-trips a valid payload", () => {
    const raw = JSON.stringify({ heading: "Our fleet", limit: 4, tone: "ink" });
    const data = parseSectionData("fleetShowcase", raw);
    assert.equal(sText(data, "heading"), "Our fleet");
    assert.equal(sNum(data, "limit"), 4);
    assert.equal(sText(data, "tone"), "ink");
  });

  test("falls back to defaults on malformed JSON instead of crashing the page", () => {
    const data = parseSectionData("hero", "{not json");
    assert.deepEqual(data, sectionDefaults("hero"));
  });

  test("falls back on null or empty input", () => {
    assert.deepEqual(parseSectionData("hero", null), sectionDefaults("hero"));
    assert.deepEqual(parseSectionData("hero", ""), sectionDefaults("hero"));
  });

  test("fills in fields a saved row is missing, so adding a field is safe", () => {
    // Simulates a row written before `stats` existed on the hero.
    const data = parseSectionData("hero", JSON.stringify({ heading: "Only a heading" }));
    assert.equal(sText(data, "heading"), "Only a heading");
    assert.deepEqual(sList(data, "stats"), []);
    assert.equal(sText(data, "primaryLabel"), "");
  });

  test("clamps an out-of-range number to the declared bounds", () => {
    const data = parseSectionData("fleetShowcase", JSON.stringify({ limit: 9999 }));
    assert.equal(sNum(data, "limit") <= 24, true);
  });

  test("replaces an invalid select value with the default", () => {
    const data = parseSectionData("fleetShowcase", JSON.stringify({ tone: "neon" }));
    assert.equal(sText(data, "tone"), "ivory");
  });

  test("coerces a checkbox string into a boolean", () => {
    const data = parseSectionData("cta", JSON.stringify({ showContactButtons: "on" }));
    assert.equal(sBool(data, "showContactButtons"), true);
  });

  test("keeps repeater items", () => {
    const raw = JSON.stringify({
      stats: [
        { label: "Fleet", value: "9 to 35 seats" },
        { label: "Chauffeur", value: "Included" },
      ],
    });
    const items = sList<{ label: string; value: string }>(parseSectionData("hero", raw), "stats");
    assert.equal(items.length, 2);
    assert.equal(items[0]!.label, "Fleet");
  });
});

describe("typed readers", () => {
  test("return safe values for missing or wrongly typed keys", () => {
    const data: Record<string, unknown> = { a: 1, b: "x", c: [1] };
    assert.equal(sText(data, "a"), "");
    assert.equal(sText(data, "missing"), "");
    assert.equal(sNum(data, "b", 7), 7);
    assert.equal(sBool(data, "b"), false);
    assert.deepEqual(sList(data, "b"), []);
    assert.equal(sList(data, "c").length, 1);
  });
});
