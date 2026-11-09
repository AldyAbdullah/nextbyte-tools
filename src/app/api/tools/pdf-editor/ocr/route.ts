import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pageIndexStr = formData.get('pageIndex') as string | null;
    const pageIndex = pageIndexStr ? parseInt(pageIndexStr, 10) : 0;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file PDF yang diunggah.' }, { status: 400 });
    }

    // Limit single file size to 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file PDF maksimal 50MB.' }, { status: 400 });
    }

    // Write buffer to temporary file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempFileName = `nextbyte_pdf_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.pdf`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);
    await fs.promises.writeFile(tempFilePath, buffer);

    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'page_ocr.py');
    const tessdataPath = path.join(process.cwd(), 'src', 'scripts', 'tessdata');

    // Run Python OCR script strictly for this single page
    const pythonResult = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const child = spawn('python', [scriptPath, tempFilePath!, pageIndex.toString(), tessdataPath], {
        timeout: 25000, // 25s timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, code: code ?? 1 });
      });

      child.on('error', (err) => {
        resolve({ stdout, stderr: err.message, code: 1 });
      });
    });

    if (pythonResult.code !== 0 && !pythonResult.stdout) {
      console.error('Python OCR error:', pythonResult.stderr);
      return NextResponse.json(
        { error: 'Gagal menjalankan pemindaian OCR pada halaman ini.', details: pythonResult.stderr },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(pythonResult.stdout.trim());
      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: 'Format data OCR tidak valid dari mesin Python.', raw: pythonResult.stdout },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanErr) {
        console.warn('Failed to delete temp file:', cleanErr);
      }
    }
  }
}
