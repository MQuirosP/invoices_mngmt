import sharp from "sharp";

export const preprocessImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize({ width: 1500 })
    .grayscale()
    .linear(1.2, -10)
    .threshold(150)
    .toBuffer();
};
