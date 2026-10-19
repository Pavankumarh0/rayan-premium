import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  checkbox,
  enquirySchema,
  linkSchema,
  optionalInt,
  optionalText,
  parseForm,
  passwordSchema,
  redirectSchema,
  slugSchema,
} from "../src/lib/validation.js";

function formOf(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

describe("slugSchema", () => {
  test("normalises arbitrary text into a slug", () => {
    assert.equal(slugSchema.parse("  Premium Vans!  "), "premium-vans");
  });

  test("rejects input with no usable characters", () => {
    assert.equal(slugSchema.safeParse("###").success, false);
  });
});

describe("linkSchema", () => {
  test("accepts internal paths, anchors and safe protocols", () => {
    for (const value of ["/fleet", "#main", "https://example.com", "tel:+919876543210", "mailto:a@b.com"]) {
      assert.equal(linkSchema.safeParse(value).success, true, value);
    }
  });

  test("rejects javascript: and data: URLs", () => {
    // These are the XSS vectors a CMS link field has to refuse.
    for (const value of ["javascript:alert(1)", "data:text/html;base64,PHM+", "vbscript:msgbox"]) {
      assert.equal(linkSchema.safeParse(value).success, false, value);
    }
  });
});

describe("optionalText", () => {
  test("turns an empty submitted field into null", () => {
    assert.equal(optionalText(100).parse(""), null);
    assert.equal(optionalText(100).parse("   "), null);
  });

  test("keeps real values trimmed", () => {
    assert.equal(optionalText(100).parse("  hello  "), "hello");
  });
});

describe("optionalInt", () => {
  test("coerces numeric strings and blanks", () => {
    assert.equal(optionalInt().parse("42"), 42);
    assert.equal(optionalInt().parse(""), null);
    assert.equal(optionalInt().parse(null), null);
  });

  test("enforces the range", () => {
    assert.equal(optionalInt(1, 5).safeParse("9").success, false);
  });
});

describe("checkbox", () => {
  test("reads the HTML checkbox 'on' value as true", () => {
    assert.equal(checkbox.parse("on"), true);
    assert.equal(checkbox.parse("true"), true);
    assert.equal(checkbox.parse(true), true);
  });

  test("treats an absent checkbox as false", () => {
    assert.equal(checkbox.parse(undefined), false);
    assert.equal(checkbox.parse(null), false);
    assert.equal(checkbox.parse("off"), false);
  });
});

describe("passwordSchema", () => {
  test("requires length, a letter and a digit", () => {
    assert.equal(passwordSchema.safeParse("short1").success, false);
    assert.equal(passwordSchema.safeParse("alllettersnonumber").success, false);
    assert.equal(passwordSchema.safeParse("1234567890").success, false);
    assert.equal(passwordSchema.safeParse("Correct1Horse").success, true);
  });
});

describe("enquirySchema", () => {
  test("accepts a minimal valid enquiry", () => {
    const result = parseForm(enquirySchema, formOf({ name: "Priya", phone: "+91 98765 43210" }));
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.name, "Priya");
      assert.equal(result.data.email, null, "an omitted email becomes null, not an empty string");
      assert.equal(result.data.type, "GENERAL");
    }
  });

  test("reports a field-level message for each invalid field", () => {
    const result = parseForm(
      enquirySchema,
      formOf({ name: "A", phone: "abc", email: "not-an-email" }),
    );
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.errors.name);
      assert.ok(result.errors.phone);
      assert.ok(result.errors.email);
    }
  });

  test("accepts an empty email but rejects a malformed one", () => {
    assert.equal(
      parseForm(enquirySchema, formOf({ name: "Priya", phone: "9876543210", email: "" })).success,
      true,
    );
    assert.equal(
      parseForm(enquirySchema, formOf({ name: "Priya", phone: "9876543210", email: "nope" })).success,
      false,
    );
  });

  test("carries the honeypot and timing fields through for the spam check", () => {
    const result = parseForm(
      enquirySchema,
      formOf({ name: "Bot", phone: "9876543210", company: "Spam Co", elapsed: "120" }),
    );
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.company, "Spam Co");
      assert.equal(result.data.elapsed, 120);
    }
  });

  test("rejects a phone number containing letters", () => {
    const result = parseForm(enquirySchema, formOf({ name: "Priya", phone: "call me" }));
    assert.equal(result.success, false);
  });
});

describe("redirectSchema", () => {
  test("requires the source to be a path", () => {
    const result = redirectSchema.safeParse({
      source: "old-page",
      destination: "/new-page",
      statusCode: "301",
      isActive: "on",
    });
    assert.equal(result.success, false);
  });

  test("rejects a redirect that points at itself", () => {
    const result = redirectSchema.safeParse({
      source: "/loop",
      destination: "/loop",
      statusCode: "301",
      isActive: "on",
    });
    assert.equal(result.success, false);
  });

  test("accepts a valid 301", () => {
    const result = redirectSchema.safeParse({
      source: "/old",
      destination: "/new",
      statusCode: "301",
      isActive: "on",
    });
    assert.equal(result.success, true);
  });

  test("rejects an unsupported status code", () => {
    const result = redirectSchema.safeParse({
      source: "/old",
      destination: "/new",
      statusCode: "307",
      isActive: "on",
    });
    assert.equal(result.success, false);
  });
});
