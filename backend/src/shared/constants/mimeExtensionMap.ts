export const mimeExtensionMap: Record<string, string> = {
  "application/pdf": "pdf",
  "application/xml": "xml",
  "text/xml": "xml",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export const extensionMimeMap: Record<string, string> = Object.entries(mimeExtensionMap)
  .reduce((acc, [mime, ext]) => {
    acc[ext] = mime;
    return acc;
  }, {} as Record<string, string>);
