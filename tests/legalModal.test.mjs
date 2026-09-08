import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Transpile and load src/components/LegalModal.tsx ──────────────────────────
const projectRoot = process.cwd();
const srcFile = path.join(projectRoot, 'src', 'components', 'LegalModal.tsx');
const cacheDir = path.join(projectRoot, 'node_modules', '.cache-test');
const outJs = path.join(cacheDir, 'LegalModal.mjs');

fs.mkdirSync(cacheDir, { recursive: true });
const tsxSource = fs.readFileSync(srcFile, 'utf8');
const { outputText } = ts.transpileModule(tsxSource, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
fs.writeFileSync(outJs, outputText, 'utf8');

const { LegalModal } = await import(`file://${outJs.replace(/\\/g, '/')}`);

// ── Test Cases ────────────────────────────────────────────────────────────────

test('LegalModal: renders null / empty markup when isOpen is false', () => {
  const html = renderToStaticMarkup(
    React.createElement(LegalModal, { isOpen: false, onClose: () => {} })
  );
  assert.equal(html, '', 'Modal should not render any HTML when isOpen is false');
});

test('LegalModal: renders modal dialog structure with close button when isOpen is true', () => {
  const html = renderToStaticMarkup(
    React.createElement(LegalModal, { isOpen: true, onClose: () => {} })
  );
  assert.ok(html.length > 0);
  assert.ok(html.includes('aria-label="Close legal modal"'), 'Should have accessible close button');
  assert.ok(html.includes('Quiz Arena · Last updated: September 2026'));
  assert.ok(html.includes('Privacy &amp; Student Data') || html.includes('Privacy & Student Data'));
  assert.ok(html.includes('Terms of Service'));
});

test('LegalModal: defaults to Privacy Policy and includes explicit FERPA & COPPA student protections', () => {
  const html = renderToStaticMarkup(
    React.createElement(LegalModal, { isOpen: true, onClose: () => {} })
  );

  // Default header title
  assert.ok(html.includes('Privacy Policy'));

  // FERPA & COPPA mindful compliance callout
  assert.ok(html.includes('Student Privacy First (FERPA &amp; COPPA Mindful)') || html.includes('Student Privacy First (FERPA & COPPA Mindful)'));
  assert.ok(html.includes('Students join live quiz sessions using only a 6-digit PIN and a temporary nickname'));
  assert.ok(html.includes('No student emails, account registrations, or permanent tracking are collected'));
});

test('LegalModal: discloses Google OAuth identity boundaries and client-side localStorage keys', () => {
  const html = renderToStaticMarkup(
    React.createElement(LegalModal, { isOpen: true, onClose: () => {} })
  );

  // Host Google Sign-In & Auth disclosures
  assert.ok(html.includes('Host Identity (Google Sign-In)'));
  assert.ok(html.includes('Firebase Authentication'));
  assert.ok(html.includes('We never access passwords or private Google account data'));

  // Ephemeral memory for student sessions
  assert.ok(html.includes('stored in active server memory and purged when the session concludes'));

  // Client-side LocalStorage disclosures
  assert.ok(html.includes('Local Client Storage (localStorage)'));
  assert.ok(html.includes('qa_history_*'));
  assert.ok(html.includes('qa_login_*'));
  assert.ok(html.includes('records remain private to your local device'));
});

test('LegalModal: discloses AI subprocessors (Bedrock & GCP) and in-memory document handling', () => {
  const html = renderToStaticMarkup(
    React.createElement(LegalModal, { isOpen: true, onClose: () => {} })
  );

  // Uploaded PDF document handling
  assert.ok(html.includes('PDF lecture notes and syllabi'));
  assert.ok(html.includes('processed in-memory solely to generate quiz questions via AI'));
  assert.ok(html.includes('never sold, indexed, or used to train public LLM models'));

  // AI Subprocessors
  assert.ok(html.includes('Amazon Bedrock'));
  assert.ok(html.includes('Google Cloud'));
  assert.ok(html.includes('zero-data-retention educational policies'));
});

test('LegalModal: renders Terms of Service view when initialTab is "terms"', () => {
  const html = renderToStaticMarkup(
    React.createElement(LegalModal, { isOpen: true, initialTab: 'terms', onClose: () => {} })
  );

  assert.ok(html.includes('Terms of Service'));
  assert.ok(html.includes('1. Acceptance of Terms'));
  assert.ok(html.includes('authorized to administer quizzes for your students'));
  assert.ok(html.includes('2. Acceptable Use'));
  assert.ok(html.includes('3. Intellectual Property'));
  assert.ok(html.includes('You retain ownership of any course materials or PDFs you upload'));
  assert.ok(html.includes('4. Disclaimer &amp; Limitation of Liability') || html.includes('4. Disclaimer & Limitation of Liability'));
});

test('LegalModal: includes official support contact and dismissal action buttons', () => {
  const html = renderToStaticMarkup(
    React.createElement(LegalModal, { isOpen: true, onClose: () => {} })
  );

  assert.ok(html.includes('hasithadilshanrcc@gmail.com'), 'Must list official privacy inquiries contact email');
  assert.ok(html.includes('Understood'), 'Must provide Understood acknowledgment button');
});
