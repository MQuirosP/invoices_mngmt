// reconstructLinesFromAnnotation.ts
type Word = {
  text: string;
  x: number;
  y: number;
  confidence: number;
};

export function extractWordsFromAnnotation(annotation: any): Word[] {
  const words: Word[] = [];

  for (const page of annotation.pages) {
    for (const block of page.blocks) {
      for (const paragraph of block.paragraphs) {
        for (const word of paragraph.words) {
          const text = word.symbols.map((s: any) => s.text).join("");
          const x = word.boundingBox.vertices[0].x ?? 0;
          const y = word.boundingBox.vertices[0].y ?? 0;
          const confidence = word.confidence ?? 1;

          words.push({ text, x, y, confidence });
        }
      }
    }
  }

  return words;
}

export function reconstructLinesFromWords(words: Word[], yTolerance = 10): string[] {
  const lines: Word[][] = [];

  for (const word of words) {
    if (word.confidence < 0.6) continue;

    const line = lines.find((l) => Math.abs(l[0].y - word.y) < yTolerance);
    if (line) {
      line.push(word);
    } else {
      lines.push([word]);
    }
  }

  return lines
    .map((line) =>
      line
        .sort((a, b) => a.x - b.x)
        .map((w) => w.text)
        .join(" ")
        .trim()
    )
    .filter(Boolean);
}