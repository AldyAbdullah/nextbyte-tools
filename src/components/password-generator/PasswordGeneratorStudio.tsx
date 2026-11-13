'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  RefreshCw,
  ShieldCheck,
  Check,
  Sliders,
  List,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS_CHARS = /[il1Lo0O]/g;

const PASSPHRASE_WORDS = [
  'garuda', 'nusantara', 'samudra', 'lentera', 'cakrawala', 'merbabu', 'mentari',
  'bintang', 'pelangi', 'gemintang', 'komodo', 'harimau', 'cendrawasih', 'anggrek',
  'purnama', 'pandawa', 'bentala', 'swastamita', 'arunika', 'renjana', 'kelana',
  'merapi', 'rinjani', 'bromo', 'krakatau', 'mahameru', 'cempaka', 'kenanga'
];

export function PasswordGeneratorStudio() {
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  const [mode, setMode] = useState<'random' | 'passphrase'>('random');
  const [passphraseWordCount, setPassphraseWordCount] = useState(4);
  const [copied, setCopied] = useState(false);

  // Bulk generated list
  const [bulkList, setBulkList] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);

  // Cryptographically secure random number in range [0, max)
  const getRandomInt = (max: number): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  const generateSinglePassword = useCallback((): string => {
    if (mode === 'passphrase') {
      const chosenWords: string[] = [];
      for (let i = 0; i < passphraseWordCount; i++) {
        const idx = getRandomInt(PASSPHRASE_WORDS.length);
        let word = PASSPHRASE_WORDS[idx];
        if (includeUpper) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        chosenWords.push(word);
      }
      let result = chosenWords.join('-');
      if (includeNumbers) {
        result += getRandomInt(100);
      }
      if (includeSymbols) {
        const syms = '!@#$%&*';
        result += syms.charAt(getRandomInt(syms.length));
      }
      return result;
    }

    let charPool = '';
    let guaranteed: string[] = [];

    let uppers = UPPERCASE_CHARS;
    let lowers = LOWERCASE_CHARS;
    let numbers = NUMBER_CHARS;
    const symbols = SYMBOL_CHARS;

    if (avoidAmbiguous) {
      uppers = uppers.replace(AMBIGUOUS_CHARS, '');
      lowers = lowers.replace(AMBIGUOUS_CHARS, '');
      numbers = numbers.replace(AMBIGUOUS_CHARS, '');
    }

    if (includeUpper) {
      charPool += uppers;
      guaranteed.push(uppers.charAt(getRandomInt(uppers.length)));
    }
    if (includeLower) {
      charPool += lowers;
      guaranteed.push(lowers.charAt(getRandomInt(lowers.length)));
    }
    if (includeNumbers) {
      charPool += numbers;
      guaranteed.push(numbers.charAt(getRandomInt(numbers.length)));
    }
    if (includeSymbols) {
      charPool += symbols;
      guaranteed.push(symbols.charAt(getRandomInt(symbols.length)));
    }

    if (!charPool) {
      charPool = lowers;
      guaranteed = [lowers.charAt(getRandomInt(lowers.length))];
    }

    const remainingLength = Math.max(0, length - guaranteed.length);
    const randomChars: string[] = [];
    for (let i = 0; i < remainingLength; i++) {
      randomChars.push(charPool.charAt(getRandomInt(charPool.length)));
    }

    const combined = [...guaranteed, ...randomChars];
    // Fisher-Yates shuffle
    for (let i = combined.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  }, [
    mode,
    length,
    includeUpper,
    includeLower,
    includeNumbers,
    includeSymbols,
    avoidAmbiguous,
    passphraseWordCount,
  ]);

  const refreshPassword = useCallback(() => {
    const newPwd = generateSinglePassword();
    setPassword(newPwd);
    setCopied(false);

    if (showBulk) {
      const list: string[] = [];
      for (let i = 0; i < 6; i++) {
        list.push(generateSinglePassword());
      }
      setBulkList(list);
    }
  }, [generateSinglePassword, showBulk]);

  useEffect(() => {
    refreshPassword();
  }, [refreshPassword]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
      showToast('Password berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Gagal menyalin password.', 'error');
    }
  };

  // Calculate password strength & entropy
  const calculateStrength = () => {
    if (!password) return { score: 0, label: 'Kosong', color: 'bg-slate-200', text: 'text-slate-400', crackTime: '-' };

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    const entropy = Math.round(password.length * Math.log2(Math.max(1, poolSize)));

    if (entropy < 40) {
      return { score: 1, label: 'Sangat Lemah', color: 'bg-rose-500', text: 'text-rose-500', crackTime: 'Beberapa Detik' };
    }
    if (entropy < 60) {
      return { score: 2, label: 'Cukup', color: 'bg-amber-500', text: 'text-amber-500', crackTime: 'Beberapa Hari' };
    }
    if (entropy < 80) {
      return { score: 3, label: 'Kuat', color: 'bg-blue-500', text: 'text-blue-500', crackTime: 'Ratusan Tahun' };
    }
    return { score: 4, label: 'Sangat Kuat (Aman)', color: 'bg-emerald-500', text: 'text-emerald-500', crackTime: 'Miliaran Tahun' };
  };

  const strength = calculateStrength();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Password Display Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Password Hasil Generate:
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className={strength.text}>{strength.label}</span>
            <span className="text-slate-400 font-normal">• Estimasi Retas: {strength.crackTime}</span>
          </div>
        </div>

        {/* Display Text & Action */}
        <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3">
          <input
            type="text"
            readOnly
            value={password}
            className="w-full bg-transparent px-3 py-1 font-mono text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 select-all outline-none truncate"
          />

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={refreshPassword}
              title="Buat password baru"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(password)}
              className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/20 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin'}</span>
            </button>
          </div>
        </div>

        {/* Strength Meter Bar */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                step <= strength.score ? strength.color : 'bg-slate-100 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Metode Password
            </h3>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('random')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mode === 'random'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Karakter Acak
            </button>
            <button
              type="button"
              onClick={() => setMode('passphrase')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mode === 'passphrase'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Frasa Kata (Mudah Diingat)
            </button>
          </div>
        </div>

        {/* Sliders */}
        {mode === 'random' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>Panjang Karakter:</span>
              <span className="font-mono text-base text-primary-600 font-black">{length}</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="w-full accent-primary-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>8 (Standar)</span>
              <span>16 (Rekomendasi)</span>
              <span>32 (Kuat)</span>
              <span>64 (Maksimal)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>Jumlah Kata Frasa:</span>
              <span className="font-mono text-base text-primary-600 font-black">
                {passphraseWordCount} Kata
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="8"
              value={passphraseWordCount}
              onChange={(e) => setPassphraseWordCount(parseInt(e.target.value, 10))}
              className="w-full accent-primary-600 cursor-pointer"
            />
          </div>
        )}

        {/* Character Set Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={includeUpper}
              onChange={(e) => setIncludeUpper(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 accent-primary-600"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Huruf Besar (A-Z)
              </span>
              <span className="text-slate-400 text-[11px]">ABCDEFGHI...</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={includeLower}
              onChange={(e) => setIncludeLower(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 accent-primary-600"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Huruf Kecil (a-z)
              </span>
              <span className="text-slate-400 text-[11px]">abcdefghi...</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 accent-primary-600"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Angka (0-9)
              </span>
              <span className="text-slate-400 text-[11px]">0123456789</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 accent-primary-600"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Simbol Karakter Khusus
              </span>
              <span className="text-slate-400 text-[11px]">!@#$%^&*...</span>
            </div>
          </label>
        </div>

        {/* Ambiguous filter */}
        <label className="flex items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={avoidAmbiguous}
            onChange={(e) => setAvoidAmbiguous(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 accent-primary-600"
          />
          <span>Hindari karakter yang mirip / membingungkan (misal: 1, l, I, O, 0)</span>
        </label>
      </div>

      {/* Bulk Generator Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-primary-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Buat Banyak Sekaligus (Bulk Passwords)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowBulk(!showBulk);
              if (!showBulk && bulkList.length === 0) {
                const list: string[] = [];
                for (let i = 0; i < 6; i++) list.push(generateSinglePassword());
                setBulkList(list);
              }
            }}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {showBulk ? 'Tutup Daftar' : 'Tampilkan 6 Opsi Password'}
          </button>
        </div>

        {showBulk && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {bulkList.map((pwd, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate mr-2">
                  {pwd}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(pwd)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 font-bold text-[11px] text-slate-700 dark:text-slate-300 shrink-0"
                >
                  Salin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Guarantee */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>100% Privat & Aman:</strong> Password dibuat menggunakan generator entropy kriptografi standar industri (Web Crypto API) langsung di memori perangkat Anda tanpa pernah dikirim ke internet.
        </span>
      </div>
    </div>
  );
}
