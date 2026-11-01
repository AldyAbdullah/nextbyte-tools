import JSZip from 'jszip';
import { MailMergeTemplateInfo, ImageDimensionConfig } from '@/types/mailMerge';

/**
 * Escape XML special characters to prevent corrupting OpenXML documents
 */
export function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Unescape XML entities back to plain text
 */
export function unescapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Convert centimeters to EMUs (English Metric Units)
 * 1 cm = 360,000 EMUs
 */
export function cmToEmu(cm: number): number {
  return Math.round(cm * 360000);
}

/**
 * Scan a DOCX file to detect all placeholders, image tags, and paragraph text
 */
export async function scanDocxTemplate(file: File): Promise<MailMergeTemplateInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const variablesSet = new Set<string>();
  const imageVarsSet = new Set<string>();
  const textSnippets: string[] = [];

  // Target XML files that might contain placeholders
  const xmlFiles = Object.keys(zip.files).filter((fileName) => {
    return (
      fileName === 'word/document.xml' ||
      /^word\/header\d+\.xml$/.test(fileName) ||
      /^word\/footer\d+\.xml$/.test(fileName)
    );
  });

  for (const xmlFile of xmlFiles) {
    const fileData = zip.file(xmlFile);
    if (!fileData) continue;
    const content = await fileData.async('text');

    // Also check for image placeholders with alt text in DrawingML: <wp:docPr ... descr="{{foto}}" or name="{{foto}}" or title="{{foto}}">
    const docPrRegex = /<wp:docPr[^>]+(?:descr|name|title)=["']([^"']+)["'][^>]*>/gi;
    let docPrMatch: RegExpExecArray | null;
    while ((docPrMatch = docPrRegex.exec(content)) !== null) {
      const descr = docPrMatch[1].trim();
      const match =
        descr.match(/^\{\{([^{}]+)\}\}$/) ||
        descr.match(/^\{%([^{}]+)\}$/) ||
        descr.match(/^<<([^<>]+)>>$/) ||
        descr.match(/^\{([^{}]+)\}$/);
      let varName: string | null = null;
      if (match) {
        varName = match[1].trim().toLowerCase();
      } else if (/^(foto|photo|gambar|image|avatar|pic|picture|pasfoto)$/i.test(descr)) {
        varName = descr.trim().toLowerCase();
      }
      if (varName) {
        variablesSet.add(varName);
        imageVarsSet.add(varName);
      }
    }

    // Also check for image placeholders in legacy VML shapes: <v:shape ... alt="{{foto}}" or title="{{foto}}">
    const vmlShapeRegex = /<v:shape[^>]+(?:alt|title|name)=["']([^"']+)["'][^>]*>/gi;
    let vmlMatch: RegExpExecArray | null;
    while ((vmlMatch = vmlShapeRegex.exec(content)) !== null) {
      const alt = vmlMatch[1].trim();
      const match =
        alt.match(/^\{\{([^{}]+)\}\}$/) ||
        alt.match(/^\{%([^{}]+)\}$/) ||
        alt.match(/^<<([^<>]+)>>$/) ||
        alt.match(/^\{([^{}]+)\}$/);
      let varName: string | null = null;
      if (match) {
        varName = match[1].trim().toLowerCase();
      } else if (/^(foto|photo|gambar|image|avatar|pic|picture|pasfoto)$/i.test(alt)) {
        varName = alt.trim().toLowerCase();
      }
      if (varName) {
        variablesSet.add(varName);
        imageVarsSet.add(varName);
      }
    }

    // Extract text paragraphs
    const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pRegex.exec(content)) !== null) {
      const pInner = pMatch[1];
      // Concatenate all text runs in this paragraph
      const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi;
      let combinedPText = '';
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tRegex.exec(pInner)) !== null) {
        combinedPText += unescapeXml(tMatch[1]);
      }

      if (combinedPText.trim().length > 0 && textSnippets.length < 15) {
        textSnippets.push(combinedPText.trim());
      }

      // 1. Detect {{variable}} and { %variable }
      const doubleBraceRegex = /\{\{([^{}]+)\}\}/g;
      let varMatch: RegExpExecArray | null;
      while ((varMatch = doubleBraceRegex.exec(combinedPText)) !== null) {
        const rawVar = varMatch[1].trim();
        // Skip conditionals tags prefix if present: #var, ^var, /var
        const cleanVar = rawVar.replace(/^[#^/]/, '').trim();
        if (cleanVar) {
          variablesSet.add(cleanVar);
          if (/^(foto|photo|gambar|image|avatar|pic|picture)$/i.test(cleanVar)) {
            imageVarsSet.add(cleanVar);
          }
        }
      }

      // 2. Detect {%variable}
      const percentVarRegex = /\{%([^{}]+)\}/g;
      while ((varMatch = percentVarRegex.exec(combinedPText)) !== null) {
        const cleanVar = varMatch[1].trim();
        if (cleanVar) {
          variablesSet.add(cleanVar);
          imageVarsSet.add(cleanVar);
        }
      }

      // 3. Detect <<variable>>
      const angleVarRegex = /<<([^<>]+)>>/g;
      while ((varMatch = angleVarRegex.exec(combinedPText)) !== null) {
        const cleanVar = varMatch[1].trim();
        if (cleanVar) {
          variablesSet.add(cleanVar);
          if (/^(foto|photo|gambar|image|avatar|pic|picture)$/i.test(cleanVar)) {
            imageVarsSet.add(cleanVar);
          }
        }
      }
    }
  }

  const detectedVariables = Array.from(variablesSet).sort((a, b) => a.localeCompare(b));
  const imageVariables = Array.from(imageVarsSet).sort((a, b) => a.localeCompare(b));

  return {
    file,
    name: file.name,
    size: file.size,
    detectedVariables,
    imageVariables,
    rawTextPreview: textSnippets.join('\n\n'),
  };
}

