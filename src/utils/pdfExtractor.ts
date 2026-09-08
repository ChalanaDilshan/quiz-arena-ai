import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Vite browser environment with safe fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  wordCount: number;
  charCount: number;
}

/**
 * Extract clean, full text content from an uploaded PDF file using pdfjs-dist.
 * Iterates through all document pages, extracts text items, and returns
 * structured content suitable for LLM quiz generation.
 */
export async function extractTextFromPdf(
  file: File,
  maxPages: number = 30
): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pagesToExtract = Math.min(pdf.numPages, maxPages);
  const textChunks: string[] = [];

  for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ');

      if (pageText.trim()) {
        textChunks.push(`--- Page ${pageNum} ---\n${pageText.trim()}`);
      }
    } catch (pageErr) {
      console.warn(`[PDFExtractor] Could not extract text from page ${pageNum}:`, pageErr);
    }
  }

  const fullText = textChunks.join('\n\n');
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    text: fullText,
    numPages: pdf.numPages,
    wordCount,
    charCount: fullText.length,
  };
}
