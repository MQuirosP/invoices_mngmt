export const mimeMetadataMap: Record<
  string,
  { ext: string; label: string; safe: boolean }
> = {
  "application/pdf": { ext: "pdf", label: "PDF", safe: true },
  "application/xml": { ext: "xml", label: "XML (application)", safe: true },
  "text/xml": { ext: "xml", label: "XML (text)", safe: true },
  "image/jpeg": { ext: "jpg", label: "JPEG", safe: true },
  "image/png": { ext: "png", label: "PNG", safe: true },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    label: "Word DOCX",
    safe: true,
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    ext: "xlsx",
    label: "Excel XLSX",
    safe: true,
  },
  // Insecure generic MIME types
  "application/octet-stream": {
    ext: "bin",
    label: "Binary Stream",
    safe: false,
  },
};

export const mimeExtensionMap: Record<string, string> = Object.fromEntries(
  Object.entries(mimeMetadataMap).map(([mime, meta]) => [mime, meta.ext])
);

export const extensionMimeMap: Record<string, string> = Object.fromEntries(
  Object.entries(mimeMetadataMap).map(([mime, meta]) => [meta.ext, mime])
);

export const safeMimeTypes = Object.keys(mimeMetadataMap).filter(
  (mime) => mimeMetadataMap[mime].safe
);
