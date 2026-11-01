import JSZip from 'jszip';
import {
  DocxInspectionResult,
  PageNumberJobConfig,
  SectionInfo,
  PageNumberAlignment,
  PageNumberTextStyle,
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

  // Extract detected heading text (BAB I, KATA PENGANTAR, etc.) using clean plain text extraction
  const headings: string[] = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(docXml)) !== null && headings.length < 30) {
    const pContent = pMatch[1];
    const isHeadingStyle = /<w:pStyle\b[^>]*w:val=["']Heading\d*["']/i.test(pContent);
    const clean = extractParagraphText(pMatch[0]).trim();

    if (
      clean.length > 2 &&
      clean.length < 90 &&
      !headings.includes(clean) &&
      (isHeadingStyle ||
        /^(bab\s+[ivx\d]+|kata\s+pengantar|daftar\s+isi|daftar\s+tabel|daftar\s+gambar|abstrak|abstract|pendahuluan|tinjauan|metodologi|metode|hasil|pembahasan|kesimpulan|daftar\s+pustaka|lampiran)/i.test(
          clean
        ))
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

  // If existing header/footer has text, append page number paragraph
  if (existingXml && existingXml.includes(`<${rootTag}`)) {
    // Check if it already has a page number field
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

    // Otherwise, append page number paragraph before closing rootTag
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

  // Create clean new header/footer XML
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

  // If Academic Preset was chosen, check if we need to split a 1-section document into 2 sections
  if (
    config.preset === 'academic' &&
    existingSects.length <= 1 &&
    config.academic.insertSectionBreakIfMissing
  ) {
    // 1. Extract geometry from existing sectPr to inherit paper size and margins
    let geometryXml = '';
    const lastSectMatch = /<w:sectPr\b[^>]*>([\s\S]*?)<\/w:sectPr>/i.exec(docXml);
    if (lastSectMatch) {
      const pgSz =
        /<w:pgSz\b[^>]*\/?>/i.exec(lastSectMatch[1])?.[0] || '<w:pgSz w:w="11906" w:h="16838"/>';
      const pgMar =
        /<w:pgMar\b[^>]*\/?>/i.exec(lastSectMatch[1])?.[0] ||
        '<w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/>';
      const cols = /<w:cols\b[^>]*\/?>/i.exec(lastSectMatch[1])?.[0] || '';
      geometryXml = `\n    ${pgSz}\n    ${pgMar}${cols ? `\n    ${cols}` : ''}`;
    } else {
      geometryXml =
        '\n    <w:pgSz w:w="11906" w:h="16838"/>\n    <w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/>';
    }

    const newSectBreak = `<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/>${geometryXml}</w:sectPr></w:pPr></w:p>`;

    // 2. Scan paragraphs to locate split target
    const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi;
    let pMatch: RegExpExecArray | null;
    let targetP: string | null = null;
    let pageCount = 1;

    const userSelected = config.academic.selectedHeading?.trim().toLowerCase();
    const splitPageTarget = config.academic.splitPageNumber || 4;

    while ((pMatch = pRegex.exec(docXml)) !== null) {
      const pRaw = pMatch[0];
      const pText = extractParagraphText(pRaw).trim();

      // Check if paragraph contains page breaks
      const pbs = pRaw.match(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/gi) || [];
      pageCount += pbs.length;

      // Check Match Option A: User explicitly selected heading from list
      if (userSelected && pText.toLowerCase().includes(userSelected)) {
        targetP = pRaw;
        break;
      }

      // Check Match Option B: Auto-detect BAB I / BAB 1 / Pendahuluan
      if (!userSelected && /^(bab\s+(i|1)\b|bab\s+(i|1)\s+pendahuluan|pendahuluan\b)/i.test(pText)) {
        targetP = pRaw;
        break;
      }

      // Check Match Option C: Page-number based split
      if (config.academic.splitMode === 'page' && pageCount >= splitPageTarget && pText.length > 0) {
        targetP = pRaw;
        break;
      }
    }

    // 3. Insert Section Break
    if (targetP) {
      // Check if paragraph immediately preceding targetP is an empty page break paragraph
      const precedingPbRegex = new RegExp(
        `(<w:p\\b[^>]*>(?:(?!<\\/w:p>).)*?<w:br\\b[^>]*w:type=["']page["'][^>]*\\/?>[\\s\\S]*?<\\/w:p>\\s*)(${escapeRegex(
          targetP
        )})`,
        'i'
      );

      if (precedingPbRegex.test(docXml)) {
        // Replace the redundant page break with the section break so no blank page is created
        docXml = docXml.replace(precedingPbRegex, `${newSectBreak}\n$2`);
      } else {
        // Prepend section break right before the target paragraph
        docXml = docXml.replace(targetP, `${newSectBreak}\n${targetP}`);
      }
    } else {
      // Fallback: If no Bab I or target heading found, split at the last page break before main body (or 2nd/3rd page break)
      const allPageBreaks = [...docXml.matchAll(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/gi)];
      if (allPageBreaks.length >= 2) {
        const targetPbIndex = Math.min(2, allPageBreaks.length - 1);
        const pb = allPageBreaks[targetPbIndex];
        if (pb && pb.index !== undefined) {
          const before = docXml.slice(0, pb.index);
          const after = docXml.slice(pb.index + pb[0].length);
          docXml = `${before}${newSectBreak}${after}`;
        }
      }
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

  // Prepare footer / header parts based on configuration
  if (config.preset === 'academic') {
    // Academic Setup:
    // Section 0 (Front matter): Cover without number (w:titlePg + empty first footer), Roman numerals (lowerRoman) Footer Center
    // Section 1+ (Body): Decimal numerals (1, 2, 3), Footer Right or Header Right, w:start="1"

    const isFrontHeader = config.academic.frontMatterPosition === 'header';
    const isBodyHeader = config.academic.bodyPosition === 'header';

    // 1. Front Matter Default Header/Footer (Roman numerals)
    const frontXml = buildHeaderFooterXml(
      isFrontHeader,
      config.academic.frontMatterAlignment,
      config.textStyle || 'number-only'
    );
    const frontPart = await createAndRegisterPart(isFrontHeader, frontXml);

    // 2. Empty Cover Header/Footer
    const emptyXml = buildEmptyHeaderFooterXml(isFrontHeader);
    const emptyPart = await createAndRegisterPart(isFrontHeader, emptyXml);

    // 3. Body Default Header/Footer (Arabic numerals)
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

        // Set pgNumType to lowerRoman
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

        // Set pgNumType to decimal starting at 1
        updatedInner = updatedInner.replace(/<w:pgNumType\b[^>]*\/?>/gi, '');
        updatedInner += `\n  <w:pgNumType w:fmt="decimal" w:start="${config.academic.bodyStartNumber || 1}"/>`;
      }

      secIdx++;
      return `<w:sectPr>${updatedInner}\n</w:sectPr>`;
    });
  } else {
    // Standard / Custom Preset
    const isHeader = config.position === 'header';
    const refTag = isHeader ? 'w:headerReference' : 'w:footerReference';

    // 1. Create Default Page Number Header/Footer
    const defaultPartXml = buildHeaderFooterXml(
      isHeader,
      config.alignment,
      config.textStyle
    );
    const defaultPart = await createAndRegisterPart(isHeader, defaultPartXml);

    // 2. If different first page (Cover has no number), create empty part
    let emptyPart: { relId: string; fileName: string } | null = null;
    if (config.differentFirstPage) {
      const emptyXml = buildEmptyHeaderFooterXml(isHeader);
      emptyPart = await createAndRegisterPart(isHeader, emptyXml);
    }

    let secIdx = 0;
    docXml = docXml.replace(updatedSectRegex, (match, inner) => {
      let updatedInner = inner;

      // Handle Different First Page on section 0
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

      // Add default reference
      updatedInner = updatedInner.replace(
        new RegExp(`<${refTag}\\b[^>]*w:type=["']default["'][^>]*\\/?>`, 'gi'),
        ''
      );
      updatedInner += `\n  <${refTag} w:type="default" r:id="${defaultPart.relId}"/>`;

      // Set pgNumType format and start
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
