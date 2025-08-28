import sharp from "sharp";

type PreprocessOptions = {
  enhanceContrast?: boolean;
  upscale?: boolean;
};

export const preprocessImage = async (
  buffer: Buffer,
  opts: PreprocessOptions = {}
): Promise<Buffer> => {
  let pipeline = sharp(buffer);

  if (opts.upscale) {
    pipeline = pipeline.resize({ width: 2000 });
  } else {
    pipeline = pipeline.resize({ width: 1500 });
  }

  pipeline = pipeline.grayscale();

  if (opts.enhanceContrast) {
    pipeline = pipeline.linear(1.5, -5);
  } else {
    pipeline = pipeline.linear(1.2, -10);
  }

  return pipeline.threshold(150).toBuffer();
};
