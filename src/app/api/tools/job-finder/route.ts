import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      query,
      location,
      jobType,
      experience,
      apiKey: bodyApiKey,
      model: selectedModel,
      jobTitle,
      company,
      requirements,
      applicantName,
      skills,
    } = body;

    // 1. Strict Security: Private API Key requirement
    // Only the user who provides a valid Gemini API key can use this feature!
    const apiKey = (
      req.headers.get('x-gemini-api-key') ||
      bodyApiKey ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Akses Privat: Kunci API Gemini diperlukan untuk menjalankan fitur ini.',
          needsApiKey: true,
        },
        { status: 401 }
      );
    }

    const modelName =
      selectedModel === 'gemini-1.5-pro'
        ? 'gemini-1.5-pro'
        : selectedModel === 'gemini-2.0-flash'
        ? 'gemini-2.0-flash'
        : 'gemini-2.5-flash';

    // 2. Action: Generate Cover Letter (Fast & Token-efficient, without search grounding)
    if (action === 'generate-cover-letter') {
      const prompt = `Anda adalah konsultan karir profesional Indonesia. Buatkan Surat Lamaran Pekerjaan (Cover Letter) resmi, profesional, dan meyakinkan dalam Bahasa Indonesia.

Data Lowongan:
- Posisi: ${jobTitle || 'Posisi Terpilih'}
- Perusahaan: ${company || 'Perusahaan Tujuan'}
- Kualifikasi Kunci: ${(requirements || []).join(', ')}

Data Pelamar:
- Nama Pelamar: ${applicantName || 'Pelamar'}
- Keahlian Utama: ${skills || 'Sesuai dengan kualifikasi yang dipersyaratkan'}

Instruksi Format:
Tuliskan surat lamaran lengkap yang siap pakai dengan susunan formal standar Indonesia:
- Tempat & Tanggal
- Hal & Lampiran
- Yth. HRD / Tim Rekrutmen
- Salam Pembuka
- Paragraf Pembuka (Menyatakan minat dan posisi yang dilamar)
- Paragraf Kualifikasi (Menghubungkan keahlian pelamar dengan kebutuhan perusahaan secara persuasif)
- Paragraf Penutup (Harapan untuk sesi wawancara dan apresiasi)
- Salam Penutup & Nama Lengkap

Gunakan bahasa Indonesia baku yang sopan, percaya diri, dan menarik minat HRD tanpa bertele-tele.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const message = errJson.error?.message || `Gemini API error (Status ${response.status})`;
        return NextResponse.json({ error: message }, { status: response.status });
      }

      const data = await response.json();
      const coverLetter = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return NextResponse.json({ coverLetter, usage: data.usageMetadata || null });
    }

    // 3. Action: Search Job Vacancies (with Google Search Grounding!)
    const searchPrompt = `Anda adalah asisten kurasi lowongan pekerjaan profesional. Lakukan pencarian lowongan kerja aktif dan nyata di Indonesia atau lokasi yang diminta.

Kriteria Pencarian:
- Posisi / Kata Kunci: "${query || 'Lowongan Kerja Terkini'}"
- Lokasi: "${location || 'Indonesia'}"
- Tipe Pekerjaan: "${jobType || 'Semua'}"
- Pengalaman: "${experience || 'Semua'}"

Gunakan Google Search untuk menemukan 4 hingga 6 lowongan kerja aktif yang paling relevan dari portal lowongan (seperti Jobstreet, LinkedIn, Glints, Kalibrr, KitaLulus, Karir.com, atau situs resmi karir perusahaan).

OUTPUT HARUS berupa JSON valid persis seperti skema berikut tanpa teks tambahan atau penjelasan di luar blok JSON:
\`\`\`json
{
  "searchSummary": "Ringkasan temuan 1-2 kalimat (contoh: Ditemukan 5 lowongan aktif untuk Frontend Developer di Gorontalo dan sekitarnya)",
  "jobs": [
    {
      "id": "job_1",
      "title": "Nama Posisi",
      "company": "Nama Perusahaan",
      "location": "Kota / Wilayah (Sistem: Onsite / WFH / Hybrid)",
      "jobType": "Full-time / Magang / Kontrak",
      "experience": "Fresh Graduate / 1-3 tahun / dll.",
      "salary": "Kisaran gaji jika ada, atau 'Kompetitif / Negosiasi'",
      "description": "Ringkasan tanggung jawab utama 2-3 kalimat",
      "requirements": ["Kualifikasi 1", "Kualifikasi 2", "Kualifikasi 3"],
      "source": "Portal Sumber (contoh: Jobstreet / LinkedIn / Glints / Karir.com)",
      "applyUrl": "URL tautan langsung ke postingan lowongan atau portal",
      "postedDate": "Estimasi waktu tayang (contoh: Terbaru / Minggu ini)",
      "aiTips": "Saran praktis agar CV pelamar lolos seleksi berkas posisi ini"
    }
  ]
}
\`\`\``;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: searchPrompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const message = errJson.error?.message || `Gemini API error (Status ${response.status})`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON safely
    let parsedResult = null;
    try {
      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsedResult = JSON.parse(cleanJson);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResult = JSON.parse(match[0]);
        } catch {}
      }
    }

    if (!parsedResult || !Array.isArray(parsedResult.jobs)) {
      return NextResponse.json(
        {
          error: 'Format respons AI tidak sesuai skema. Silakan ulangi pencarian.',
          rawText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      searchSummary: parsedResult.searchSummary || 'Pencarian lowongan selesai.',
      jobs: parsedResult.jobs,
      modelUsed: modelName,
      usage: data.usageMetadata || null,
    });
  } catch (err: unknown) {
    console.error('Job Finder API error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan pada server pencari lowongan.',
      },
      { status: 500 }
    );
  }
}
