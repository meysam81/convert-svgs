import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { convert, KNOWN_IMAGES } from "../src/convert-svgs.js";

var TEST_DIR = path.join(import.meta.dir, "fixtures");

function createTestSvg(width: number, height: number): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    width +
    '" height="' +
    height +
    '" viewBox="0 0 ' +
    width +
    " " +
    height +
    '"><rect width="' +
    width +
    '" height="' +
    height +
    '" fill="red"/></svg>'
  );
}

function setupTestDirectory(): void {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function cleanupTestDirectory(): void {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

describe("KNOWN_IMAGES configuration", function testKnownImagesConfig() {
  test("favicon has correct sizes", function testFaviconSizes() {
    var config = KNOWN_IMAGES["favicon"];
    expect(config.sizes).toEqual([16, 32, 48, 64, 128, 256]);
  });

  test("favicon suffix generates correct format", function testFaviconSuffix() {
    var config = KNOWN_IMAGES["favicon"];
    expect(config.suffix(16)).toBe("-16x16");
    expect(config.suffix(32)).toBe("-32x32");
  });

  test("og-image has correct dimensions", function testOgImageDimensions() {
    var config = KNOWN_IMAGES["og-image"];
    expect(config.sizes).toEqual([{ width: 1200, height: 630 }]);
  });

  test("twitter-image has correct dimensions", function testTwitterImageDimensions() {
    var config = KNOWN_IMAGES["twitter-image"];
    expect(config.sizes).toEqual([{ width: 1200, height: 600 }]);
  });

  test("apple-touch-icon has fallback to favicon", function testAppleTouchIconFallback() {
    var config = KNOWN_IMAGES["apple-touch-icon"];
    expect(config.fallback).toBe("favicon");
    expect(config.sizes).toEqual([180]);
  });

  test("android-chrome icons have fallback to favicon", function testAndroidChromeFallback() {
    expect(KNOWN_IMAGES["android-chrome-192x192"].fallback).toBe("favicon");
    expect(KNOWN_IMAGES["android-chrome-512x512"].fallback).toBe("favicon");
  });

  test("favicon-16x16 has empty suffix", function testFavicon16Suffix() {
    var config = KNOWN_IMAGES["favicon-16x16"];
    expect(config.suffix(16)).toBe("");
  });
});

describe("convert function", function testConvertFunction() {
  beforeAll(function setup() {
    setupTestDirectory();
  });

  afterAll(function cleanup() {
    cleanupTestDirectory();
  });

  test("throws error for non-existent directory", async function testNonExistentDir() {
    var nonExistentPath = path.join(TEST_DIR, "does-not-exist");
    await expect(convert(nonExistentPath)).rejects.toThrow(
      "Directory not found",
    );
  });

  test("returns empty array when no SVG files found", async function testNoSvgFiles() {
    var emptyDir = path.join(TEST_DIR, "empty");
    fs.mkdirSync(emptyDir, { recursive: true });

    var result = await convert(emptyDir);
    expect(result).toEqual([]);
  });

  test("converts basic SVG to PNG", async function testBasicConversion() {
    var svgDir = path.join(TEST_DIR, "basic");
    fs.mkdirSync(svgDir, { recursive: true });

    var svgPath = path.join(svgDir, "test-icon.svg");
    fs.writeFileSync(svgPath, createTestSvg(100, 100));

    var result = await convert(svgDir);
    expect(result).toHaveLength(1);

    var pngPath = path.join(svgDir, "test-icon.png");
    expect(fs.existsSync(pngPath)).toBe(true);
  });

  test("converts favicon.svg to multiple sizes", async function testFaviconConversion() {
    var svgDir = path.join(TEST_DIR, "favicon-test");
    fs.mkdirSync(svgDir, { recursive: true });

    var svgPath = path.join(svgDir, "favicon.svg");
    fs.writeFileSync(svgPath, createTestSvg(256, 256));

    await convert(svgDir);

    var expectedFiles = [
      "favicon-16x16.png",
      "favicon-32x32.png",
      "favicon-48x48.png",
      "favicon-64x64.png",
      "favicon-128x128.png",
      "favicon-256x256.png",
    ];

    for (var i = 0; i < expectedFiles.length; i++) {
      var expectedPath = path.join(svgDir, expectedFiles[i]);
      expect(fs.existsSync(expectedPath)).toBe(true);
    }
  });

  test("converts og-image.svg to correct dimensions", async function testOgImageConversion() {
    var svgDir = path.join(TEST_DIR, "og-test");
    fs.mkdirSync(svgDir, { recursive: true });

    var svgPath = path.join(svgDir, "og-image.svg");
    fs.writeFileSync(svgPath, createTestSvg(1200, 630));

    await convert(svgDir);

    var pngPath = path.join(svgDir, "og-image.png");
    expect(fs.existsSync(pngPath)).toBe(true);
  });

  test("respects depth option", async function testDepthOption() {
    var svgDir = path.join(TEST_DIR, "depth-test");
    var nestedDir = path.join(svgDir, "level1", "level2");
    fs.mkdirSync(nestedDir, { recursive: true });

    fs.writeFileSync(path.join(svgDir, "root.svg"), createTestSvg(50, 50));
    fs.writeFileSync(
      path.join(svgDir, "level1", "nested.svg"),
      createTestSvg(50, 50),
    );
    fs.writeFileSync(path.join(nestedDir, "deep.svg"), createTestSvg(50, 50));

    var result = await convert(svgDir, { depth: 1 });

    expect(result).toHaveLength(2);
    expect(fs.existsSync(path.join(svgDir, "root.png"))).toBe(true);
    expect(fs.existsSync(path.join(svgDir, "level1", "nested.png"))).toBe(true);
    expect(fs.existsSync(path.join(nestedDir, "deep.png"))).toBe(false);
  });

  test("generates fallback images from favicon.svg", async function testFallbackGeneration() {
    var svgDir = path.join(TEST_DIR, "fallback-test");
    fs.mkdirSync(svgDir, { recursive: true });

    var svgPath = path.join(svgDir, "favicon.svg");
    fs.writeFileSync(svgPath, createTestSvg(256, 256));

    await convert(svgDir);

    expect(fs.existsSync(path.join(svgDir, "apple-touch-icon.png"))).toBe(true);
    expect(fs.existsSync(path.join(svgDir, "android-chrome-192x192.png"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(svgDir, "android-chrome-512x512.png"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(svgDir, "favicon-16x16.png"))).toBe(true);
    expect(fs.existsSync(path.join(svgDir, "favicon-32x32.png"))).toBe(true);
  });

  test("does not generate fallback if specific SVG exists", async function testNoFallbackWhenExists() {
    var svgDir = path.join(TEST_DIR, "no-fallback-test");
    fs.mkdirSync(svgDir, { recursive: true });

    fs.writeFileSync(path.join(svgDir, "favicon.svg"), createTestSvg(256, 256));
    fs.writeFileSync(
      path.join(svgDir, "apple-touch-icon.svg"),
      createTestSvg(180, 180),
    );

    await convert(svgDir);

    var files = fs.readdirSync(svgDir);
    var appleTouchPngs = files.filter(function filterAppleTouch(f) {
      return f.startsWith("apple-touch-icon") && f.endsWith(".png");
    });

    expect(appleTouchPngs).toHaveLength(1);
    expect(appleTouchPngs[0]).toBe("apple-touch-icon.png");
  });

  test("handles case-insensitive file matching", async function testCaseInsensitive() {
    var svgDir = path.join(TEST_DIR, "case-test");
    fs.mkdirSync(svgDir, { recursive: true });

    fs.writeFileSync(path.join(svgDir, "FAVICON.SVG"), createTestSvg(256, 256));

    var result = await convert(svgDir);
    expect(result).toHaveLength(1);

    expect(fs.existsSync(path.join(svgDir, "FAVICON-16x16.png"))).toBe(true);
  });
});

describe("verbose option", function testVerboseOption() {
  beforeAll(function setup() {
    setupTestDirectory();
  });

  afterAll(function cleanup() {
    cleanupTestDirectory();
  });

  test("convert works with verbose enabled", async function testVerboseConvert() {
    var svgDir = path.join(TEST_DIR, "verbose-test");
    fs.mkdirSync(svgDir, { recursive: true });

    fs.writeFileSync(path.join(svgDir, "test.svg"), createTestSvg(100, 100));

    var result = await convert(svgDir, { verbose: true });
    expect(result).toHaveLength(1);
  });
});
