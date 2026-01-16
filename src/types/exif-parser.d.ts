declare module 'exif-parser' {
  interface ExifTags {
    ImageDescription?: string;
    [key: string]: unknown;
  }

  interface ExifResult {
    tags: ExifTags;
  }

  interface ExifParser {
    parse(): ExifResult;
  }

  function create(buffer: Buffer): ExifParser;
  export = { create };
}
