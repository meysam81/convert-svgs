import fs from "fs";
import path from "path";
import sharp from "sharp";
import type {
  KnownImagesMap,
  ImageConfig,
  SizeConfig,
  ConvertOptions,
  ParsedArgs,
} from "./types.js";

var KNOWN_IMAGES: KnownImagesMap = {
  favicon: {
    sizes: [16, 32, 48, 64, 128, 256],
    suffix: function suffix(size: SizeConfig): string {
      return "-" + size + "x" + size;
    },
  },
  "favicon-16x16": {
    sizes: [16],
    suffix: function suffix(): string {
      return "";
    },
    fallback: "favicon",
  },
  "favicon-32x32": {
    sizes: [32],
    suffix: function suffix(): string {
      return "";
    },
    fallback: "favicon",
  },
  "apple-touch-icon": {
    sizes: [180],
    suffix: function suffix(): string {
      return "";
    },
    fallback: "favicon",
  },
  "og-image": {
    sizes: [{ width: 1200, height: 630 }],
    suffix: function suffix(): string {
      return "";
    },
  },
  "twitter-image": {
    sizes: [{ width: 1200, height: 600 }],
    suffix: function suffix(): string {
      return "";
    },
  },
  "android-chrome-192x192": {
    sizes: [192],
    suffix: function suffix(): string {
      return "";
    },
    fallback: "favicon",
  },
  "android-chrome-512x512": {
    sizes: [512],
    suffix: function suffix(): string {
      return "";
    },
    fallback: "favicon",
  },
};

function log(message: string): void {
  process.stdout.write(message + "\n");
}

function logError(message: string): void {
  process.stderr.write(message + "\n");
}

function parseArgs(): ParsedArgs {
  var args = process.argv.slice(2);
  var directory = ".";
  var depth = -1;
  var verbose = false;

  for (var i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") {
      printHelp();
      process.exit(0);
    } else if (args[i] === "--version" || args[i] === "-v") {
      printVersion();
      process.exit(0);
    } else if (args[i] === "--verbose") {
      verbose = true;
    } else if (args[i].startsWith("--depth=")) {
      depth = parseInt(args[i].split("=")[1], 10);
    } else if (!args[i].startsWith("--")) {
      directory = args[i];
    }
  }

  return { directory: directory, depth: depth, verbose: verbose };
}

function printHelp(): void {
  log("convert-svgs - Convert SVG files to PNG with automatic sizing");
  log("");
  log("Usage: convert-svgs [directory] [options]");
  log("");
  log("Arguments:");
  log("  directory          Target directory to scan (default: ./public)");
  log("");
  log("Options:");
  log(
    "  --depth=<n>        Maximum directory depth to scan (-1 for unlimited)",
  );
  log("  --verbose          Enable verbose output");
  log("  -h, --help         Show this help message");
  log("  -v, --version      Show version number");
  log("");
  log("Supported automatic conversions:");
  log("  favicon.svg        -> Multiple sizes (16, 32, 48, 64, 128, 256)");
  log("  favicon-16x16.svg  -> 16x16 PNG");
  log("  favicon-32x32.svg  -> 32x32 PNG");
  log("  apple-touch-icon.svg -> 180x180 PNG");
  log("  og-image.svg       -> 1200x630 PNG");
  log("  twitter-image.svg  -> 1200x600 PNG");
  log("  android-chrome-*.svg -> Respective sizes");
  log("");
  log("Other SVG files are converted to PNG at original size.");
}

function printVersion(): void {
  var packageJsonPath = new URL("../package.json", import.meta.url);
  var pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  log(pkg.version);
}

function findSvgFiles(
  dir: string,
  currentDepth: number,
  maxDepth: number,
): string[] {
  var results: string[] = [];

  if (maxDepth !== -1 && currentDepth > maxDepth) {
    return results;
  }

  var entries = fs.readdirSync(dir, { withFileTypes: true });

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      var subResults = findSvgFiles(fullPath, currentDepth + 1, maxDepth);
      results = results.concat(subResults);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) {
      results.push(fullPath);
    }
  }

  return results;
}

function getBaseName(filePath: string): string {
  var fileName = path.basename(filePath);
  return fileName.replace(/\.svg$/i, "");
}

function getKnownImageConfig(baseName: string): ImageConfig | null {
  var lowerName = baseName.toLowerCase();
  for (var key in KNOWN_IMAGES) {
    if (lowerName === key.toLowerCase()) {
      return KNOWN_IMAGES[key];
    }
  }
  return null;
}

