import JSZip from 'jszip';
import {
  DocxInspectionResult,
  PageNumberJobConfig,
  SectionInfo,
  PageNumberAlignment,
  PageNumberTextStyle,
} from '@/types/pageNumber';

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

  // Extract detected heading text (BAB I, KATA PENGANTAR, etc.)
  const headings: string[] = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(docXml)) !== null && headings.length < 10) {
    const pContent = pMatch[1];
    // Check if styled as heading or contains keywords
    const isHeadingStyle = /<w:pStyle\b[^>]*w:val=["']Heading\d*["']/i.test(pContent);
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi;
    let tText = '';
    let tm: RegExpExecArray | null;
    while ((tm = tRegex.exec(pContent)) !== null) {
      tText += tm[1];
    }
    const clean = tText.trim();
    if (
      clean.length > 2 &&
      clean.length < 80 &&
      (isHeadingStyle || /^(bab\s+[ivx\d]+|kata\s+pengantar|daftar\s+isi|abstrak|abstract|pendahuluan|lampiran)/i.test(clean))
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
      // Update paragraph alignment and content of that field
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

  // Check how many sections exist in docXml
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
  if (config.preset === 'academic') {
    if (existingSects.length <= 1 && config.academic.insertSectionBreakIfMissing) {
      // Find suitable split point (e.g. before "BAB I" or after first page break)
      const babMatch = /(<w:p\b[^>]*>(?:(?!<\/w:p>).)*?(?:bab\s+i\b|bab\s+1\b)[^<]*?<\/w:p>)/i.exec(docXml);
      if (babMatch) {
        const splitP = `<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>`;
        docXml = docXml.replace(babMatch[0], `${splitP}\n${babMatch[0]}`);
      } else {
        // Fallback: split after first manual page break if exists
        const pbMatch = /<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/i.exec(docXml);
        if (pbMatch) {
          const splitP = `</w:p><w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p><w:p>`;
          docXml = docXml.replace(pbMatch[0], splitP);
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
          // Add w:titlePg if not present
          if (!updatedInner.includes('<w:titlePg')) {
            updatedInner += '\n  <w:titlePg/>';
          }
          // Remove existing first ref for this target
          const refTag = isFrontHeader ? 'w:headerReference' : 'w:footerReference';
          updatedInner = updatedInner.replace(new RegExp(`<${refTag}\\b[^>]*w:type=["']first["'][^>]*\\/?>`, 'gi'), '');
          // Add empty first ref
          updatedInner += `\n  <${refTag} w:type="first" r:id="${emptyPart.relId}"/>`;
        }

        // Add default ref for front matter
        const refTag = isFrontHeader ? 'w:headerReference' : 'w:footerReference';
        updatedInner = updatedInner.replace(new RegExp(`<${refTag}\\b[^>]*w:type=["']default["'][^>]*\\/?>`, 'gi'), '');
        updatedInner += `\n  <${refTag} w:type="default" r:id="${frontPart.relId}"/>`;

        // Set pgNumType to lowerRoman
        updatedInner = updatedInner.replace(/<w:pgNumType\b[^>]*\/?>/gi, '');
        updatedInner += `\n  <w:pgNumType w:fmt="lowerRoman" w:start="1"/>`;
      } else {
        // Section 1+: Main Body
        const refTag = isBodyHeader ? 'w:headerReference' : 'w:footerReference';
        updatedInner = updatedInner.replace(new RegExp(`<${refTag}\\b[^>]*w:type=["']default["'][^>]*\\/?>`, 'gi'), '');
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
        updatedInner = updatedInner.replace(new RegExp(`<${refTag}\\b[^>]*w:type=["']first["'][^>]*\\/?>`, 'gi'), '');
        updatedInner += `\n  <${refTag} w:type="first" r:id="${emptyPart.relId}"/>`;
      }

      // Add default reference
      updatedInner = updatedInner.replace(new RegExp(`<${refTag}\\b[^>]*w:type=["']default["'][^>]*\\/?>`, 'gi'), '');
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
