import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sanitizePlain, sanitizeRichText } from "../src/lib/sanitize.js";
import {
  buildMetadataWith,
  faqJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
} from "../src/lib/seo.js";
import { SETTING_DEFS, formatAddress, type SiteSettings } from "../src/lib/settings.js";

/** Settings object with all defaults applied, plus any overrides. */
function settingsWith(overrides: Record<string, string> = {}): SiteSettings {
  const base: SiteSettings = {};
  for (const def of SETTING_DEFS) base[def.key] = def.default;
  return { ...base, ...overrides };
}

describe("sanitizeRichText", () => {
  test("strips script tags and their contents", () => {
    const out = sanitizeRichText('<p>Safe</p><script>alert("xss")</script>');
    assert.ok(!out.includes("<script"));
    assert.ok(!out.includes("alert"));
    assert.ok(out.includes("Safe"));
  });

  test("strips inline event handlers", () => {
    const out = sanitizeRichText('<p onclick="steal()">Text</p>');
    assert.ok(!out.includes("onclick"));
    assert.ok(out.includes("Text"));
  });

  test("drops javascript: hrefs but keeps the link text", () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">Click</a>');
    assert.ok(!out.includes("javascript:"));
    assert.ok(out.includes("Click"));
  });

  test("blocks data: URLs on images", () => {
    const out = sanitizeRichText('<img src="data:text/html;base64,PHNjcmlwdD4=" alt="x">');
    assert.ok(!out.includes("data:"));
  });

  test("keeps the editorial tags the design relies on", () => {
    const html = "<h2>Heading</h2><p><strong>Bold</strong> and <em>italic</em></p><ul><li>One</li></ul><blockquote>Quote</blockquote>";
    const out = sanitizeRichText(html);
    for (const tag of ["<h2>", "<strong>", "<em>", "<ul>", "<li>", "<blockquote>"]) {
      assert.ok(out.includes(tag), `expected ${tag} to survive`);
    }
  });

  test("adds rel=noopener to external links to prevent tabnabbing", () => {
    const out = sanitizeRichText('<a href="https://example.com" target="_blank">Out</a>');
    assert.ok(out.includes('rel="noopener noreferrer"'));
  });

  test("leaves internal links without a rel attribute", () => {
    const out = sanitizeRichText('<a href="/fleet">Fleet</a>');
    assert.ok(!out.includes("noopener"));
  });

  test("marks editor images as lazy-loaded", () => {
    const out = sanitizeRichText('<img src="https://example.com/a.jpg" alt="A van">');
    assert.ok(out.includes('loading="lazy"'));
  });

  test("returns an empty string for null input", () => {
    assert.equal(sanitizeRichText(null), "");
    assert.equal(sanitizeRichText(undefined), "");
  });
});

describe("sanitizePlain", () => {
  test("removes all markup", () => {
    assert.equal(sanitizePlain("<b>Hi</b>"), "Hi");
  });
});

describe("buildMetadataWith", () => {
  test("applies the title template", () => {
    const meta = buildMetadataWith(settingsWith(), { title: "Our fleet", path: "/fleet" });
    assert.equal(meta.title, "Our fleet · Rayan Premium Mobility");
  });

  test("falls back to the brand name when there is no page title", () => {
    const meta = buildMetadataWith(settingsWith(), { title: "", path: "/" });
    assert.equal(meta.title, "Rayan Premium Mobility");
  });

  test("builds an absolute canonical from the configured site URL", () => {
    const meta = buildMetadataWith(
      settingsWith({ "seo.siteUrl": "https://example.com" }),
      { title: "Fleet", path: "/fleet" },
    );
    assert.equal(meta.alternates?.canonical, "https://example.com/fleet");
  });

  test("honours a per-page canonical override", () => {
    const meta = buildMetadataWith(settingsWith(), {
      title: "Fleet",
      path: "/fleet",
      canonicalOverride: "https://canonical.example/fleet",
    });
    assert.equal(meta.alternates?.canonical, "https://canonical.example/fleet");
  });

  test("marks a page noindex when the page asks for it", () => {
    const meta = buildMetadataWith(settingsWith(), { title: "X", path: "/x", noindex: true });
    assert.equal((meta.robots as { index: boolean }).index, false);
  });

  test("the staging switch overrides a page that wants to be indexed", () => {
    const meta = buildMetadataWith(settingsWith({ "seo.robotsPolicy": "true" }), {
      title: "X",
      path: "/x",
      noindex: false,
    });
    assert.equal((meta.robots as { index: boolean }).index, false);
  });

  test("truncates an over-long description", () => {
    const meta = buildMetadataWith(settingsWith(), {
      title: "X",
      path: "/x",
      description: "word ".repeat(200),
    });
    assert.ok((meta.description ?? "").length <= 171);
  });

  test("strips markup out of a description taken from rich text", () => {
    const meta = buildMetadataWith(settingsWith(), {
      title: "X",
      path: "/x",
      description: "<p>Hello <strong>world</strong></p>",
    });
    assert.equal(meta.description, "Hello world");
  });
});

