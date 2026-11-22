'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  ExternalLink,
  Sparkles,
  FileText,
  Key,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Download,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  source: string;
  applyUrl: string;
  postedDate: string;
  aiTips: string;
}

export function JobFinderStudio() {
  const { showToast } = useToast();

  // API Key & Model Settings (Strictly Private to the User's Browser)
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [showKeyVisible, setShowKeyVisible] = useState(false);

  // Search Fields
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Indonesia');
  const [jobType, setJobType] = useState('Semua');
  const [experience, setExperience] = useState('Semua');

  // Loading & Results
  const [loading, setLoading] = useState(false);
  const [searchSummary, setSearchSummary] = useState<string>('');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<number | null>(null);

  // Expanded AI Tips per card
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({});

  // Cover Letter Modal
  const [coverLetterModalOpen, setCoverLetterModalOpen] = useState(false);
  const [selectedJobForLetter, setSelectedJobForLetter] = useState<JobItem | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantSkills, setApplicantSkills] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Load saved private settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('nextbyte_user_gemini_api_key') || '';
      const savedModel = localStorage.getItem('nextbyte_user_gemini_model') || 'gemini-2.5-flash';
      setApiKey(savedKey);
      setSelectedModel(savedModel);
      setTempKeyInput(savedKey);
    }
  }, []);

  const handleSaveSettings = () => {
    const cleanKey = tempKeyInput.trim();
    if (!cleanKey) {
      showToast('API Key tidak boleh kosong.', 'error');
      return;
    }
    setApiKey(cleanKey);
    localStorage.setItem('nextbyte_user_gemini_api_key', cleanKey);
    localStorage.setItem('nextbyte_user_gemini_model', selectedModel);
    setIsKeyModalOpen(false);
    showToast('Kunci Gemini berhasil disimpan di browser Anda!', 'success');
  };

  const handleRemoveKey = () => {
    setApiKey('');
    setTempKeyInput('');
    localStorage.removeItem('nextbyte_user_gemini_api_key');
    setIsKeyModalOpen(false);
    showToast('Kunci Gemini telah dihapus dari browser Anda.', 'info');
  };

  const toggleTip = (jobId: string) => {
    setExpandedTips((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  // Perform Job Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      showToast('Silakan masukkan posisi atau kata kunci pekerjaan.', 'error');
      return;
    }
    if (!apiKey.trim()) {
      setIsKeyModalOpen(true);
      showToast('Silakan atur API Key Gemini pribadi Anda terlebih dahulu.', 'info');
      return;
    }

    // Check Smart Local Cache
    const cacheKey = `nb_job_cache_${query.trim().toLowerCase()}_${location
      .trim()
      .toLowerCase()}_${jobType}_${experience}_${selectedModel}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setJobs(parsed.jobs || []);
        setSearchSummary(parsed.searchSummary || '');
        setFromCache(true);
        setTokenUsage(0);
        showToast('Memuat hasil dari cache lokal (0 token digunakan)', 'info');
        return;
      }
    } catch {}

    setLoading(true);
    setFromCache(false);

    try {
      const res = await fetch('/api/tools/job-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
        },
        body: JSON.stringify({
          action: 'search-jobs',
          query: query.trim(),
          location: location.trim(),
          jobType,
          experience,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencari lowongan kerja.');
      }

      setJobs(data.jobs || []);
      setSearchSummary(data.searchSummary || '');
      setTokenUsage(data.usage?.totalTokenCount || null);

      // Save into session cache
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            jobs: data.jobs,
            searchSummary: data.searchSummary,
            timestamp: Date.now(),
          })
        );
      } catch {}

      showToast(`Berhasil menemukan ${data.jobs?.length || 0} lowongan!`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan pada pencarian.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate Cover Letter for Selected Job
  const handleOpenCoverLetter = (job: JobItem) => {
    setSelectedJobForLetter(job);
    setGeneratedLetter('');
    setCoverLetterModalOpen(true);
  };

  const handleGenerateCoverLetter = async () => {
    if (!selectedJobForLetter) return;
    if (!apiKey.trim()) {
      setIsKeyModalOpen(true);
      return;
    }

    setCoverLetterLoading(true);
    try {
      const res = await fetch('/api/tools/job-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey,
        },
        body: JSON.stringify({
          action: 'generate-cover-letter',
          jobTitle: selectedJobForLetter.title,
          company: selectedJobForLetter.company,
          requirements: selectedJobForLetter.requirements,
          applicantName: applicantName.trim() || 'Nama Pelamar',
          skills: applicantSkills.trim() || 'Keahlian teknis & komunikasi yang relevan',
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat surat lamaran.');
      }

      setGeneratedLetter(data.coverLetter || '');
      showToast('Surat lamaran berhasil dibuat!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat surat lamaran.', 'error');
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const handleCopyLetter = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopiedLetter(true);
    showToast('Surat lamaran berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const handleDownloadLetter = () => {
    if (!generatedLetter || !selectedJobForLetter) return;
    const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surat_Lamaran_${selectedJobForLetter.company.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Surat lamaran berhasil diunduh (.txt)', 'success');
  };

  const maskedKey = apiKey
    ? `${apiKey.substring(0, 6)}••••••••••••${apiKey.substring(apiKey.length - 4)}`
    : '';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Private Access Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                AI Job Finder & Career Assistant
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                Mode Eksklusif Privat
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cari lowongan kerja nyata terkini via Google Search Grounding & Gemini AI pribadi Anda.
            </p>
          </div>
        </div>

        {/* Access Key Indicator / Setup Button */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              apiKey
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-md shadow-blue-500/20 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? `Kunci: ${maskedKey}` : '🔑 Masukkan Kunci Gemini'}</span>
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      </div>

      {/* 2. Main Search Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Position Query */}
            <div className="md:col-span-5 relative">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Posisi / Profesi yang Dicari:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: Frontend Developer, Staff Admin, Akuntansi..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Lokasi / Domisili:
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Gorontalo, Jakarta, WFH..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Job Type */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Tipe Kerja:
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Tipe</option>
                <option value="Full-time">Full-time</option>
                <option value="Remote / WFH">Remote / WFH</option>
                <option value="Magang / Internship">Magang / Intern</option>
                <option value="Freelance / Kontrak">Freelance / Kontrak</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>

            {/* Experience */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Pengalaman:
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Level</option>
                <option value="Fresh Graduate / Pemula">Fresh Graduate</option>
                <option value="1-2 Tahun (Junior)">1-2 Tahun</option>
                <option value="3-5 Tahun (Mid)">3-5 Tahun</option>
                <option value="5+ Tahun (Senior)">Senior (5+ Thn)</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Model Aktif: <strong className="text-slate-800 dark:text-slate-200">{selectedModel}</strong> • Smart Caching Aktif
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 shrink-0 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mencari di Google via Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cari Lowongan Kerja Terkini</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Search Results Summary & Stats */}
      {searchSummary && (
        <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-200 font-medium">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{searchSummary}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fromCache ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800">
                <Clock className="w-3 h-3" />
                Cache Lokal (0 Token)
              </span>
            ) : tokenUsage ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-semibold">
                ~{tokenUsage} token
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* 4. Job Listings Grid */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Daftar Lowongan Ditemukan ({jobs.length})
            </h3>
            <span className="text-xs text-slate-400">Hasil real-time dari Google Search</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => {
              const isTipOpen = Boolean(expandedTips[job.id]);
              return (
                <div
                  key={job.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Title & Source */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug truncate">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                      </div>

                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                        {job.source || 'Portal Karir'}
                      </span>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        {job.location}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
                        {job.jobType}
                      </span>
                      {job.salary && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900">
                          {job.salary}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {job.experience}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Requirements Bullets */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Kualifikasi Utama:
                        </div>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          {job.requirements.slice(0, 3).map((req, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-blue-500 font-bold">•</span>
                              <span className="line-clamp-1">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Expandable AI Tips */}
                    {job.aiTips && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => toggleTip(job.id)}
                          className="flex items-center justify-between w-full text-left text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Tips Lolos Seleksi dari AI
                          </span>
                          {isTipOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {isTipOpen && (
                          <div className="mt-2 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed animate-in fade-in">
                            {job.aiTips}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCoverLetter(job)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                      title="Buat draf surat lamaran resmi untuk posisi ini"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Buat Surat Lamaran</span>
                    </button>

                    <a
                      href={job.applyUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
                    >
                      <span>Lamar Sekarang</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Modal: Atur Kunci API Gemini Pribadi */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Pengaturan Kunci API Gemini
                  </h3>
                  <p className="text-xs text-slate-400">100% Privat & Tersimpan di Browser Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1.5 text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Privasi Terjamin: Hanya Anda yang Dapat Menggunakannya</span>
              </div>
              <p>
                Kunci API Anda disimpan di penyimpanan lokal browser Anda sendiri dan tidak dapat dipakai oleh pengunjung lain.
              </p>
              <div className="pt-1">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-blue-600 dark:text-blue-400 hover:text-blue-500 inline-flex items-center gap-1"
                >
                  <span>Dapatkan Kunci Gratis di Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Google Gemini API Key:
                </label>
                <div className="relative">
                  <input
                    type={showKeyVisible ? 'text' : 'password'}
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyVisible(!showKeyVisible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showKeyVisible ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilihan Model AI:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Sangat Cepat & Hemat Kuota - Direkomendasikan)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Model Paling Cerdas & Detail)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen Ultra Cepat)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Hapus Kunci
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Generator Surat Lamaran (Cover Letter) Instan */}
      {coverLetterModalOpen && selectedJobForLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Buat Surat Lamaran Kerja Instan
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-sm">
                    {selectedJobForLetter.title} • {selectedJobForLetter.company}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCoverLetterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Data Pelamar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap Anda:
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Contoh: Aldi Abdullah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Keahlian Utama yang Ingin Ditekankan:
                </label>
                <input
                  type="text"
                  value={applicantSkills}
                  onChange={(e) => setApplicantSkills(e.target.value)}
                  placeholder="Contoh: React, TypeScript, komunikasi aktif..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateCoverLetter}
                disabled={coverLetterLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {coverLetterLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyusun Surat Lamaran...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Surat Lamaran (~400 token)</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Editor */}
            {generatedLetter && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Draf Surat Lamaran Siap Pakai:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLetter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLetter ? 'Tersalin!' : 'Salin Teks'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadLetter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh .txt</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={12}
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
