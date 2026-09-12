import * as pdfjsLib from 'pdfjs-dist';

// ── Polyfills for modern ES features required by pdfjs-dist v6 in all browsers ──
if (typeof globalThis !== 'undefined') {
  if (typeof (Uint8Array.prototype as any).toHex === 'undefined') {
    (Uint8Array.prototype as any).toHex = function () {
      return Array.from(this as Uint8Array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };
  }
  if (typeof (Promise as any).withResolvers === 'undefined') {
    (Promise as any).withResolvers = function () {
      let resolve: any, reject: any;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
  if (typeof (Promise as any).try === 'undefined') {
    (Promise as any).try = function (fn: any, ...args: any[]) {
      return new Promise((resolve) => resolve(fn(...args)));
    };
  }
}

// ── Configure worker for Vite browser environment ────────────────────────────
if (typeof window !== 'undefined') {
  try {
    // 1. Pre-register in-process worker handler if importable
    // @ts-ignore
    import('pdfjs-dist/build/pdf.worker.mjs')
      .then((workerModule) => {
        (window as any).pdfjsWorker = workerModule;
      })
      .catch(() => {});
  } catch {}

  try {
    // 2. Point GlobalWorkerOptions to Vite-bundled worker URL
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;
  }
}

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  wordCount: number;
  charCount: number;
}

/**
 * Fallback regex extractor for uncompressed PDF text operators: (text) Tj, [(t)(ext)] TJ
 * Used as a zero-dependency safety net if Web Worker / pdfjs stream fails.
 */
function extractRawTextFromPdfBuffer(buffer: ArrayBuffer): { text: string; wordCount: number } {
  try {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(bytes);

    const textPieces: string[] = [];
    const tjRegex = /\(([^)\r\n]+)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(raw)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 0 && !/^[\x00-\x1F\x7F]+$/.test(clean)) {
        textPieces.push(clean);
      }
    }

    if (textPieces.length > 0) {
      const text = textPieces.join(' ');
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return { text, wordCount };
    }
  } catch (err) {
    console.warn('[PDFExtractor] Raw text stream fallback notice:', err);
  }
  return { text: '', wordCount: 0 };
}

/**
 * Extract clean, full text content from an uploaded PDF file using pdfjs-dist.
 * Iterates through document pages, extracts text items, and returns
 * structured content suitable for LLM quiz generation.
 */
export async function extractTextFromPdf(
  file: File,
  maxPages: number = 30
): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Validate PDF magic bytes (%PDF)
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
  const header = String.fromCharCode(...headerBytes);
  if (!header.startsWith('%PDF')) {
    throw new Error('Invalid file: does not have valid %PDF header signature.');
  }

  // Preserve clone of arrayBuffer before pdfjs transfers/detaches it
  const backupBuffer = arrayBuffer.slice(0);

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    const pagesToExtract = Math.min(pdf.numPages, maxPages);
    const textChunks: string[] = [];

    for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => {
            if ('str' in item) {
              return item.str + ((item as any).hasEOL ? '\n' : ' ');
            }
            return '';
          })
          .join('')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s+/g, '\n')
          .trim();

        if (pageText) {
          textChunks.push(`--- Page ${pageNum} ---\n${pageText}`);
        }
      } catch (pageErr) {
        console.warn(`[PDFExtractor] Could not extract text from page ${pageNum}:`, pageErr);
      }
    }

    const fullText = textChunks.join('\n\n');
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    // If PDF.js produced readable text, return it
    if (wordCount > 0) {
      return {
        text: fullText,
        numPages: pdf.numPages,
        wordCount,
        charCount: fullText.length,
      };
    }

    // If PDF.js succeeded but found 0 words, check raw text streams
    const rawFallback = extractRawTextFromPdfBuffer(backupBuffer);
    if (rawFallback.wordCount > 0) {
      return {
        text: rawFallback.text,
        numPages: pdf.numPages,
        wordCount: rawFallback.wordCount,
        charCount: rawFallback.text.length,
      };
    }

    return {
      text: fullText,
      numPages: pdf.numPages,
      wordCount: 0,
      charCount: fullText.length,
    };
  } catch (pdfErr: any) {
    if (pdfErr?.name === 'InvalidPDFException' || pdfErr?.message?.includes('Invalid PDF')) {
      throw pdfErr;
    }
    console.warn('[PDFExtractor] PDF.js extraction notice, engaging raw parser:', pdfErr);
    const rawFallback = extractRawTextFromPdfBuffer(backupBuffer);
    return {
      text: rawFallback.text,
      numPages: 1,
      wordCount: rawFallback.wordCount,
      charCount: rawFallback.text.length,
    };
  }
}