describe("structured data", () => {
  test("Organization omits fields the client has not supplied", () => {
    const data = organizationJsonLd(settingsWith());
    assert.equal(data["@type"], "Organization");
    assert.ok(!("telephone" in data), "must not invent a phone number");
    assert.ok(!("sameAs" in data), "must not invent social profiles");
  });

  test("Organization includes details once they are set", () => {
    const data = organizationJsonLd(
      settingsWith({ "contact.phone": "+91 98765 43210", "social.instagram": "https://instagram.com/x" }),
    );
    assert.equal(data.telephone, "+91 98765 43210");
    assert.deepEqual(data.sameAs, ["https://instagram.com/x"]);
  });

  test("LocalBusiness stays null until it is explicitly enabled", () => {
    const data = localBusinessJsonLd(
      settingsWith({
        "contact.phone": "+91 98765 43210",
        "contact.addressLine1": "1 Example Road",
        "contact.city": "Chennai",
      }),
    );
    assert.equal(data, null, "must not publish LocalBusiness without explicit opt-in");
  });

  test("LocalBusiness stays null when enabled but the address is incomplete", () => {
    const data = localBusinessJsonLd(settingsWith({ "seo.enableLocalBusiness": "true" }));
    assert.equal(data, null, "must not publish an address that does not exist");
  });

  test("LocalBusiness is emitted once enabled and complete", () => {
    const data = localBusinessJsonLd(
      settingsWith({
        "seo.enableLocalBusiness": "true",
        "contact.phone": "+91 98765 43210",
        "contact.addressLine1": "1 Example Road",
        "contact.city": "Chennai",
      }),
    );
    assert.ok(data);
    assert.equal(data!["@type"], "LocalBusiness");
  });

  test("FAQPage is null when there are no questions", () => {
    assert.equal(faqJsonLd([]), null);
  });

  test("FAQPage strips markup out of answers", () => {
    const data = faqJsonLd([{ question: "Q?", answer: "<p>A <strong>yes</strong></p>" }]);
    const entity = (data!.mainEntity as Array<{ acceptedAnswer: { text: string } }>)[0]!;
    assert.equal(entity.acceptedAnswer.text, "A yes");
  });
});

describe("formatAddress", () => {
  test("returns nothing when only the default country is set", () => {
    // Rendering "India" alone would read as a broken address block.
    assert.deepEqual(formatAddress(settingsWith()), []);
  });

  test("composes the lines once a real address exists", () => {
    const lines = formatAddress(
      settingsWith({
        "contact.addressLine1": "1 Example Road",
        "contact.city": "Chennai",
        "contact.state": "Tamil Nadu",
        "contact.postalCode": "600001",
      }),
    );
    assert.deepEqual(lines, ["1 Example Road", "Chennai, Tamil Nadu", "600001 India"]);
  });
});

describe("settings catalogue", () => {
  test("setting keys are unique", () => {
    const keys = SETTING_DEFS.map((d) => d.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  test("no contact detail ships with a default value", () => {
    // The site must never publish a phone number or address that is not the
    // client's own, so these have to be empty until someone fills them in.
    for (const def of SETTING_DEFS) {
      if (def.group !== "contact") continue;
      if (def.key === "contact.country" || def.key === "contact.whatsappMessage") continue;
      assert.equal(def.default, "", `${def.key} must not ship with a default`);
    }
  });
});
