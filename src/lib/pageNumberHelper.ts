import JSZip from 'jszip';
import {
  DocxInspectionResult,
  PageNumberJobConfig,
  SectionInfo,
  PageNumberAlignment,
  PageNumberTextStyle,
  SectionNumberingConfig,
} from '@/types/pageNumber';

/**
 * Helper to extract plain text from a paragraph's XML (concatenating all <w:t> tags)
 */
export function extractParagraphText(pXml: string): string {
  const matches = pXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
  return matches.map((m) => m.replace(/<[^>]+>/g, '')).join('');
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper to extract page geometry from existing sectPr
 */
export function extractGeometry(xml: string): string {
  const lastSectMatch = /<w:sectPr\b[^>]*>([\s\S]*?)<\/w:sectPr>/i.exec(xml);
  if (lastSectMatch) {
    const pgSz =
      /<w:pgSz\b[^>]*\/?>/i.exec(lastSectMatch[1])?.[0] || '<w:pgSz w:w="11906" w:h="16838"/>';
    const pgMar =
      /<w:pgMar\b[^>]*\/?>/i.exec(lastSectMatch[1])?.[0] ||
      '<w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/>';
    const cols = /<w:cols\b[^>]*\/?>/i.exec(lastSectMatch[1])?.[0] || '';
    return `\n    ${pgSz}\n    ${pgMar}${cols ? `\n    ${cols}` : ''}`;
  }
  return '\n    <w:pgSz w:w="11906" w:h="16838"/>\n    <w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/>';
}

/**
 * Helper to insert a section break right before target paragraph (cleaning up any redundant page breaks)
 */
export function insertSectionBreakBeforeP(
  xml: string,
  targetP: string,
  geometryXml: string
): string {
  const newSectBreak = `<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/>${geometryXml}</w:sectPr></w:pPr></w:p>`;
  const precedingPbRegex = new RegExp(
    `(<w:p\\b[^>]*>(?:(?!<\\/w:p>).)*?<w:br\\b[^>]*w:type=["']page["'][^>]*\\/?>[\\s\\S]*?<\\/w:p>\\s*)(${escapeRegex(
      targetP
    )})`,
    'i'
  );
  if (precedingPbRegex.test(xml)) {
    return xml.replace(precedingPbRegex, `${newSectBreak}\n$2`);
  }
  return xml.replace(targetP, `${newSectBreak}\n${targetP}`);
}

/**
 * Helper to locate target paragraph for splitting by page number
 */
export function findParagraphAtPage(xml: string, targetPageNumber: number): string | null {
  if (targetPageNumber <= 1) return null;
  const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi;
  let pMatch: RegExpExecArray | null;
  let currentPage = 1;
  const allParagraphs: string[] = [];

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pRaw = pMatch[0];
    allParagraphs.push(pRaw);
    const brMatches =
      pRaw.match(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>|<w:lastRenderedPageBreak\b/gi) || [];
    currentPage += brMatches.length;

    if (currentPage >= targetPageNumber) {
      const nextPRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi;
      nextPRegex.lastIndex = pRegex.lastIndex;
      const nextMatch = nextPRegex.exec(xml);
      return nextMatch ? nextMatch[0] : pRaw;
    }
  }

  // Fallback: If no explicit page breaks were stored in XML but there are multiple paragraphs
  if (allParagraphs.length >= 2) {
    const approxIndex = Math.min(
      allParagraphs.length - 1,
      Math.max(1, Math.floor(((targetPageNumber - 1) / Math.max(targetPageNumber, 2)) * allParagraphs.length))
    );
    return allParagraphs[approxIndex];
  }

  return null;
}

/**
 * Inspect DOCX structure: sections, headers, footers, page breaks, and landscape orientations
 */
