import { test, expect, describe } from "bun:test";
import { KNOWN_IMAGES } from "../src/convert-svgs.js";
import type { ImageConfig, SizeConfig, RectangularSize } from "../src/types.js";

describe("ImageConfig structure", function testImageConfigStructure() {
  test("all known images have required properties", function testRequiredProps() {
    for (var key in KNOWN_IMAGES) {
      var config: ImageConfig = KNOWN_IMAGES[key];
      expect(Array.isArray(config.sizes)).toBe(true);
      expect(typeof config.suffix).toBe("function");
    }
  });

  test("sizes are either numbers or RectangularSize objects", function testSizeTypes() {
    for (var key in KNOWN_IMAGES) {
      var config = KNOWN_IMAGES[key];
      for (var i = 0; i < config.sizes.length; i++) {
        var size: SizeConfig = config.sizes[i];
        var isNumber = typeof size === "number";
        var isRectangular =
          typeof size === "object" && "width" in size && "height" in size;
        expect(isNumber || isRectangular).toBe(true);
      }
    }
  });

  test("rectangular sizes have positive dimensions", function testPositiveDimensions() {
    for (var key in KNOWN_IMAGES) {
      var config = KNOWN_IMAGES[key];
      for (var i = 0; i < config.sizes.length; i++) {
        var size = config.sizes[i];
        if (typeof size === "object") {
          var rectSize = size as RectangularSize;
          expect(rectSize.width).toBeGreaterThan(0);
          expect(rectSize.height).toBeGreaterThan(0);
        }
      }
    }
  });

  test("square sizes are positive numbers", function testPositiveSquareSizes() {
    for (var key in KNOWN_IMAGES) {
      var config = KNOWN_IMAGES[key];
      for (var i = 0; i < config.sizes.length; i++) {
        var size = config.sizes[i];
        if (typeof size === "number") {
          expect(size).toBeGreaterThan(0);
        }
      }
    }
  });

  test("suffix function returns string", function testSuffixReturnsString() {
    for (var key in KNOWN_IMAGES) {
      var config = KNOWN_IMAGES[key];
      var size = config.sizes[0];
      var suffix = config.suffix(size);
      expect(typeof suffix).toBe("string");
    }
  });
});

describe("fallback configuration", function testFallbackConfig() {
  test("fallback references exist in KNOWN_IMAGES", function testFallbackExists() {
    for (var key in KNOWN_IMAGES) {
      var config = KNOWN_IMAGES[key];
      if (config.fallback) {
        expect(KNOWN_IMAGES[config.fallback]).toBeDefined();
      }
    }
  });

  test("favicon has no fallback", function testFaviconNoFallback() {
    expect(KNOWN_IMAGES["favicon"].fallback).toBeUndefined();
  });

  test("og-image has no fallback", function testOgImageNoFallback() {
    expect(KNOWN_IMAGES["og-image"].fallback).toBeUndefined();
  });

  test("twitter-image has no fallback", function testTwitterImageNoFallback() {
    expect(KNOWN_IMAGES["twitter-image"].fallback).toBeUndefined();
  });
});