/**
 * Normalizes and replaces placeholders within a single OpenXML paragraph string
 */
export function processParagraphPlaceholders(
  pXml: string,
  data: Record<string, string>,
  imageReplacements: Map<string, string> // tag -> XML string for <w:drawing>
): string {
  // Check if paragraph contains <w:t> tags
  if (!pXml.includes('<w:t')) return pXml;

  // Extract all <w:t> occurrences with their exact positions inside pXml
  const tMatches: { fullMatch: string; tagPrefix: string; text: string; index: number }[] = [];
  const tRegex = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/gi;
  let m: RegExpExecArray | null;

  while ((m = tRegex.exec(pXml)) !== null) {
    tMatches.push({
      fullMatch: m[0],
      tagPrefix: m[1],
      text: unescapeXml(m[2]),
      index: m.index,
    });
  }

  if (tMatches.length === 0) return pXml;

  // Build combined text and character offset maps
  let combinedText = '';
  const charMap: { nodeIndex: number; localCharIndex: number }[] = [];

  for (let nodeIdx = 0; nodeIdx < tMatches.length; nodeIdx++) {
    const nodeText = tMatches[nodeIdx].text;
    for (let charIdx = 0; charIdx < nodeText.length; charIdx++) {
      charMap.push({ nodeIndex: nodeIdx, localCharIndex: charIdx });
    }
    combinedText += nodeText;
  }

  // Check if combinedText has any potential placeholder or conditional
  if (!combinedText.includes('{{') && !combinedText.includes('{%') && !combinedText.includes('<<')) {
    return pXml;
  }

  let processedCombinedText = combinedText;

  // Evaluate {{#key}}content{{/key}}
  processedCombinedText = processedCombinedText.replace(
    /\{\{#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]+)\}\}([\s\S]*?)\{\{\/\1\}\}/gi,
    (_, key, content) => {
      const val = (data[key] ?? data[key.toLowerCase()] ?? '').trim();
      const isTruthy = val !== '' && val !== '0' && val.toLowerCase() !== 'false' && val !== '-';
      return isTruthy ? content : '';
    }
  );

  // Evaluate {{^key}}content{{/key}}
  processedCombinedText = processedCombinedText.replace(
    /\{\{\^([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]+)\}\}([\s\S]*?)\{\{\/\1\}\}/gi,
    (_, key, content) => {
      const val = (data[key] ?? data[key.toLowerCase()] ?? '').trim();
      const isTruthy = val !== '' && val !== '0' && val.toLowerCase() !== 'false' && val !== '-';
      return isTruthy ? '' : content;
    }
  );

  // Check if any image placeholder tag is present in this paragraph
  let hasImageReplacement = false;
  let pXmlModified = pXml;

  for (const [imgTag] of imageReplacements.entries()) {
    const patterns = [
      `{{${imgTag}}}`,
      `{%${imgTag}}`,
      `<<${imgTag}>>`,
    ];
    for (const pat of patterns) {
      if (processedCombinedText.includes(pat)) {
        hasImageReplacement = true;
        processedCombinedText = processedCombinedText.split(pat).join('');
      }
    }
  }

  // Replace text variables: {{key}}, {%key}, <<key>>
  const replaceVar = (rawVar: string): string => {
    const cleanKey = rawVar.trim();
    if (cleanKey in data) return escapeXml(data[cleanKey]);
    const lowerKey = cleanKey.toLowerCase();
    if (lowerKey in data) return escapeXml(data[lowerKey]);
    for (const [k, v] of Object.entries(data)) {
      if (k.toLowerCase() === lowerKey) return escapeXml(v);
    }
    return '';
  };

  processedCombinedText = processedCombinedText.replace(/\{\{([^{}]+)\}\}/g, (_, k) => replaceVar(k));
  processedCombinedText = processedCombinedText.replace(/\{%([^{}]+)\}/g, (_, k) => replaceVar(k));
  processedCombinedText = processedCombinedText.replace(/<<([^<>]+)>>/g, (_, k) => replaceVar(k));

  if (processedCombinedText === combinedText && !hasImageReplacement) {
    return pXml;
  }

  // Update <w:t> tags in this paragraph
  let isFirst = true;
  pXmlModified = pXmlModified.replace(tRegex, (match, prefix, _, suffix) => {
    if (isFirst) {
      isFirst = false;
      return `${prefix}${processedCombinedText}${suffix}`;
    }
    return `${prefix}${suffix}`;
  });

  if (hasImageReplacement) {
    for (const [, drawingXml] of imageReplacements.entries()) {
      if (drawingXml) {
        pXmlModified = pXmlModified.replace(/<\/w:p>$/, `${drawingXml}</w:p>`);
      }
    }
  }

  return pXmlModified;
}

/**
 * Builds OpenXML DrawingML markup for an inline image
 */
export function buildInlineImageDrawingXml(
  relId: string,
  widthCm: number,
  heightCm: number,
  uniqueDocId: number,
  imageName: string
): string {
  const cx = cmToEmu(widthCm);
  const cy = cmToEmu(heightCm);

  return `<w:r>
  <w:rPr><w:noProof/></w:rPr>
  <w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="${cx}" cy="${cy}"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="${uniqueDocId}" name="${escapeXml(imageName)}"/>
      <wp:cNvGraphicFramePr>
        <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
      </wp:cNvGraphicFramePr>
      <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:nvPicPr>
              <pic:cNvPr id="${uniqueDocId}" name="${escapeXml(imageName)}"/>
              <pic:cNvPicPr/>
            </pic:nvPicPr>
            <pic:blipFill>
              <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${relId}"/>
              <a:stretch><a:fillRect/></a:stretch>
            </pic:blipFill>
            <pic:spPr>
              <a:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="${cx}" cy="${cy}"/>
              </a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </pic:spPr>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing>
</w:r>`;
}

/**
 * Ensure image extension is registered in [Content_Types].xml
 */
export async function ensureContentType(zip: JSZip, ext: string): Promise<void> {
  const ctFile = zip.file('[Content_Types].xml');
  if (!ctFile) return;

  let ctXml = await ctFile.async('text');
  const lowerExt = ext.toLowerCase().replace(/^\./, '');
  let mime = 'image/jpeg';
  if (lowerExt === 'png') mime = 'image/png';
  if (lowerExt === 'webp') mime = 'image/webp';
  if (lowerExt === 'gif') mime = 'image/gif';

  if (!ctXml.includes(`Extension="${lowerExt}"`)) {
    ctXml = ctXml.replace(
      '</Types>',
      `  <Default Extension="${lowerExt}" ContentType="${mime}"/>\n</Types>`
    );
    zip.file('[Content_Types].xml', ctXml);
  }
}

/**
 * Helper to check if an alt/title/name attribute matches an image tag
 */
function attributeMatchesTag(attrValue: string, targetTag: string): boolean {
  const cleanVal = attrValue.trim().toLowerCase();
  const cleanTarget = targetTag.trim().toLowerCase();
  if (cleanVal === cleanTarget) return true;
  if (cleanVal === `{{${cleanTarget}}}`) return true;
  if (cleanVal === `{%${cleanTarget}}`) return true;
  if (cleanVal === `<<${cleanTarget}>>`) return true;
  if (cleanVal === `{${cleanTarget}}`) return true;
  if (cleanVal.includes(`{{${cleanTarget}}}`)) return true;
  if (cleanVal.includes(`{%${cleanTarget}}`)) return true;
  if (cleanVal.includes(`<<${cleanTarget}>>`)) return true;
  return false;
}

/**
 * Replace dummy image placeholders (DrawingML <w:drawing> and VML <w:pict>) with the actual recipient photo relationship ID.
 * This preserves all existing shape styling, borders, dimensions, wrapping, and exact page positioning.
 */
export function replaceDummyImagesInXml(
  xmlContent: string,
  imageTagToRelId: Map<string, string>
): { xml: string; replacedTags: Set<string> } {
  const replacedTags = new Set<string>();
  let result = xmlContent;

  // 1. DrawingML: <w:drawing> ... </w:drawing>
  result = result.replace(/<w:drawing\b[\s\S]*?<\/w:drawing>/gi, (drawingXml) => {
    // Extract wp:docPr tag
    const docPrMatch = /<wp:docPr\b[^>]*>/i.exec(drawingXml);
    if (!docPrMatch) return drawingXml;

    const docPrTag = docPrMatch[0];
    const attrRegex = /\b(?:descr|name|title)=["']([^"']*)["']/gi;
    const attrValues: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(docPrTag)) !== null) {
      if (m[1].trim()) attrValues.push(m[1].trim());
    }

    for (const [tag, relId] of imageTagToRelId.entries()) {
      const isMatched = attrValues.some((v) => attributeMatchesTag(v, tag));
      if (isMatched) {
        // Replace <a:blip ... r:embed="..."/>
        if (/<a:blip\b[^>]*\br:embed="[^"]+"/i.test(drawingXml)) {
          const updatedDrawing = drawingXml.replace(
            /(<a:blip\b[^>]*?\br:embed=")[^"]+(")/i,
            `$1${relId}$2`
          );
          replacedTags.add(tag.toLowerCase());
          return updatedDrawing;
        }
      }
    }

    return drawingXml;
  });

  // 2. VML Shapes: <w:pict> ... </w:pict>
  result = result.replace(/<w:pict\b[\s\S]*?<\/w:pict>/gi, (pictXml) => {
    const vmlShapeMatch = /<v:shape\b[^>]*>/i.exec(pictXml);
    if (!vmlShapeMatch) return pictXml;

    const shapeTag = vmlShapeMatch[0];
    const attrRegex = /\b(?:alt|title|name|id)=["']([^"']*)["']/gi;
    const attrValues: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(shapeTag)) !== null) {
      if (m[1].trim()) attrValues.push(m[1].trim());
    }

    for (const [tag, relId] of imageTagToRelId.entries()) {
      const isMatched = attrValues.some((v) => attributeMatchesTag(v, tag));
      if (isMatched) {
        // Replace <v:imagedata ... r:id="..."/>
        if (/<v:imagedata\b[^>]*\br:id="[^"]+"/i.test(pictXml)) {
          const updatedPict = pictXml.replace(
            /(<v:imagedata\b[^>]*?\br:id=")[^"]+(")/i,
            `$1${relId}$2`
          );
          replacedTags.add(tag.toLowerCase());
          return updatedPict;
        }
      }
    }

    return pictXml;
  });

  return { xml: result, replacedTags };
}