export async function inspectDocxForPageNumbering(file: File): Promise<DocxInspectionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('File DOCX tidak memiliki word/document.xml yang valid.');
  }

  const docXml = await docFile.async('text');

  // Find all <w:sectPr> occurrences (mid-document and final)
  const sectPrRegex = /<w:sectPr\b[^>]*>([\s\S]*?)<\/w:sectPr>/gi;
  const sections: SectionInfo[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = sectPrRegex.exec(docXml)) !== null) {
    const sectContent = match[1];

    const hasHeader = /<w:headerReference\b/i.test(sectContent);
    const hasFooter = /<w:footerReference\b/i.test(sectContent);
    const differentFirstPage = /<w:titlePg\b/i.test(sectContent);
    const isLandscape = /w:orient=["']landscape["']/i.test(sectContent);

    // Extract existing pgNumType if any
    let pgNumType: { fmt?: string; start?: number } | undefined;
    const pgNumMatch = /<w:pgNumType\b([^>]*)\/?>/i.exec(sectContent);
    if (pgNumMatch) {
      const attrs = pgNumMatch[1];
      const fmtMatch = /w:fmt=["']([^"']+)["']/i.exec(attrs);
      const startMatch = /w:start=["']([^"']+)["']/i.exec(attrs);
      pgNumType = {
        fmt: fmtMatch ? fmtMatch[1] : undefined,
        start: startMatch ? parseInt(startMatch[1]) : undefined,
      };
    }

    sections.push({
      index: idx++,
      hasHeader,
      hasFooter,
      differentFirstPage,
      isLandscape,
      pgNumType,
    });
  }

  // If no <w:sectPr> was found, document has a default implicit single section
  if (sections.length === 0) {
    sections.push({
      index: 0,
      hasHeader: false,
      hasFooter: false,
      differentFirstPage: false,
      isLandscape: false,
    });
  }

  // Check existing headers and footers in the zip package
  const hasExistingHeader = Object.keys(zip.files).some((f) => /^word\/header\d+\.xml$/i.test(f));
  const hasExistingFooter = Object.keys(zip.files).some((f) => /^word\/footer\d+\.xml$/i.test(f));

  // Count manual page breaks: <w:br w:type="page"/>
  const pageBreakMatches = docXml.match(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/gi) || [];
  const renderedPageBreaks = docXml.match(/<w:lastRenderedPageBreak\b/gi) || [];
  const detectedPageBreaks = Math.max(pageBreakMatches.length, renderedPageBreaks.length);

  // Count paragraphs
  const paragraphMatches = docXml.match(/<w:p\b/gi) || [];
  const detectedParagraphs = paragraphMatches.length;

  // Extract detected heading text (BAB I, KATA PENGANTAR, Lampiran, Surat, etc.) using clean plain text extraction
  const headings: string[] = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(docXml)) !== null && headings.length < 35) {
    const pContent = pMatch[1];
    const isHeadingStyle = /<w:pStyle\b[^>]*w:val=["']Heading\d*["']/i.test(pContent);
    const isBold = /<w:b\b/i.test(pContent);
    const clean = extractParagraphText(pMatch[0]).trim();

    const isRecognizedTitle =
      /^(bab\s+[ivx\d]+|kata\s+pengantar|daftar\s+isi|daftar\s+tabel|daftar\s+gambar|abstrak|abstract|pendahuluan|tinjauan|metodologi|metode|hasil|pembahasan|kesimpulan|daftar\s+pustaka|lampiran|surat|lembar|permohonan|pasal|bagian)/i.test(
        clean
      );

    if (
      clean.length > 2 &&
      clean.length < 90 &&
      !headings.includes(clean) &&
      (isHeadingStyle || isBold || isRecognizedTitle || (clean.length < 50 && /^[A-Z0-9\s.,:-]+$/.test(clean)))
    ) {
      headings.push(clean);
    }
  }

  return {
    file,
    fileName: file.name,
    fileSize: file.size,
    totalSections: sections.length,
    sections,
    hasExistingHeader,
    hasExistingFooter,
    detectedPageBreaks,
    detectedParagraphs,
    previewHeadings: headings,
  };
}

/**
 * Generate OpenXML Field XML for Page Number
 */
