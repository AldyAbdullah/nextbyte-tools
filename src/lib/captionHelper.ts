import JSZip from 'jszip';
import {
  DocxCaptionInspectionResult,
  DocxCaptionItem,
  CaptionJobConfig,
  CaptionNumberingMode,
  CaptionAlignment,
} from '@/types/caption';

/**
 * Helper to convert Roman numerals (I, II, III, IV, etc.) to Arabic numbers (1, 2, 3...)
 */
export function romanToArabic(roman: string): number {
  const map: Record<string, number> = {
    i: 1,
    v: 5,
    x: 10,
    l: 50,
    c: 100,
    d: 500,
    m: 1000,
  };
  const clean = roman.toLowerCase().trim();
  let result = 0;
  for (let i = 0; i < clean.length; i++) {
    const current = map[clean[i]] || 0;
    const next = map[clean[i + 1]] || 0;
    if (next > current) {
      result += next - current;
      i++;
    } else {
      result += current;
    }
  }
  return result > 0 ? result : 1;
}

/**
 * Helper to extract plain text content from XML element
 */
export function extractTextFromXml(xml: string): string {
  const tMatches = xml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
  return tMatches
    .map((tm) => tm.replace(/<[^>]+>/g, ''))
    .join('')
    .trim();
}

/**
 * Helper to inspect relationships file and map rId to target media
 */
async function loadRelationshipsMap(zip: JSZip): Promise<Record<string, string>> {
  const relsMap: Record<string, string> = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (!relsFile) return relsMap;

  const relsXml = await relsFile.async('text');
  const relRegex = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/gi;
  let rm: RegExpExecArray | null;

  while ((rm = relRegex.exec(relsXml)) !== null) {
    const id = rm[1];
    let target = rm[2];
    // Clean target path: if it starts with 'media/' or is relative
    if (!target.startsWith('word/') && !target.startsWith('/')) {
      target = `word/${target}`;
    } else if (target.startsWith('/word/')) {
      target = target.substring(1);
    }
    relsMap[id] = target;
  }

  return relsMap;
}

/**
 * Inspect DOCX structure: locate all drawings/images and tables, detect headings/chapters,
 * and extract previews and existing captions.
 */