/**
 * Generate a single DOCX document from template and row data
 */
export async function generateSingleDocx(
  templateZipData: ArrayBuffer,
  data: Record<string, string>,
  imageFiles: Map<string, ArrayBuffer>,
  imageDimensions: ImageDimensionConfig,
  rowIndex: number
): Promise<Blob> {
  const zip = await JSZip.loadAsync(templateZipData);

  const imageReplacements = new Map<string, string>();
  let relsXml = '';
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    relsXml = await relsFile.async('text');
  }

  let nextRelIdIndex = 9000 + rowIndex * 10;
  let uniqueDocId = 50000 + rowIndex * 10;

  const tagToRelId = new Map<string, string>();

  for (const [tag, imgBuffer] of imageFiles.entries()) {
    const ext = detectImageExtension(imgBuffer);
    await ensureContentType(zip, ext);

    const mediaPath = `word/media/nb_photo_${rowIndex}_${uniqueDocId}.${ext}`;
    zip.file(mediaPath, imgBuffer);

    const relId = `rId_nb_photo_${nextRelIdIndex++}`;
    if (relsXml) {
      const relEntry = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/nb_photo_${rowIndex}_${uniqueDocId}.${ext}"/>`;
      relsXml = relsXml.replace('</Relationships>', `  ${relEntry}\n</Relationships>`);
    }

    tagToRelId.set(tag.toLowerCase(), relId);

    const drawingXml = buildInlineImageDrawingXml(
      relId,
      imageDimensions.widthCm,
      imageDimensions.heightCm,
      uniqueDocId++,
      `Photo_${data['nama'] || rowIndex}`
    );

    imageReplacements.set(tag, drawingXml);
  }

  if (relsFile && relsXml) {
    zip.file('word/_rels/document.xml.rels', relsXml);
  }

  const xmlParts = Object.keys(zip.files).filter((name) => {
    return (
      name === 'word/document.xml' ||
      /^word\/header\d+\.xml$/.test(name) ||
      /^word\/footer\d+\.xml$/.test(name)
    );
  });

  const replacedDummyTags = new Set<string>();

  for (const partName of xmlParts) {
    const file = zip.file(partName);
    if (!file) continue;
    let xmlContent = await file.async('text');

    // 1. Replace any dummy images/shapes with matching Alt Text first
    const { xml: updatedXml, replacedTags } = replaceDummyImagesInXml(xmlContent, tagToRelId);
    xmlContent = updatedXml;
    replacedTags.forEach((t) => replacedDummyTags.add(t));

    // 2. Filter imageReplacements: if tag was already replaced in a dummy image, do not insert text drawing
    const remainingTextReplacements = new Map<string, string>();
    for (const [tag, drawing] of imageReplacements.entries()) {
      if (!replacedDummyTags.has(tag.toLowerCase())) {
        remainingTextReplacements.set(tag, drawing);
      }
    }

    // 3. Process text paragraphs for text variables and inline image tag fallbacks
    xmlContent = xmlContent.replace(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi, (pFull) => {
      return processParagraphPlaceholders(pFull, data, remainingTextReplacements);
    });

    zip.file(partName, xmlContent);
  }

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Detect image extension from magic numbers in ArrayBuffer
 */
export function detectImageExtension(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  if (bytes[0] === 0x89 && bytes[1] === 0x4e && bytes[2] === 0x47 && bytes[3] === 0x0d) {
    return 'png';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'webp';
  }
  return 'jpeg';
}
