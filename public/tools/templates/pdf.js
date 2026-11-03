// Minimal lossless PDF writer for Template Maker.
// Each page is one 8-bit grayscale image (FlateDecode, via the platform's CompressionStream),
// sized so the page prints at the template's PPI. Pages whose pixels are identical share one
// image object, so a 100-page notebook without page numbers is barely bigger than one page.
// Runs in the WebView and in Node 18+ (used by scripts/validate-templates.mjs).

const enc = new TextEncoder();

export async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** RGBA ImageData bytes → one gray byte per pixel (templates are drawn in grays only). */
export function toGray(rgba) {
  const out = new Uint8Array(rgba.length >> 2);
  for (let i = 0, j = 0; j < out.length; i += 4, j++) {
    out[j] = (rgba[i] * 77 + rgba[i + 1] * 150 + rgba[i + 2] * 29) >> 8;
  }
  return out;
}

function pdfTextString(str) {
  // UTF-16BE hex string with BOM: safe for any title.
  let hex = 'FEFF';
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    const units = cp > 0xffff ? [0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff)] : [cp];
    for (const u of units) hex += u.toString(16).padStart(4, '0').toUpperCase();
  }
  return `<${hex}>`;
}

/**
 * @param {object} p
 * @param {number} p.count          number of pages
 * @param {number} p.width, p.height  pixels
 * @param {number} p.ppi
 * @param {string} p.title
 * @param {(i:number)=>Promise<{key:string, gray:Uint8Array}>} p.getPage
 *        page i (0-based). Pages returning the same key reuse the same image.
 * @param {(done:number,total:number)=>void} [p.onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function buildPdf({ count, width, height, ppi, title, getPage, onProgress }) {
  const chunks = [];
  let size = 0;
  const offsets = [];
  const push = (bytes) => { chunks.push(bytes); size += bytes.length; };
  const text = (s) => push(enc.encode(s));
  let next = 3; // 1 = catalog, 2 = pages tree
  const obj = (num, body, stream) => {
    offsets[num] = size;
    text(`${num} 0 obj\n${body}\n`);
    if (stream) { text('stream\n'); push(stream); text('\nendstream\n'); }
    text('endobj\n');
  };

  push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // %PDF-1.4 + binary marker

  const wPt = +(width / ppi * 72).toFixed(3);
  const hPt = +(height / ppi * 72).toFixed(3);
  const images = new Map();
  const kids = [];
  const content = enc.encode(`q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q`);

  for (let i = 0; i < count; i++) {
    const { key, gray } = await getPage(i);
    let imgNum = images.get(key);
    if (!imgNum) {
      const data = await deflate(gray);
      imgNum = next++;
      obj(imgNum, `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${data.length} >>`, data);
      images.set(key, imgNum);
    }
    const contentNum = next++;
    obj(contentNum, `<< /Length ${content.length} >>`, content);
    const pageNum = next++;
    obj(pageNum, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 ${imgNum} 0 R >> >> /Contents ${contentNum} 0 R >>`);
    kids.push(`${pageNum} 0 R`);
    onProgress?.(i + 1, count);
  }

  obj(2, `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${count} >>`);
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const infoNum = next++;
  obj(infoNum, `<< /Title ${pdfTextString(title || 'Template')} /Producer (AFS Custom Boox Template Maker) >>`);

  const xrefAt = size;
  let xref = `xref\n0 ${next}\n0000000000 65535 f \n`;
  for (let n = 1; n < next; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  text(xref);
  text(`trailer\n<< /Size ${next} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}
