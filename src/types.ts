export interface RectangularSize {
  width: number;
  height: number;
}

export type SizeConfig = number | RectangularSize;

export interface ImageConfig {
  sizes: SizeConfig[];
  suffix: (size: SizeConfig) => string;
  fallback?: string;
}

export interface KnownImagesMap {
  [key: string]: ImageConfig;
}

export interface ConvertOptions {
  depth?: number;
  verbose?: boolean;
}

export interface ParsedArgs {
  directory: string;
  depth: number;
  verbose: boolean;
}
