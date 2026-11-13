import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createWorker } from 'tesseract.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds on serverless

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let worker: any = null;

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const pageWidthStr = formData.get('pageWidth') as string | null;
    const pageHeightStr = formData.get('pageHeight') as string | null;
    const canvasWidthStr = formData.get('canvasWidth') as string | null;
    const canvasHeightStr = formData.get('canvasHeight') as string | null;
    const lang = (formData.get('lang') as string | null) || 'ind+eng';
    const pageIndex = parseInt((formData.get('pageIndex') as string) || '0', 10);

    if (!imageFile) {
      return NextResponse.json({ error: 'Gambar halaman tidak ditemukan untuk OCR.' }, { status: 400 });
    }

    const pageWidth = pageWidthStr ? parseFloat(pageWidthStr) : 0;
    const pageHeight = pageHeightStr ? parseFloat(pageHeightStr) : 0;
    const canvasWidth = canvasWidthStr ? parseFloat(canvasWidthStr) : 0;
    const canvasHeight = canvasHeightStr ? parseFloat(canvasHeightStr) : 0;

    const scaleX = pageWidth > 0 && canvasWidth > 0 ? canvasWidth / pageWidth : 1;
    const scaleY = pageHeight > 0 && canvasHeight > 0 ? canvasHeight / pageHeight : 1;

    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Ensure cache directory in os.tmpdir() (always writable in AWS Lambda / Vercel)
    const tmpCacheDir = path.join(os.tmpdir(), 'nextbyte_tessdata');
    if (!fs.existsSync(tmpCacheDir)) {
      try {
        fs.mkdirSync(tmpCacheDir, { recursive: true });
      } catch {}
    }

    // Locate tessdata path (check candidate directories in runtime)
    const candidateDirs = [
      path.join(process.cwd(), 'public', 'tessdata'),
      path.join(process.cwd(), 'src', 'scripts', 'tessdata'),
      path.join(process.cwd(), 'tessdata'),
    ];

    let localTessdata: string | null = null;
    for (const dir of candidateDirs) {
      if (fs.existsSync(path.join(dir, 'eng.traineddata'))) {
        localTessdata = dir;
        break;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workerOptions: any = {
      cachePath: tmpCacheDir,
    };

    if (localTessdata) {
      workerOptions.langPath = localTessdata;
      workerOptions.cacheMethod = 'readOnly';
      workerOptions.gzip = false;
    } else {
      // If local files not bundled by serverless, fall back to official CDN with /tmp cache
      workerOptions.langPath = 'https://tessdata.projectnaptha.com/4.0.0';
      workerOptions.gzip = true;
    }

    // Initialize Server-Side OCR Worker
    try {
      worker = await createWorker(lang, 1, workerOptions);
    } catch (langErr) {
      console.warn(`Failed to initialize OCR with lang "${lang}", falling back to "eng":`, langErr);
      worker = await createWorker('eng', 1, workerOptions);
    }

    const ret = await worker.recognize(imageBuffer, {}, { blocks: true });

    const lines: Array<{
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      text: string;
      fontsize: number;
    }> = [];

    // Extract line bounding boxes from layout blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const block of (ret.data as any).blocks || []) {
      for (const para of block.paragraphs || []) {
        for (const line of para.lines || []) {
          const text = line.text?.trim();
          if (text) {
            const x0 = Math.round(line.bbox.x0 / scaleX);
            const y0 = Math.round(line.bbox.y0 / scaleY);
            const x1 = Math.round(line.bbox.x1 / scaleX);
            const y1 = Math.round(line.bbox.y1 / scaleY);
            const fontsize = Math.max(9, Math.round((y1 - y0) * 0.8));

            lines.push({
              x0,
              y0,
              x1,
              y1,
              text,
              fontsize,
            });
          }
        }
      }
    }

    return NextResponse.json({
      page_index: pageIndex,
      count: lines.length,
      lines,
    });
  } catch (err: unknown) {
    console.error('Server OCR error:', err);
    const message = err instanceof Error ? err.message : 'Gagal memproses OCR pada server.';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr) {
        console.warn('OCR worker terminate error:', termErr);
      }
    }
  }
}
