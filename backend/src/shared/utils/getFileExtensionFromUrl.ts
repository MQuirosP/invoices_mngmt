export const getFileExtensionFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastSegment = pathname.split("/").pop() || "";

    // Remove query string if present and split extension
    const cleanName = lastSegment.split("?")[0];
    const ext = cleanName.includes(".") ? cleanName.split(".").pop() : null;

    if (ext && /^[a-zA-Z0-9]+$/.test(ext)) {
      return ext.toLowerCase();
    }

    return null;
  } catch (error) {
    console.error("Invalid URL in getFileExtensionFromUrl:", url);
    return null;
  }
};
