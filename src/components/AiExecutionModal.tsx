import React, { useState } from 'react';
import { X, Flame, Copy, Check, Download, Play, Code2, Monitor, Loader2, ArrowRight } from 'lucide-react';

interface AiExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  isHtmlFormat: boolean;
}

export const AiExecutionModal: React.FC<AiExecutionModalProps> = ({
  isOpen,
  onClose,
  promptText,
  isHtmlFormat,
}) => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'text' | 'preview'>('text');

  if (!isOpen) return null;

  const handleRunAi = async () => {
    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal memproses prompt dengan Gemini AI.');
      }

      const data = await response.json();
      setResult(data.result || 'Tidak ada teks yang dihasilkan.');

      // Auto switch to preview if html found
      if (data.result && (data.result.includes('<div') || data.result.includes('<!DOCTYPE') || data.result.includes('<html'))) {
        setActiveTab('preview');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memanggil model Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadResult = () => {
    const isHtml = result.includes('<!DOCTYPE') || result.includes('<div id=') || isHtmlFormat;
    const filename = `materi-ajar-${Date.now()}.${isHtml ? 'html' : 'md'}`;
    const blob = new Blob([result], { type: isHtml ? 'text/html' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Extract clean HTML if embedded inside markdown ```html ... ``` codeblocks
  const getExtractedHtml = (content: string): string => {
    const htmlBlockRegex = /```html([\s\S]*?)```/i;
    const match = content.match(htmlBlockRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return content;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-5xl h-[90vh] border-2 border-stone-900 bg-white rounded-lg neo-shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b-2 border-stone-900 bg-[#E9D5FF] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 border border-stone-900 bg-white rounded neo-shadow-sm">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-stone-900">
                Uji & Pratinjau Output Materi Ajar (Gemini 3.8 Flash)
              </h3>
              <p className="text-[11px] text-stone-600">
                AI akan mengeksekusi Prompt Induk sesuai aturan Bagian B–D secara disiplin dan terstruktur.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-stone-900 bg-white hover:bg-stone-100 rounded text-stone-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2.5 bg-[#FAF7F2] border-b-2 border-stone-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunAi}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-stone-900 bg-[#FEF08A] hover:bg-[#fde047] rounded text-stone-900 neo-shadow-sm neo-shadow-hover transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses Slide...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{result ? 'Jalankan Ulang' : 'Mulai Jalankan Prompt'}</span>
                </>
              )}
            </button>

            {result && (
              <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded border border-stone-900/30">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                    activeTab === 'text' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" /> Naskah & Kode
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                    activeTab === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> Live Sandbox
                  </span>
                </button>
              </div>
            )}
          </div>

          {result && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyResult}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold border border-stone-900 bg-white hover:bg-stone-50 rounded text-stone-900"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin Hasil'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadResult}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold border border-stone-900 bg-[#E0F2FE] hover:bg-[#bae6fd] rounded text-stone-900"
              >
                <Download className="w-3 h-3" />
                <span>Unduh File</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FAF7F2] flex flex-col">
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-stone-900 border-t-purple-600 animate-spin" />
              <div className="font-heading font-bold text-base text-stone-900">
                Merancang Slide Materi Ajar...
              </div>
              <p className="text-xs text-stone-600 max-w-md">
                Gemini sedang memetakan Tahap 1 (asumsi & tabel alur), Tahap 2 (slide materi / kode HTML interaktif), dan Tahap 3 (kunci & rubrik penilaian).
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 border-2 border-rose-900 bg-rose-50 text-rose-900 text-xs rounded-md">
              <div className="font-bold mb-1">Gagal Menjalankan Prompt:</div>
              <div>{error}</div>
            </div>
          )}

          {!isLoading && !result && !error && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-16 h-16 border-2 border-stone-900 bg-[#FEF08A] rounded-xl flex items-center justify-center neo-shadow">
                <Play className="w-7 h-7 text-stone-900 fill-stone-900 ml-1" />
              </div>
              <div className="font-heading font-bold text-base text-stone-900">
                Siap Menguji Prompt Induk
              </div>
              <p className="text-xs text-stone-600 max-w-md">
                Klik tombol <span className="font-bold text-stone-900">"Mulai Jalankan Prompt"</span> di atas untuk mengeksekusi prompt yang sudah Anda susun dan melihat hasil slide materi ajar secara langsung.
              </p>
            </div>
          )}

          {!isLoading && result && (
            <>
              {activeTab === 'text' ? (
                <div className="flex-1 bg-white border-2 border-stone-900 p-4 rounded neo-shadow overflow-y-auto font-mono text-xs leading-relaxed text-stone-900">
                  <pre className="whitespace-pre-wrap break-words">{result}</pre>
                </div>
              ) : (
                <div className="flex-1 flex flex-col border-2 border-stone-900 rounded overflow-hidden neo-shadow bg-white">
                  <div className="bg-stone-800 text-white px-3 py-1.5 text-[11px] font-mono flex items-center justify-between">
                    <span>Pratinjau HTML Interaktif</span>
                    <span className="text-stone-400">Sandbox Terisolasi (srcDoc)</span>
                  </div>
                  <iframe
                    title="Interactive Slide Sandbox"
                    srcDoc={getExtractedHtml(result)}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className="w-full flex-1 border-0"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