export async function inspectDocxForCaptions(file: File): Promise<DocxCaptionInspectionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('File DOCX tidak memiliki word/document.xml yang valid.');
  }

  const docXml = await docFile.async('text');
  const relsMap = await loadRelationshipsMap(zip);

  // Extract body inner XML
  const bodyMatch = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(docXml);
  if (!bodyMatch) {
    throw new Error('Struktur <w:body> tidak ditemukan dalam dokumen Word.');
  }

  const bodyContent = bodyMatch[1];

  // Regex to match top-level elements: paragraphs <w:p> and tables <w:tbl>
  const elemRegex = /(<w:p\b[\s\S]*?<\/w:p>|<w:tbl\b[\s\S]*?<\/w:tbl>)/gi;
  const elements: { tag: 'p' | 'tbl'; xml: string; index: number }[] = [];
  let em: RegExpExecArray | null;
  let elemCounter = 0;

  while ((em = elemRegex.exec(bodyContent)) !== null) {
    const xml = em[1];
    const tag = xml.startsWith('<w:tbl') ? 'tbl' : 'p';
    elements.push({ tag, xml, index: elemCounter++ });
  }

  const chapters: { number: number; title: string }[] = [];
  const items: DocxCaptionItem[] = [];

  let currentChapterNumber = 1;
  let currentChapterTitle = 'BAB I PENDAHULUAN';
  let chapterImageCount: Record<number, number> = {};
  let chapterTableCount: Record<number, number> = {};

  // First pass: identify headings & chapters
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.tag === 'p') {
      const text = extractTextFromXml(el.xml);
      const isHeading1 = /<w:pStyle\b[^>]*w:val=["']Heading1["']/i.test(el.xml) ||
                         /<w:pStyle\b[^>]*w:val=["']Heading 1["']/i.test(el.xml);

      const babMatch = /^(?:bab|chapter)\s+([ivx\d]+)(?:\s*[:.\-]\s*|\s+)(.*)$/i.exec(text);

      if (babMatch || (isHeading1 && /^(?:bab|chapter)/i.test(text))) {
        let chNum = 1;
        if (babMatch) {
          const rawNum = babMatch[1];
          chNum = /^\d+$/.test(rawNum) ? parseInt(rawNum) : romanToArabic(rawNum);
        } else {
          chNum = chapters.length + 1;
        }

        currentChapterNumber = chNum;
        currentChapterTitle = text.slice(0, 60);

        if (!chapters.some((c) => c.number === chNum)) {
          chapters.push({ number: chNum, title: currentChapterTitle });
        }
      }
    }
  }

  // If no chapters detected, provide a default Chapter 1
  if (chapters.length === 0) {
    chapters.push({ number: 1, title: 'Dokumen Utama' });
  }

  // Reset counters for second pass
  currentChapterNumber = 1;
  currentChapterTitle = chapters[0].title;
  chapterImageCount = {};
  chapterTableCount = {};

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];

    if (el.tag === 'p') {
      const text = extractTextFromXml(el.xml);
      const babMatch = /^(?:bab|chapter)\s+([ivx\d]+)/i.exec(text);
      if (babMatch) {
        const rawNum = babMatch[1];
        const chNum = /^\d+$/.test(rawNum) ? parseInt(rawNum) : romanToArabic(rawNum);
        currentChapterNumber = chNum;
        currentChapterTitle = text.slice(0, 60);
      }

      // Check if paragraph contains an image / drawing
      const hasDrawing = /<w:drawing\b/i.test(el.xml) || /<w:pict\b/i.test(el.xml);
      if (hasDrawing) {
        // Extract embed ID
        let relId: string | null = null;
        const blipMatch = /r:embed=["']([^"']+)["']/i.exec(el.xml);
        if (blipMatch) {
          relId = blipMatch[1];
        } else {
          const vmlMatch = /r:id=["']([^"']+)["']/i.exec(el.xml);
          if (vmlMatch) relId = vmlMatch[1];
        }

        // Try extracting image thumbnail
        let thumbnailDataUrl: string | undefined = undefined;
        if (relId && relsMap[relId]) {
          const imgPath = relsMap[relId];
          const imgZipFile = zip.file(imgPath);
          if (imgZipFile) {
            try {
              const b64 = await imgZipFile.async('base64');
              const ext = imgPath.split('.').pop()?.toLowerCase() || 'png';
              const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
              thumbnailDataUrl = `data:${mime};base64,${b64}`;
            } catch (e) {
              console.warn('Could not extract thumbnail', e);
            }
          }
        }

        // Check neighboring paragraph for existing caption
        let existingCaption: string | undefined = undefined;
        // Check next paragraph
        if (i + 1 < elements.length && elements[i + 1].tag === 'p') {
          const nextText = extractTextFromXml(elements[i + 1].xml);
          if (/^(?:gambar|figure|fig\.)\s*[\d.]+/i.test(nextText)) {
            existingCaption = nextText;
          }
        }
        // Check current paragraph text (if caption was in same paragraph)
        if (!existingCaption) {
          if (/^(?:gambar|figure|fig\.)\s*[\d.]+/i.test(text)) {
            existingCaption = text;
          }
        }

        chapterImageCount[currentChapterNumber] = (chapterImageCount[currentChapterNumber] || 0) + 1;
        const itemNumber = chapterImageCount[currentChapterNumber];
        const fullNumber = `${currentChapterNumber}.${itemNumber}`;

        // Suggested title: from existing caption or generic
        let customTitle = `Diagram Sistem ${itemNumber}`;
        if (existingCaption) {
          const cleanCap = existingCaption.replace(/^(?:gambar|figure|fig\.)\s*[\d.:\-\s]+/i, '').trim();
          if (cleanCap) customTitle = cleanCap;
        }

        items.push({
          id: `img-${items.length}`,
          kind: 'image',
          rawIndex: i,
          chapterNumber: currentChapterNumber,
          chapterTitle: currentChapterTitle,
          itemNumber,
          fullNumber,
          customTitle,
          enabled: true,
          position: 'below',
          existingCaption,
          hasExistingCaption: !!existingCaption,
          thumbnailDataUrl,
        });
      }
    } else if (el.tag === 'tbl') {
      // It's a Table
      // Count rows
      const rowMatches = el.xml.match(/<w:tr\b/gi) || [];
      const rows = rowMatches.length;

      // Extract sample first row cells
      let cols = 0;
      let sampleHeader = '';
      const firstTrMatch = /<w:tr\b[\s\S]*?<\/w:tr>/i.exec(el.xml);
      if (firstTrMatch) {
        const tcMatches = firstTrMatch[0].match(/<w:tc\b[\s\S]*?<\/w:tc>/gi) || [];
        cols = tcMatches.length;
        const headerTexts = tcMatches.slice(0, 4).map((tc) => extractTextFromXml(tc));
        sampleHeader = headerTexts.filter(Boolean).join(' | ');
      }

      // Check preceding paragraph for existing table caption
      let existingCaption: string | undefined = undefined;
      if (i > 0 && elements[i - 1].tag === 'p') {
        const prevText = extractTextFromXml(elements[i - 1].xml);
        if (/^(?:tabel|table|tab\.)\s*[\d.]+/i.test(prevText)) {
          existingCaption = prevText;
        }
      }

      chapterTableCount[currentChapterNumber] = (chapterTableCount[currentChapterNumber] || 0) + 1;
      const itemNumber = chapterTableCount[currentChapterNumber];
      const fullNumber = `${currentChapterNumber}.${itemNumber}`;

      let customTitle = sampleHeader ? `Data ${sampleHeader}` : `Data Pengujian ${itemNumber}`;
      if (existingCaption) {
        const cleanCap = existingCaption.replace(/^(?:tabel|table|tab\.)\s*[\d.:\-\s]+/i, '').trim();
        if (cleanCap) customTitle = cleanCap;
      }

      items.push({
        id: `tbl-${items.length}`,
        kind: 'table',
        rawIndex: i,
        chapterNumber: currentChapterNumber,
        chapterTitle: currentChapterTitle,
        itemNumber,
        fullNumber,
        customTitle,
        enabled: true,
        position: 'above',
        existingCaption,
        hasExistingCaption: !!existingCaption,
        tableSummary: {
          rows,
          cols,
          sampleHeader,
        },
      });
    }
  }

  const totalImages = items.filter((it) => it.kind === 'image').length;
  const totalTables = items.filter((it) => it.kind === 'table').length;

  return {
    file,
    fileName: file.name,
    fileSize: file.size,
    totalImages,
    totalTables,
    totalHeadings: chapters.length,
    chapters,
    items,
  };
}