export function buildPageNumberFieldXml(textStyle: PageNumberTextStyle): string {
  switch (textStyle) {
    case 'page-x':
      return `
      <w:r>
        <w:rPr><w:noProof/></w:rPr>
        <w:t xml:space="preserve">Halaman </w:t>
      </w:r>
      <w:fldSimple w:instr="PAGE"/>`;

    case 'x-of-y':
      return `
      <w:fldSimple w:instr="PAGE"/>
      <w:r>
        <w:rPr><w:noProof/></w:rPr>
        <w:t xml:space="preserve"> dari </w:t>
      </w:r>
      <w:fldSimple w:instr="NUMPAGES"/>`;

    case 'x-slash-y':
      return `
      <w:fldSimple w:instr="PAGE"/>
      <w:r>
        <w:rPr><w:noProof/></w:rPr>
        <w:t xml:space="preserve"> / </w:t>
      </w:r>
      <w:fldSimple w:instr="NUMPAGES"/>`;

    case 'number-only':
    default:
      return `<w:fldSimple w:instr="PAGE"/>`;
  }
}

/**
 * Generate Header or Footer XML with dynamic PAGE fields
 */
export function buildHeaderFooterXml(
  isHeader: boolean,
  alignment: PageNumberAlignment,
  textStyle: PageNumberTextStyle,
  existingXml?: string
): string {
  const rootTag = isHeader ? 'w:hdr' : 'w:ftr';
  const styleVal = isHeader ? 'Header' : 'Footer';
  const fieldXml = buildPageNumberFieldXml(textStyle);

  if (existingXml && existingXml.includes(`<${rootTag}`)) {
    if (existingXml.includes('w:instr="PAGE"') || existingXml.includes('PAGE</w:instrText>')) {
      return existingXml.replace(
        /<w:p\b[^>]*>[\s\S]*?(?:w:instr="PAGE"|PAGE<\/w:instrText>)[\s\S]*?<\/w:p>/i,
        `<w:p>
          <w:pPr>
            <w:pStyle w:val="${styleVal}"/>
            <w:jc w:val="${alignment}"/>
          </w:pPr>
          ${fieldXml}
        </w:p>`
      );
    }

    const newP = `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="${styleVal}"/>
        <w:jc w:val="${alignment}"/>
      </w:pPr>
      ${fieldXml}
    </w:p>`;

    return existingXml.replace(new RegExp(`</${rootTag}>$`), `${newP}\n</${rootTag}>`);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<${rootTag} xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="${styleVal}"/>
      <w:jc w:val="${alignment}"/>
    </w:pPr>
    ${fieldXml}
  </w:p>
</${rootTag}>`;
}

/**
 * Generate an empty Header or Footer XML (used when Different First Page is enabled for Cover)
 */
export function buildEmptyHeaderFooterXml(isHeader: boolean): string {
  const rootTag = isHeader ? 'w:hdr' : 'w:ftr';
  const styleVal = isHeader ? 'Header' : 'Footer';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<${rootTag} xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="${styleVal}"/>
    </w:pPr>
  </w:p>
</${rootTag}>`;
}

/**
 * Ensure [Content_Types].xml includes an override for the new header or footer
 */
export async function ensureHeaderFooterContentType(
  zip: JSZip,
  partPath: string,
  isHeader: boolean
): Promise<void> {
  const ctFile = zip.file('[Content_Types].xml');
  if (!ctFile) return;

  let ctXml = await ctFile.async('text');
  const contentType = isHeader
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml';

  const partName = partPath.startsWith('/') ? partPath : `/${partPath}`;

  if (!ctXml.includes(`PartName="${partName}"`)) {
    ctXml = ctXml.replace(
      '</Types>',
      `  <Override PartName="${partName}" ContentType="${contentType}"/>\n</Types>`
    );
    zip.file('[Content_Types].xml', ctXml);
  }
}

/**
 * Main function: Apply automated page numbering to a DOCX document
 */
export async function applyPageNumberingToDocx(
  file: File,
  config: PageNumberJobConfig
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('word/document.xml tidak ditemukan');
  }

  let docXml = await docFile.async('text');

  // Load relationships
  let relsXml = '';
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    relsXml = await relsFile.async('text');
  } else {
    relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n</Relationships>`;
  }

  // Find max existing relationship ID index
  let maxRelId = 100;
  const relIdMatches = relsXml.match(/Id="rId(\d+)"/g) || [];
  relIdMatches.forEach((m) => {
    const num = parseInt(m.replace(/[^\d]/g, ''));
    if (num > maxRelId) maxRelId = num;
  });

  // Find max existing header/footer file number in zip
  let maxHfIndex = 0;
  Object.keys(zip.files).forEach((fn) => {
    const hfMatch = /word\/(?:header|footer)(\d+)\.xml/i.exec(fn);
    if (hfMatch) {
      const n = parseInt(hfMatch[1]);
      if (n > maxHfIndex) maxHfIndex = n;
    }
  });

  // Helper to create and register a new header or footer
  const createAndRegisterPart = async (
    isHeader: boolean,
    contentXml: string
  ): Promise<{ relId: string; fileName: string }> => {
    const fileIndex = ++maxHfIndex;
    const relIndex = ++maxRelId;
    const fileName = isHeader ? `header${fileIndex}.xml` : `footer${fileIndex}.xml`;
    const relId = `rId_nb_${isHeader ? 'hdr' : 'ftr'}_${relIndex}`;
    const relType = isHeader
      ? 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'
      : 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer';

    // 1. Add file to zip
    zip.file(`word/${fileName}`, contentXml);

    // 2. Add relationship
    if (relsXml) {
      const relEntry = `<Relationship Id="${relId}" Type="${relType}" Target="${fileName}"/>`;
      relsXml = relsXml.replace('</Relationships>', `  ${relEntry}\n</Relationships>`);
    }

    // 3. Add content type
    await ensureHeaderFooterContentType(zip, `word/${fileName}`, isHeader);

    return { relId, fileName };
  };

  // Check how many sections exist in docXml initially
  const sectPrRegex = /<w:sectPr\b[^>]*>([\s\S]*?)<\/w:sectPr>/gi;
  const existingSects: { fullMatch: string; inner: string; index: number }[] = [];
  let sMatch: RegExpExecArray | null;

  while ((sMatch = sectPrRegex.exec(docXml)) !== null) {
    existingSects.push({
      fullMatch: sMatch[0],
      inner: sMatch[1],
      index: sMatch.index,
    });
  }

  const geometryXml = extractGeometry(docXml);

  // =========================================================================
  // 1. ACADEMIC PRESET: AUTOMATIC SECTION BREAK INSERTION
  // =========================================================================
  if (
    config.preset === 'academic' &&
    existingSects.length <= 1 &&
    config.academic.insertSectionBreakIfMissing
  ) {
    let targetP: string | null = null;
    const splitMode = config.academic.splitMode || 'auto';

    if (splitMode === 'page' && config.academic.splitPageNumber) {
      targetP = findParagraphAtPage(docXml, config.academic.splitPageNumber);
    } else if (splitMode === 'heading' && config.academic.selectedHeading) {
      const userSelected = config.academic.selectedHeading.trim().toLowerCase();
      const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pRegex.exec(docXml)) !== null) {
        const text = extractParagraphText(pMatch[0]).trim().toLowerCase();
        if (text.includes(userSelected)) {
          targetP = pMatch[0];
          break;
        }
      }
    } else {
      // Auto: scan for BAB I / BAB 1 / PENDAHULUAN
      const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pRegex.exec(docXml)) !== null) {
        const text = extractParagraphText(pMatch[0]).trim();
        if (/^(bab\s+(i|1)\b|bab\s+(i|1)\s+pendahuluan|pendahuluan\b)/i.test(text)) {
          targetP = pMatch[0];
          break;
        }
      }
      // If auto heading not found, fallback to page 4 or 2nd/3rd page break
      if (!targetP) {
        targetP = findParagraphAtPage(docXml, config.academic.splitPageNumber || 4);
      }
    }

    if (targetP) {
      docXml = insertSectionBreakBeforeP(docXml, targetP, geometryXml);
    } else {
      // Fallback: 2nd or 3rd page break
      const allPageBreaks = [...docXml.matchAll(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/gi)];
      if (allPageBreaks.length >= 2) {
        const targetPbIndex = Math.min(2, allPageBreaks.length - 1);
        const pb = allPageBreaks[targetPbIndex];
        if (pb && pb.index !== undefined) {
          const newSectBreak = `<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/>${geometryXml}</w:sectPr></w:pPr></w:p>`;
          const before = docXml.slice(0, pb.index);
          const after = docXml.slice(pb.index + pb[0].length);
          docXml = `${before}${newSectBreak}${after}`;
        }
      }
    }
  }

  // =========================================================================
  // 2. CUSTOM PRESET: CUSTOM SECTION SPLITTING (PAGE / HEADING)
  // =========================================================================
  if (
    config.preset === 'custom' &&
    existingSects.length <= 1 &&
    config.customSplit?.enabled
  ) {
    let targetP: string | null = null;
    const method = config.customSplit.method || 'page';

    if (method === 'page') {
      targetP = findParagraphAtPage(docXml, config.customSplit.targetPage || 2);
    } else if (method === 'heading' && config.customSplit.targetHeading) {
      const userSelected = config.customSplit.targetHeading.trim().toLowerCase();
      const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pRegex.exec(docXml)) !== null) {
        const text = extractParagraphText(pMatch[0]).trim().toLowerCase();
        if (text.includes(userSelected)) {
          targetP = pMatch[0];
          break;
        }
      }
    } else if (method === 'auto') {
      const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pRegex.exec(docXml)) !== null) {
        const text = extractParagraphText(pMatch[0]).trim();
        if (/^(bab\s+(i|1)\b|bab\s+(i|1)\s+pendahuluan|pendahuluan\b|lampiran\b)/i.test(text)) {
          targetP = pMatch[0];
          break;
        }
      }
      if (!targetP) {
        targetP = findParagraphAtPage(docXml, 2);
      }
    }

    if (targetP) {
      docXml = insertSectionBreakBeforeP(docXml, targetP, geometryXml);
    }
  }

  // Re-read sections after potential split
  const updatedSectRegex = /<w:sectPr\b[^>]*>([\s\S]*?)<\/w:sectPr>/gi;
  const sectsToProcess: { fullMatch: string; inner: string }[] = [];
  let usMatch: RegExpExecArray | null;
  while ((usMatch = updatedSectRegex.exec(docXml)) !== null) {
    sectsToProcess.push({
      fullMatch: usMatch[0],
      inner: usMatch[1],
    });
  }

  // If still no section, append one before </w:body>
  if (sectsToProcess.length === 0) {
    const dummySect = `<w:sectPr></w:sectPr>`;
    docXml = docXml.replace('</w:body>', `${dummySect}</w:body>`);
    sectsToProcess.push({ fullMatch: dummySect, inner: '' });
  }

  // =========================================================================
  // 3. APPLY NUMBERING PER PRESET
  // =========================================================================
  if (config.preset === 'academic') {
    // Academic Setup:
    const isFrontHeader = config.academic.frontMatterPosition === 'header';
    const isBodyHeader = config.academic.bodyPosition === 'header';

    const frontXml = buildHeaderFooterXml(
      isFrontHeader,
      config.academic.frontMatterAlignment,
      config.textStyle || 'number-only'
    );
    const frontPart = await createAndRegisterPart(isFrontHeader, frontXml);

    const emptyXml = buildEmptyHeaderFooterXml(isFrontHeader);
    const emptyPart = await createAndRegisterPart(isFrontHeader, emptyXml);

    const bodyXml = buildHeaderFooterXml(
      isBodyHeader,
      config.academic.bodyAlignment,
      config.textStyle || 'number-only'
    );
    const bodyPart = await createAndRegisterPart(isBodyHeader, bodyXml);

    let secIdx = 0;
    docXml = docXml.replace(updatedSectRegex, (match, inner) => {
      let updatedInner = inner;

      if (secIdx === 0) {
        // Section 0: Front Matter
        if (config.academic.coverNoNumber) {
          if (!updatedInner.includes('<w:titlePg')) {
            updatedInner += '\n  <w:titlePg/>';
          }
          const refTag = isFrontHeader ? 'w:headerReference' : 'w:footerReference';
          updatedInner = updatedInner.replace(
            new RegExp(`<${refTag}\\b[^>]*w:type=["']first["'][^>]*\\/?>`, 'gi'),
            ''
          );
          updatedInner += `\n  <${refTag} w:type="first" r:id="${emptyPart.relId}"/>`;
        }

        const refTag = isFrontHeader ? 'w:headerReference' : 'w:footerReference';
        updatedInner = updatedInner.replace(
          new RegExp(`<${refTag}\\b[^>]*w:type=["']default["'][^>]*\\/?>`, 'gi'),
          ''
        );
        updatedInner += `\n  <${refTag} w:type="default" r:id="${frontPart.relId}"/>`;

        updatedInner = updatedInner.replace(/<w:pgNumType\b[^>]*\/?>/gi, '');
        updatedInner += `\n  <w:pgNumType w:fmt="lowerRoman" w:start="1"/>`;
      } else {
        // Section 1+: Main Body
        const refTag = isBodyHeader ? 'w:headerReference' : 'w:footerReference';
        updatedInner = updatedInner.replace(
          new RegExp(`<${refTag}\\b[^>]*w:type=["']default["'][^>]*\\/?>`, 'gi'),
          ''
        );
        updatedInner += `\n  <${refTag} w:type="default" r:id="${bodyPart.relId}"/>`;

        updatedInner = updatedInner.replace(/<w:pgNumType\b[^>]*\/?>/gi, '');
        updatedInner += `\n  <w:pgNumType w:fmt="decimal" w:start="${config.academic.bodyStartNumber || 1}"/>`;
      }

      secIdx++;
      return `<w:sectPr>${updatedInner}\n</w:sectPr>`;
    });
  } else if (config.preset === 'custom') {
    // Custom Setup (Per-Section Config):
    const totalSects = sectsToProcess.length;
    const sectionParts: Array<{
      defaultPart?: { relId: string; fileName: string };
      emptyPart?: { relId: string; fileName: string };
      conf: SectionNumberingConfig;
    }> = [];

    for (let i = 0; i < totalSects; i++) {
      const conf =
        config.customSections && config.customSections[i]
          ? config.customSections[i]
          : i === 0
          ? {
              sectionIndex: 0,
              name: 'Section 1',
              enabled: true,
              differentFirstPage: false,
              format: 'lowerRoman' as const,
              startNumber: 1,
              restartNumbering: true,
              position: 'footer' as const,
              alignment: 'center' as const,
              textStyle: 'number-only' as const,
            }
          : {
              sectionIndex: i,
              name: `Section ${i + 1}`,
              enabled: true,
              differentFirstPage: false,
              format: 'decimal' as const,
              startNumber: 1,
              restartNumbering: true,
              position: 'footer' as const,
              alignment: 'right' as const,
              textStyle: 'number-only' as const,
            };

      if (conf.format !== 'none') {
        const isHeader = conf.position === 'header';
        const defaultPartXml = buildHeaderFooterXml(
          isHeader,
          conf.alignment,
          conf.textStyle || 'number-only'
        );
        const defaultPart = await createAndRegisterPart(isHeader, defaultPartXml);
        let emptyPart: { relId: string; fileName: string } | undefined;
        if (conf.differentFirstPage) {
          const emptyXml = buildEmptyHeaderFooterXml(isHeader);
          emptyPart = await createAndRegisterPart(isHeader, emptyXml);
        }
        sectionParts.push({ defaultPart, emptyPart, conf });
      } else {
        sectionParts.push({ conf });
      }
    }

    let secIdx = 0;
    docXml = docXml.replace(updatedSectRegex, (match, inner) => {
      let updatedInner = inner;
      const pData = sectionParts[secIdx] || sectionParts[0];
      const conf = pData.conf;
      const isHeader = conf.position === 'header';
      const refTag = isHeader ? 'w:headerReference' : 'w:footerReference';

      // Remove existing references for this tag
      updatedInner = updatedInner.replace(new RegExp(`<${refTag}\\b[^>]*\\/?>`, 'gi'), '');
      updatedInner = updatedInner.replace(/<w:pgNumType\b[^>]*\/?>/gi, '');

      if (conf.format !== 'none' && pData.defaultPart) {
        if (conf.differentFirstPage && pData.emptyPart) {
          if (!updatedInner.includes('<w:titlePg')) {
            updatedInner += '\n  <w:titlePg/>';
          }
          updatedInner += `\n  <${refTag} w:type="first" r:id="${pData.emptyPart.relId}"/>`;
        }
        updatedInner += `\n  <${refTag} w:type="default" r:id="${pData.defaultPart.relId}"/>`;

        if (conf.restartNumbering !== false) {
          updatedInner += `\n  <w:pgNumType w:fmt="${conf.format}" w:start="${conf.startNumber || 1}"/>`;
        } else {
          updatedInner += `\n  <w:pgNumType w:fmt="${conf.format}"/>`;
        }
      }

      secIdx++;
      return `<w:sectPr>${updatedInner}\n</w:sectPr>`;
    });
  } else {
    // Standard Preset
    const isHeader = config.position === 'header';
    const refTag = isHeader ? 'w:headerReference' : 'w:footerReference';

    const defaultPartXml = buildHeaderFooterXml(
      isHeader,
      config.alignment,
      config.textStyle
    );
    const defaultPart = await createAndRegisterPart(isHeader, defaultPartXml);

    let emptyPart: { relId: string; fileName: string } | null = null;
    if (config.differentFirstPage) {
      const emptyXml = buildEmptyHeaderFooterXml(isHeader);
      emptyPart = await createAndRegisterPart(isHeader, emptyXml);
    }

    let secIdx = 0;
    docXml = docXml.replace(updatedSectRegex, (match, inner) => {
      let updatedInner = inner;

      if (secIdx === 0 && config.differentFirstPage && emptyPart) {
        if (!updatedInner.includes('<w:titlePg')) {
          updatedInner += '\n  <w:titlePg/>';
        }
        updatedInner = updatedInner.replace(
          new RegExp(`<${refTag}\\b[^>]*w:type=["']first["'][^>]*\\/?>`, 'gi'),
          ''
        );
        updatedInner += `\n  <${refTag} w:type="first" r:id="${emptyPart.relId}"/>`;
      }

      updatedInner = updatedInner.replace(
        new RegExp(`<${refTag}\\b[^>]*w:type=["']default["'][^>]*\\/?>`, 'gi'),
        ''
      );
      updatedInner += `\n  <${refTag} w:type="default" r:id="${defaultPart.relId}"/>`;

      const fmt = config.format || 'decimal';
      const start = secIdx === 0 ? config.startNumber || 1 : undefined;

      updatedInner = updatedInner.replace(/<w:pgNumType\b[^>]*\/?>/gi, '');
      if (start !== undefined) {
        updatedInner += `\n  <w:pgNumType w:fmt="${fmt}" w:start="${start}"/>`;
      } else {
        updatedInner += `\n  <w:pgNumType w:fmt="${fmt}"/>`;
      }

      secIdx++;
      return `<w:sectPr>${updatedInner}\n</w:sectPr>`;
    });
  }

  // Save modified document.xml and rels
  zip.file('word/document.xml', docXml);
  if (relsXml) {
    zip.file('word/_rels/document.xml.rels', relsXml);
  }

  // Export as modified DOCX Blob
  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
