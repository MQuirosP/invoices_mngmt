export const getFileExtension = (path: string): string | null => {
  try {
    const cleanPath = path.split("?")[0];
    const parts = cleanPath.split("/");
    const fileName = parts[parts.length - 1];
    const ext = fileName.includes(".") ? fileName.split(".").pop() : null;

    if (ext && /^[a-zA-Z0-9]+$/.test(ext)) {
      return ext.toLowerCase();
    }

    return null;
  } catch (error) {
    console.error("Error extracting file extension from path:", path);
    return null;
  }
};
