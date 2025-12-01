import { test } from "node:test";
import assert from "node:assert";
import { KNOWN_IMAGES } from "../bin/convert-svgs.js";

test("KNOWN_IMAGES contains expected keys", function testKnownImagesKeys() {
  var expectedKeys = [
    "favicon",
    "favicon-16x16",
    "favicon-32x32",
    "apple-touch-icon",
    "og-image",
    "twitter-image",
    "android-chrome-192x192",
    "android-chrome-512x512",
  ];

  for (var i = 0; i < expectedKeys.length; i++) {
    assert.ok(KNOWN_IMAGES[expectedKeys[i]], "Missing key: " + expectedKeys[i]);
  }
});

test("favicon config has correct sizes", function testFaviconSizes() {
  var config = KNOWN_IMAGES.favicon;
  assert.deepStrictEqual(config.sizes, [16, 32, 48, 64, 128, 256]);
});

test("favicon suffix function works correctly", function testFaviconSuffix() {
  var config = KNOWN_IMAGES.favicon;
  assert.strictEqual(config.suffix(16), "-16x16");
  assert.strictEqual(config.suffix(32), "-32x32");
});

test("og-image has correct dimensions", function testOgImageDimensions() {
  var config = KNOWN_IMAGES["og-image"];
  assert.strictEqual(config.sizes[0].width, 1200);
  assert.strictEqual(config.sizes[0].height, 630);
});

test("twitter-image has correct dimensions", function testTwitterImageDimensions() {
  var config = KNOWN_IMAGES["twitter-image"];
  assert.strictEqual(config.sizes[0].width, 1200);
  assert.strictEqual(config.sizes[0].height, 600);
});
