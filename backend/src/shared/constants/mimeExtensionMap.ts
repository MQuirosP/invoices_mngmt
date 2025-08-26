export type MimeMetadata = {
  ext: string;
  label: string;
  safe: boolean;
};

export const MimeConfig = {
  metadata: {
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
    "application/octet-stream": {
      ext: "bin",
      label: "Binary Stream",
      safe: false,
    },
  } as Record<string, MimeMetadata>,

  getExtension: (mime: string): string | undefined =>
    MimeConfig.metadata[mime]?.ext,

  getMimeFromExt: (ext: string): string | undefined =>
    Object.entries(MimeConfig.metadata).find(
      ([, meta]) => meta.ext === ext
    )?.[0],

  isSafe: (mime: string): boolean => MimeConfig.metadata[mime]?.safe === true,

  safeTypes: (): string[] =>
    Object.keys(MimeConfig.metadata).filter(
      (mime) => MimeConfig.metadata[mime].safe
    ),
};
