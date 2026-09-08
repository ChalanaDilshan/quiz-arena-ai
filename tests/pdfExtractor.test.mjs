import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// ── Polyfills for Node.js test environment (Node 20 compatibility) ───────────
if (typeof globalThis.Iterator === 'undefined') {
  globalThis.Iterator = function () {};
  globalThis.Iterator.prototype = {};
}
if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
if (!Promise.try) {
  Promise.try = function (fn, ...args) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (!Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    return Array.from(this)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

// ── Transpile and load src/utils/pdfExtractor.ts ──────────────────────────────
const projectRoot = process.cwd();
const srcFile = path.join(projectRoot, 'src', 'utils', 'pdfExtractor.ts');
const cacheDir = path.join(projectRoot, 'node_modules', '.cache-test');
const outJs = path.join(cacheDir, 'pdfExtractor.mjs');

fs.mkdirSync(cacheDir, { recursive: true });
const tsSource = fs.readFileSync(srcFile, 'utf8');
const { outputText } = ts.transpileModule(tsSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
fs.writeFileSync(outJs, outputText, 'utf8');

const { extractTextFromPdf } = await import(`file://${outJs.replace(/\\/g, '/')}`);

// ── Helpers: Construct Valid PDF Binaries ─────────────────────────────────────

function createPdfWithText(pagesText) {
  // Generates a valid minimal PDF 1.4 with Helvetia text streams for each page in pagesText array
  const objects = [];
  let currentObjId = 1;

  const catalogId = currentObjId++;
  const pagesRootId = currentObjId++;
  const fontId = currentObjId++;

  const pageIds = [];
  const contentIds = [];

  for (let i = 0; i < pagesText.length; i++) {
    pageIds.push(currentObjId++);
    contentIds.push(currentObjId++);
  }

  // Font object (Type 1 Helvetica)
  const fontObj = `${fontId} 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj\n`;

  // Page and Content objects
  const pageAndContentObjs = [];
  for (let i = 0; i < pagesText.length; i++) {
    const text = pagesText[i];
    const streamContent = `BT /F1 12 Tf 72 712 Td (${text}) Tj ET\n`;
    const streamLength = Buffer.byteLength(streamContent, 'utf8');

    const contentObj = `${contentIds[i]} 0 obj\n<</Length ${streamLength}>>\nstream\n${streamContent}endstream\nendobj\n`;
    const pageObj = `${pageIds[i]} 0 obj\n<</Type/Page/Parent ${pagesRootId} 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 ${fontId} 0 R>>>>/Contents ${contentIds[i]} 0 R>>\nendobj\n`;

    pageAndContentObjs.push(pageObj, contentObj);
  }

  const kids = pageIds.map((id) => `${id} 0 R`).join(' ');
  const pagesRootObj = `${pagesRootId} 0 obj\n<</Type/Pages/Count ${pagesText.length}/Kids[${kids}]>>\nendobj\n`;
  const catalogObj = `${catalogId} 0 obj\n<</Type/Catalog/Pages ${pagesRootId} 0 R>>\nendobj\n`;

  // Assemble full PDF
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  const allObjStrings = [catalogObj, pagesRootObj, fontObj, ...pageAndContentObjs];

  for (const objStr of allObjStrings) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += objStr;
  }

  const startxref = Buffer.byteLength(pdf, 'utf8');
  const numObjects = offsets.length;

  pdf += `xref\n0 ${numObjects}\n0000000000 65535 f \n`;
  for (let i = 1; i < numObjects; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<</Size ${numObjects}/Root ${catalogId} 0 R>>\nstartxref\n${startxref}\n%%EOF`;
  return pdf;
}

// ── Test Cases ────────────────────────────────────────────────────────────────

test('extractTextFromPdf: extracts text from a single-page PDF with correct formatting and stats', async () => {
  const pdfString = createPdfWithText(['Distributed Systems Architecture and Fault Tolerance']);
  const file = new File([pdfString], 'distributed_systems.pdf', { type: 'application/pdf' });

  const result = await extractTextFromPdf(file);

  assert.equal(result.numPages, 1);
  assert.ok(result.text.includes('--- Page 1 ---'));
  assert.ok(result.text.includes('Distributed Systems Architecture and Fault Tolerance'));
  assert.equal(result.wordCount, 10); // '---', 'Page', '1', '---', + 6 words = 10 words
  assert.equal(result.charCount, result.text.length);
});

test('extractTextFromPdf: formats multi-page PDFs with separate page headers', async () => {
  const pages = [
    'Introduction to Operating Systems',
    'Virtual Memory Management and Paging',
    'Concurrency and Deadlock Prevention'
  ];
  const pdfString = createPdfWithText(pages);
  const file = new File([pdfString], 'operating_systems.pdf', { type: 'application/pdf' });

  const result = await extractTextFromPdf(file);

  assert.equal(result.numPages, 3);
  assert.ok(result.text.includes('--- Page 1 ---\nIntroduction to Operating Systems'));
  assert.ok(result.text.includes('--- Page 2 ---\nVirtual Memory Management and Paging'));
  assert.ok(result.text.includes('--- Page 3 ---\nConcurrency and Deadlock Prevention'));
  
  // Verifies double newline delimiter between pages
  assert.ok(result.text.includes('\n\n--- Page 2 ---'));
  assert.ok(result.text.includes('\n\n--- Page 3 ---'));
});

test('extractTextFromPdf: respects maxPages limit while preserving accurate total numPages', async () => {
  const pages = [
    'Module 1: Foundations',
    'Module 2: Core Concepts',
    'Module 3: Advanced Topics',
    'Module 4: Case Studies'
  ];
  const pdfString = createPdfWithText(pages);
  const file = new File([pdfString], 'full_syllabus.pdf', { type: 'application/pdf' });

  // Cap extraction at 2 pages
  const result = await extractTextFromPdf(file, 2);

  assert.equal(result.numPages, 4, 'numPages should still report total document page count');
  assert.ok(result.text.includes('--- Page 1 ---'));
  assert.ok(result.text.includes('--- Page 2 ---'));
  assert.ok(!result.text.includes('--- Page 3 ---'), 'Page 3 should not be extracted when maxPages is 2');
  assert.ok(!result.text.includes('--- Page 4 ---'), 'Page 4 should not be extracted when maxPages is 2');
});

test('extractTextFromPdf: accurately calculates word count across complex whitespace and punctuation', async () => {
  const text = 'Algorithm   Design   \t\n   Analysis   and   Dynamic    Programming';
  const pdfString = createPdfWithText([text]);
  const file = new File([pdfString], 'algorithms.pdf', { type: 'application/pdf' });

  const result = await extractTextFromPdf(file);

  // '---' 'Page' '1' '---' (4 words) + 'Algorithm' 'Design' 'Analysis' 'and' 'Dynamic' 'Programming' (6 words) = 10 words
  assert.equal(result.wordCount, 10);
  assert.equal(result.charCount, result.text.length);
});

test('extractTextFromPdf: handles empty/whitespace-only pages without injecting empty page headers', async () => {
  const pages = ['   ', 'Actual Content on Page 2'];
  const pdfString = createPdfWithText(pages);
  const file = new File([pdfString], 'whitespace_page.pdf', { type: 'application/pdf' });

  const result = await extractTextFromPdf(file);

  assert.equal(result.numPages, 2);
  assert.ok(!result.text.includes('--- Page 1 ---'), 'Empty page 1 should not have a section header');
  assert.ok(result.text.includes('--- Page 2 ---\nActual Content on Page 2'));
});

test('extractTextFromPdf: rejects non-PDF or corrupt files with an error', async () => {
  const invalidData = 'This is a plain text file pretending to be a PDF';
  const file = new File([invalidData], 'invalid.pdf', { type: 'application/pdf' });

  await assert.rejects(
    async () => {
      await extractTextFromPdf(file);
    },
    (err) => {
      assert.ok(err);
      return true;
    }
  );
});
