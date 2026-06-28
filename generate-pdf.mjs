import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_DIR    = join(__dirname, 'pdf');
const MERMAID_JS = join(__dirname, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

if (!existsSync(PDF_DIR)) mkdirSync(PDF_DIR);

const DOCS = [
  { title: 'Frontend — frontend_innutrire',                    file: '01-frontend-innutrire.md',          out: '01-frontend-innutrire.pdf' },
  { title: 'Django Backend — django_backend_innutrire',        file: '02-django-backend-innutrire.md',    out: '02-django-backend-innutrire.pdf' },
  { title: 'Infrastructure — hospital-server-deployment-iac',  file: '03-hospital-server-deployment-iac.md', out: '03-hospital-server-deployment-iac.pdf' },
  { title: 'ML Research — Regression_models_innutrire',        file: '04-regression-models-innutrire.md', out: '04-regression-models-innutrire.pdf' },
  { title: 'System Overview — All Repos',                      file: '05-system-overview.md',             out: '05-system-overview.pdf' },
];

// Replace ```mermaid fenced blocks with <div class="mermaid"> before marked sees them,
// so the content is preserved verbatim inside a raw HTML block.
function preprocessMermaid(md) {
  return md.replace(/```mermaid\n([\s\S]*?)```/g, (_, diagram) => {
    return `\n<div class="mermaid">\n${diagram.trim()}\n</div>\n`;
  });
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px; line-height: 1.65; color: #1a1a2e;
  padding: 30px 40px; background: #ffffff;
}

/* ── Headings ── */
h1 { font-size: 22px; color: #0d1b2a; border-bottom: 3px solid #1b4f72; padding-bottom: 10px; margin: 35px 0 18px; }
h1:first-child { margin-top: 0; }
h2 { font-size: 16px; color: #1b4f72; margin: 30px 0 12px; border-left: 4px solid #1b4f72; padding-left: 10px; }
h3 { font-size: 14px; color: #2c3e50; margin: 20px 0 8px; }

/* ── Body ── */
p { margin: 8px 0; }
ul, ol { margin: 8px 0 8px 22px; }
li { margin: 3px 0; }
hr { border: none; border-top: 1px solid #dde1e7; margin: 28px 0; }

/* ── Blockquote ── */
blockquote {
  border-left: 4px solid #2980b9; margin: 14px 0;
  padding: 10px 18px; background: #eaf4fc;
  color: #2c3e50; border-radius: 0 4px 4px 0; font-style: italic;
}

/* ── Tables ── */
table { border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 12px; }
th { background: #1b4f72; color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; }
td { border: 1px solid #d5dde5; padding: 7px 12px; vertical-align: top; }
tr:nth-child(even) td { background: #f4f8fc; }

/* ── Code ── */
code { background: #f0f3f7; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 11.5px; color: #c0392b; border: 1px solid #dce0e7; }
pre { background: #1e2130; color: #c8d3f5; padding: 16px; border-radius: 6px; margin: 12px 0; overflow-x: auto; }
pre code { background: none; color: inherit; border: none; font-size: 11px; padding: 0; }

/* ── Mermaid ── */
.mermaid { margin: 22px 0; text-align: center; background: #f8fbff; border: 1px solid #d0e4f5; border-radius: 8px; padding: 24px; }
.mermaid svg { max-width: 100%; height: auto; }

/* ── Print ── */
@media print {
  body { padding: 12px 18px; }
  .mermaid { page-break-inside: avoid; }
  h1, h2 { page-break-after: avoid; }
  table { page-break-inside: avoid; }
}
`;

const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#ddeeff',
    primaryTextColor: '#0d1b2a',
    primaryBorderColor: '#1b4f72',
    lineColor: '#1b4f72',
    secondaryColor: '#eaf4fc',
    tertiaryColor: '#f4f8fc',
    background: '#ffffff',
    mainBkg: '#ddeeff',
    nodeBorder: '#1b4f72',
    clusterBkg: '#eaf4fc',
    titleColor: '#0d1b2a',
    edgeLabelBackground: '#ffffff',
    fontFamily: 'Segoe UI, sans-serif',
  },
  flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: true },
  sequence: { useMaxWidth: true },
  er: { useMaxWidth: true },
};

function buildHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

async function renderToPdf(page, html, outPath) {
  // Use domcontentloaded — no external network needed since mermaid is injected separately
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // Inject mermaid.min.js from local node_modules (no CDN request)
  await page.addScriptTag({ path: MERMAID_JS });

  // Initialize and run mermaid (fire-and-forget; waitForFunction below detects completion)
  await page.evaluate((config) => {
    window.mermaid.initialize(config);
    window.mermaid.run();
    return true;
  }, MERMAID_CONFIG);

  // Wait until all .mermaid divs have been processed (mermaid sets data-processed="true")
  try {
    await page.waitForFunction(
      () => {
        const all  = document.querySelectorAll('.mermaid');
        if (all.length === 0) return true;
        const done = document.querySelectorAll('.mermaid[data-processed="true"]');
        return done.length === all.length;
      },
      { timeout: 120_000 }
    );
  } catch {
    console.warn('  ⚠  Mermaid render timeout — some diagrams may be incomplete');
  }

  // Short settle for SVG layout to finish
  await new Promise(r => setTimeout(r, 600));

  await page.pdf({
    path: outPath,
    format: 'A3',
    landscape: true,
    margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="font-size:9px; width:100%; display:flex; justify-content:space-between;
                  padding: 0 14mm 4px; color:#888; font-family:Segoe UI,sans-serif; box-sizing:border-box;">
        <span>INNUTRIRE System Diagrams</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
  });
}

async function main() {
  console.log('Launching headless Chrome (local mermaid — no CDN)...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });

  // ── Individual PDFs ───────────────────────────────────────────────────────
  for (const doc of DOCS) {
    process.stdout.write(`  Rendering: ${doc.title} ... `);
    const md   = readFileSync(join(__dirname, doc.file), 'utf8');
    const pre  = preprocessMermaid(md);
    const body = marked.parse(pre);
    const html = buildHtml(doc.title, body);
    await renderToPdf(page, html, join(PDF_DIR, doc.out));
    console.log(`done  →  pdf/${doc.out}`);
  }

  // ── Combined PDF (all repos concatenated) ────────────────────────────────
  process.stdout.write('\n  Rendering combined PDF ... ');
  const combinedMd   = DOCS.map(d => readFileSync(join(__dirname, d.file), 'utf8')).join('\n\n---\n\n');
  const combinedPre  = preprocessMermaid(combinedMd);
  const combinedBody = marked.parse(combinedPre);
  const combinedHtml = buildHtml('INNUTRIRE — System Diagrams (All Repos)', combinedBody);
  await renderToPdf(page, combinedHtml, join(PDF_DIR, 'INNUTRIRE-All-Diagrams.pdf'));
  console.log('done  →  pdf/INNUTRIRE-All-Diagrams.pdf');

  await browser.close();
  console.log('\nAll PDFs written to: pdf/\n');
}

main().catch(err => { console.error(err); process.exit(1); });