/**
 * Build Word OpenXML Caption Paragraph XML
 */
export function buildCaptionParagraphXml(
  kind: 'image' | 'table',
  prefix: string,
  separator: string,
  numberingMode: CaptionNumberingMode,
  chapterNumber: number,
  itemNumber: number,
  consecutiveNumber: number,
  title: string,
  alignment: CaptionAlignment
): string {
  const seqIdentifier = kind === 'image' ? 'Gambar' : 'Tabel';
  const cleanTitle = title.trim();

  let numberingXml = '';
  if (numberingMode === 'chapter') {
    // Dynamic Word field STYLEREF 1 \s + SEQ with \s 1 (resets per Heading 1)
    numberingXml = `
      <w:fldSimple w:instr="STYLEREF 1 \\s">
        <w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>${chapterNumber}</w:t></w:r>
      </w:fldSimple>
      <w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>${separator}</w:t></w:r>
      <w:fldSimple w:instr="SEQ ${seqIdentifier} \\* ARABIC \\s 1">
        <w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>${itemNumber}</w:t></w:r>
      </w:fldSimple>`;
  } else {
    // Consecutive numbering
    numberingXml = `
      <w:fldSimple w:instr="SEQ ${seqIdentifier} \\* ARABIC">
        <w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>${consecutiveNumber}</w:t></w:r>
      </w:fldSimple>`;
  }

  return `<w:p>
    <w:pPr>
      <w:pStyle w:val="Caption"/>
      <w:jc w:val="${alignment}"/>
      <w:spacing w:before="120" w:after="240" w:line="240" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:b/><w:i/><w:color w:val="1E293B"/></w:rPr>
      <w:t xml:space="preserve">${prefix} </w:t>
    </w:r>
    ${numberingXml}
    <w:r>
      <w:rPr><w:b/><w:i/><w:color w:val="1E293B"/></w:rPr>
      <w:t xml:space="preserve"> ${cleanTitle}</w:t>
    </w:r>
  </w:p>`;
}

/**
 * Build Word OpenXML List of Figures / Tables (Daftar Gambar / Daftar Tabel) block
 */