async function convertWithSize(
  svgPath: string,
  outputPath: string,
  sizeConfig: SizeConfig,
): Promise<void> {
  var sharpInstance = sharp(svgPath, { density: 300 });

  if (typeof sizeConfig === "number") {
    sharpInstance = sharpInstance.resize(sizeConfig, sizeConfig, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  } else if (typeof sizeConfig === "object") {
    sharpInstance = sharpInstance.resize(sizeConfig.width, sizeConfig.height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  await sharpInstance
    .png({
      compressionLevel: 9,
    })
    .toFile(outputPath);
}

async function convertSvgToPng(
  svgPath: string,
  verbose: boolean,
): Promise<void> {
  var baseName = getBaseName(svgPath);
  var dirName = path.dirname(svgPath);
  var config = getKnownImageConfig(baseName);

  try {
    if (config) {
      for (var i = 0; i < config.sizes.length; i++) {
        var sizeConfig = config.sizes[i];
        var suffix = config.suffix(sizeConfig);
        var outputName = baseName + suffix + ".png";
        var outputPath = path.join(dirName, outputName);

        await convertWithSize(svgPath, outputPath, sizeConfig);

        if (verbose) {
          var sizeLabel =
            typeof sizeConfig === "number"
              ? sizeConfig + "x" + sizeConfig
              : sizeConfig.width + "x" + sizeConfig.height;
          log("Created: " + outputPath + " (" + sizeLabel + ")");
        }
      }
    } else {
      var pngPath = svgPath.replace(/\.svg$/i, ".png");
      await sharp(svgPath, { density: 300 })
        .png({
          compressionLevel: 9,
        })
        .toFile(pngPath);

      if (verbose) {
        log("Created: " + pngPath);
      }
    }
  } catch (err) {
    var errorMessage = err instanceof Error ? err.message : String(err);
    logError("Error processing file " + svgPath + ": " + errorMessage);
  }
}

function findFallbackSource(dir: string, fallbackName: string): string | null {
  var fallbackPath = path.join(dir, fallbackName + ".svg");
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }
  return null;
}

function getMissingKnownImages(
  dir: string,
  existingFiles: string[],
): Array<{ name: string; config: ImageConfig; sourcePath: string }> {
  var results: Array<{
    name: string;
    config: ImageConfig;
    sourcePath: string;
  }> = [];
  var existingBaseNames = existingFiles.map(function mapToBaseName(f) {
    return getBaseName(f).toLowerCase();
  });

  for (var key in KNOWN_IMAGES) {
    var config = KNOWN_IMAGES[key];
    if (!config.fallback) {
      continue;
    }

    var lowerKey = key.toLowerCase();
    if (existingBaseNames.indexOf(lowerKey) !== -1) {
      continue;
    }

    var fallbackSource = findFallbackSource(dir, config.fallback);
    if (fallbackSource) {
      results.push({
        name: key,
        config: config,
        sourcePath: fallbackSource,
      });
    }
  }

  return results;
}

async function generateFromFallback(
  sourcePath: string,
  outputDir: string,
  targetName: string,
  config: ImageConfig,
  verbose: boolean,
): Promise<void> {
  try {
    for (var i = 0; i < config.sizes.length; i++) {
      var sizeConfig = config.sizes[i];
      var suffix = config.suffix(sizeConfig);
      var outputName = targetName + suffix + ".png";
      var outputPath = path.join(outputDir, outputName);

      await convertWithSize(sourcePath, outputPath, sizeConfig);

      if (verbose) {
        var sizeLabel =
          typeof sizeConfig === "number"
            ? sizeConfig + "x" + sizeConfig
            : sizeConfig.width + "x" + sizeConfig.height;
        log(
          "Created: " +
            outputPath +
            " (" +
            sizeLabel +
            ") [from " +
            path.basename(sourcePath) +
            "]",
        );
      }
    }
  } catch (err) {
    var errorMessage = err instanceof Error ? err.message : String(err);
    logError(
      "Error generating " + targetName + " from fallback: " + errorMessage,
    );
  }
}

async function convert(
  directory: string,
  options?: ConvertOptions,
): Promise<string[]> {
  var opts = options || {};
  var depth = typeof opts.depth === "number" ? opts.depth : -1;
  var verbose = opts.verbose || false;
  var resolvedDir = path.resolve(directory);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error("Directory not found: " + resolvedDir);
  }

  var svgFiles = findSvgFiles(resolvedDir, 0, depth);

  if (svgFiles.length === 0) {
    if (verbose) {
      log("No SVG files found in " + resolvedDir);
    }
    return [];
  }

  if (verbose) {
    log("Found " + svgFiles.length + " SVG file(s)");
  }

  for (var i = 0; i < svgFiles.length; i++) {
    await convertSvgToPng(svgFiles[i], verbose);
  }

  var missingImages = getMissingKnownImages(resolvedDir, svgFiles);
  if (missingImages.length > 0 && verbose) {
    log("Generating " + missingImages.length + " image(s) from fallbacks");
  }

  for (var j = 0; j < missingImages.length; j++) {
    var missing = missingImages[j];
    await generateFromFallback(
      missing.sourcePath,
      resolvedDir,
      missing.name,
      missing.config,
      verbose,
    );
  }

  return svgFiles;
}

async function run(): Promise<void> {
  var config = parseArgs();
  var resolvedDir = path.resolve(config.directory);

  if (!fs.existsSync(resolvedDir)) {
    logError("Directory not found: " + resolvedDir);
    process.exit(1);
  }

  try {
    var files = await convert(config.directory, {
      depth: config.depth,
      verbose: config.verbose,
    });

    if (config.verbose && files.length > 0) {
      log("Conversion complete!");
    }
  } catch (err) {
    var errorMessage = err instanceof Error ? err.message : String(err);
    logError("Error: " + errorMessage);
    process.exit(1);
  }
}

export { convert, run, KNOWN_IMAGES };
export default convert;
