# convert-svgs

[![npm version](https://img.shields.io/npm/v/convert-svgs.svg)](https://www.npmjs.com/package/convert-svgs)
[![npm downloads](https://img.shields.io/npm/dm/convert-svgs.svg)](https://www.npmjs.com/package/convert-svgs)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js CI](https://github.com/meysam/convert-svgs/actions/workflows/ci.yml/badge.svg)](https://github.com/meysam/convert-svgs/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/node/v/convert-svgs.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**One SVG. All the PNGs you need. Zero config.**

Drop a `favicon.svg` in your project. Run one command. Get every favicon size, apple-touch-icon, android chrome icons — all generated automatically.

## Quickstart

```bash
npx convert-svgs ./public
```

That's it.

## What just happened?

```
public/
├── favicon.svg           → favicon-16x16.png, favicon-32x32.png, ...
├── og-image.svg          → og-image.png (1200x630)
└── any-other.svg         → any-other.png (original size)
```

## Auto-detected files

| Your SVG file                | Generated PNG(s)                       |
| ---------------------------- | -------------------------------------- |
| `favicon.svg`                | 16, 32, 48, 64, 128, 256px (all sizes) |
| `favicon-16x16.svg`          | 16x16                                  |
| `favicon-32x32.svg`          | 32x32                                  |
| `apple-touch-icon.svg`       | 180x180                                |
| `og-image.svg`               | 1200x630                               |
| `twitter-image.svg`          | 1200x600                               |
| `android-chrome-192x192.svg` | 192x192                                |
| `android-chrome-512x512.svg` | 512x512                                |

**Bonus:** Missing `favicon-16x16.svg`? If you have `favicon.svg`, we'll generate it for you.

## CLI

```bash
convert-svgs [directory] [options]

Options:
  --depth=<n>   Max directory depth (-1 = unlimited)
  --verbose     Show detailed output
  -h, --help    Help
  -v, --version Version
```

## Programmatic API

```javascript
var convertSvgs = require("convert-svgs");

convertSvgs.convert("./public", { depth: 2, verbose: true });
```

## Install globally

```bash
npm install -g convert-svgs
```

## Why?

- **No config files.** Name your SVGs right, get the right output.
- **No manual resizing.** One source SVG, all target sizes.
- **No build step plugins.** Just run it.

## Requirements

Node.js >= 18

## License

Apache-2.0