export function buildListOfBlockXml(
  kind: 'image' | 'table',
  title: string,
  prefix: string,
  items: { fullNumber: string; title: string }[]
): string {
  const seqIdentifier = kind === 'image' ? 'Gambar' : 'Tabel';

  // Dotted items for immediate visual display across all Word viewers
  const dottedEntriesXml = items
    .map(
      (it) => `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="TableofFigures"/>
        <w:tabs>
          <w:tab w:val="right" w:leader="dot" w:pos="9350"/>
        </w:tabs>
        <w:spacing w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:color w:val="1E293B"/></w:rPr>
        <w:t xml:space="preserve">${prefix} ${it.fullNumber}  ${it.title}</w:t>
      </w:r>
      <w:r><w:tab/></w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:color w:val="64748B"/></w:rPr>
        <w:t>...</w:t>
      </w:r>
    </w:p>`
    )
    .join('\n');

  return `
  <!-- ================= ${title} ================= -->
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Heading1"/>
      <w:jc w:val="center"/>
      <w:spacing w:before="400" w:after="300"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr>
      <w:t>${title}</w:t>
    </w:r>
  </w:p>

  <!-- Word Dynamic TOC Field for ${seqIdentifier} -->
  <w:p>
    <w:pPr><w:spacing w:after="160"/></w:pPr>
    <w:fldSimple w:instr="TOC \\h \\z \\c &quot;${seqIdentifier}&quot;"/>
  </w:p>

  ${dottedEntriesXml}

  <!-- Page Break After List -->
  <w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

/**
 * Main Engine: Apply automated captions to drawings & tables and generate Daftar Gambar / Daftar Tabel in DOCX
 */
export async function applyCaptionsToDocx(
  file: File,
  config: CaptionJobConfig
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('word/document.xml tidak ditemukan');
  }

  const docXml = await docFile.async('text');

  // Extract body inner XML
  const bodyMatch = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(docXml);
  if (!bodyMatch) {
    throw new Error('Struktur <w:body> tidak ditemukan dalam dokumen Word.');
  }

  const bodyContent = bodyMatch[1];

  // Regex to split body into discrete top-level elements: <w:p>, <w:tbl>, and final <w:sectPr>
  const elemRegex = /(<w:p\b[\s\S]*?<\/w:p>|<w:tbl\b[\s\S]*?<\/w:tbl>|<w:sectPr\b[\s\S]*?<\/w:sectPr>)/gi;
  const elements: { tag: 'p' | 'tbl' | 'sectPr'; xml: string }[] = [];
  let em: RegExpExecArray | null;

  while ((em = elemRegex.exec(bodyContent)) !== null) {
    const xml = em[1];
    let tag: 'p' | 'tbl' | 'sectPr' = 'p';
    if (xml.startsWith('<w:tbl')) tag = 'tbl';
    else if (xml.startsWith('<w:sectPr')) tag = 'sectPr';
    elements.push({ tag, xml });
  }

  // Pre-calculate sequential numbering
  let consecutiveImgCount = 0;
  let consecutiveTblCount = 0;
  const chapterImgCount: Record<number, number> = {};
  const chapterTblCount: Record<number, number> = {};

  // Map item configurations by raw index or kind
  const itemConfigMap = new Map<number, DocxCaptionItem>();
  config.items.forEach((item) => {
    itemConfigMap.set(item.rawIndex, item);
  });

  const generatedFigureList: { fullNumber: string; title: string }[] = [];
  const generatedTableList: { fullNumber: string; title: string }[] = [];

  let currentChapterNumber = 1;
  const newBodyElements: string[] = [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];

    if (el.tag === 'sectPr') {
      newBodyElements.push(el.xml);
      continue;
    }

    if (el.tag === 'p') {
      const text = extractTextFromXml(el.xml);

      // Track Chapter
      const babMatch = /^(?:bab|chapter)\s+([ivx\d]+)/i.exec(text);
      if (babMatch) {
        const rawNum = babMatch[1];
        currentChapterNumber = /^\d+$/.test(rawNum) ? parseInt(rawNum) : romanToArabic(rawNum);
      }

      // Check if this paragraph contains an image / drawing
      const hasDrawing = /<w:drawing\b/i.test(el.xml) || /<w:pict\b/i.test(el.xml);

      if (hasDrawing) {
        const itemConfig = itemConfigMap.get(i);
        const isEnabled = itemConfig ? itemConfig.enabled : true;

        if (isEnabled) {
          consecutiveImgCount++;
          chapterImgCount[currentChapterNumber] = (chapterImgCount[currentChapterNumber] || 0) + 1;
          const chItemNum = chapterImgCount[currentChapterNumber];

          const fullNum =
            config.numberingMode === 'chapter'
              ? `${currentChapterNumber}${config.separator}${chItemNum}`
              : `${consecutiveImgCount}`;

          const title = itemConfig?.customTitle || `Gambar ${fullNum}`;
          const position = itemConfig?.position || config.imagePosition || 'below';

          const captionXml = buildCaptionParagraphXml(
            'image',
            config.imagePrefix || 'Gambar',
            config.separator || '.',
            config.numberingMode || 'chapter',
            currentChapterNumber,
            chItemNum,
            consecutiveImgCount,
            title,
            config.alignment || 'center'
          );

          generatedFigureList.push({ fullNumber: fullNum, title });

          if (position === 'above') {
            newBodyElements.push(captionXml);
            newBodyElements.push(el.xml);
          } else {
            newBodyElements.push(el.xml);
            newBodyElements.push(captionXml);
          }

          // If next paragraph was an existing caption and user chose replaceExistingCaptions, skip it
          if (config.replaceExistingCaptions && i + 1 < elements.length && elements[i + 1].tag === 'p') {
            const nextText = extractTextFromXml(elements[i + 1].xml);
            if (/^(?:gambar|figure|fig\.)\s*[\d.]+/i.test(nextText)) {
              i++; // Skip duplicate old caption
            }
          }
          continue;
        }
      }

      newBodyElements.push(el.xml);
    } else if (el.tag === 'tbl') {
      const itemConfig = itemConfigMap.get(i);
      const isEnabled = itemConfig ? itemConfig.enabled : true;

      if (isEnabled) {
        consecutiveTblCount++;
        chapterTblCount[currentChapterNumber] = (chapterTblCount[currentChapterNumber] || 0) + 1;
        const chItemNum = chapterTblCount[currentChapterNumber];

        const fullNum =
          config.numberingMode === 'chapter'
            ? `${currentChapterNumber}${config.separator}${chItemNum}`
            : `${consecutiveTblCount}`;

        const title = itemConfig?.customTitle || `Tabel ${fullNum}`;
        const position = itemConfig?.position || config.tablePosition || 'above';

        const captionXml = buildCaptionParagraphXml(
          'table',
          config.tablePrefix || 'Tabel',
          config.separator || '.',
          config.numberingMode || 'chapter',
          currentChapterNumber,
          chItemNum,
          consecutiveTblCount,
          title,
          config.alignment || 'center'
        );

        generatedTableList.push({ fullNumber: fullNum, title });

        // If previous element in newBodyElements was an existing table caption and replaceExistingCaptions is true, remove it
        if (config.replaceExistingCaptions && newBodyElements.length > 0) {
          const lastAdded = newBodyElements[newBodyElements.length - 1];
          const lastText = extractTextFromXml(lastAdded);
          if (/^(?:tabel|table|tab\.)\s*[\d.]+/i.test(lastText)) {
            newBodyElements.pop(); // Remove old caption
          }
        }

        if (position === 'above') {
          newBodyElements.push(captionXml);
          newBodyElements.push(el.xml);
        } else {
          newBodyElements.push(el.xml);
          newBodyElements.push(captionXml);
        }
        continue;
      }

      newBodyElements.push(el.xml);
    }
  }

  // Generate Daftar Gambar and/or Daftar Tabel blocks if requested
  let listsXml = '';
  if (config.includeListOfFigures && generatedFigureList.length > 0) {
    listsXml += buildListOfBlockXml(
      'image',
      config.listOfFiguresTitle || 'DAFTAR GAMBAR',
      config.imagePrefix || 'Gambar',
      generatedFigureList
    );
  }
  if (config.includeListOfTables && generatedTableList.length > 0) {
    listsXml += buildListOfBlockXml(
      'table',
      config.listOfTablesTitle || 'DAFTAR TABEL',
      config.tablePrefix || 'Tabel',
      generatedTableList
    );
  }

  if (listsXml) {
    if (config.listOfPosition === 'end-of-doc') {
      // Append before final element
      newBodyElements.push(listsXml);
    } else {
      // Find position before first BAB I or after Daftar Isi
      let insertIndex = -1;
      for (let j = 0; j < newBodyElements.length; j++) {
        const text = extractTextFromXml(newBodyElements[j]);
        if (/^(?:bab\s+1\b|bab\s+i\b)/i.test(text)) {
          insertIndex = j;
          break;
        }
      }

      if (insertIndex !== -1) {
        newBodyElements.splice(insertIndex, 0, listsXml);
      } else {
        // Fallback: insert after first paragraph
        newBodyElements.splice(1, 0, listsXml);
      }
    }
  }

  // Reconstruct document.xml
  const updatedDocXml = docXml.replace(
    /<w:body\b[^>]*>[\s\S]*?<\/w:body>/i,
    `<w:body>${newBodyElements.join('\n')}</w:body>`
  );

  zip.file('word/document.xml', updatedDocXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
