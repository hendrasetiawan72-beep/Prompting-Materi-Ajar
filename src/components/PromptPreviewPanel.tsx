import React, { useState } from 'react';
import { Copy, Check, Download, Eye, FileText, Minimize2, Maximize2, CheckSquare } from 'lucide-react';

interface PromptPreviewPanelProps {
  promptText: string;
  onCopy: () => void;
  copied: boolean;
  onDownload: () => void;
  includeSectionsBCD: boolean;
  onToggleBCD: (val: boolean) => void;
  cleanUnusedLines: boolean;
  onToggleCleanLines: (val: boolean) => void;
}

export const PromptPreviewPanel: React.FC<PromptPreviewPanelProps> = ({
  promptText,
  onCopy,
  copied,
  onDownload,
  includeSectionsBCD,
  onToggleBCD,
  cleanUnusedLines,
  onToggleCleanLines,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quick stats
  const wordCount = promptText.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = promptText.split('\n').length;

  return (
    <div
      className={`border-2 border-stone-900 bg-white rounded-lg neo-shadow flex flex-col transition-all ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl bg-white overflow-hidden max-h-[92vh]'
          : 'sticky top-20 max-h-[calc(100vh-6rem)]'
      }`}
    >
      {/* Top Header Card */}
      <div className="border-b-2 border-stone-900 bg-[#FEF08A] px-4 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs">
            📄
          </div>
          <div>
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-stone-900">
              Hasil Akhir Prompt Induk
            </h3>
            <div className="text-[10px] text-stone-600 font-mono tabular-nums">
              {lineCount} baris · {wordCount} kata
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Kecilkan' : 'Layar Penuh'}
            className="p-1.5 border border-stone-900 bg-white hover:bg-stone-100 rounded text-stone-900 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onCopy}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold border-2 border-stone-900 rounded neo-shadow-sm transition-all ${
              copied ? 'bg-[#86efac] text-stone-900' : 'bg-white hover:bg-stone-100 text-stone-900'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-800" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toggles bar */}
      <div className="p-2.5 bg-[#FAF7F2] border-b-2 border-stone-900/40 text-[11px] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-stone-800">
            <input
              type="checkbox"
              checked={includeSectionsBCD}
              onChange={(e) => onToggleBCD(e.target.checked)}
              className="rounded border-stone-900 text-stone-900 focus:ring-0"
            />
            <span>Sertakan Bagian B–D (Lengkap)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-stone-800">
            <input
              type="checkbox"
              checked={cleanUnusedLines}
              onChange={(e) => onToggleCleanLines(e.target.checked)}
              className="rounded border-stone-900 text-stone-900 focus:ring-0"
            />
            <span>Hapus Baris Tak Dipakai</span>
          </label>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDownload}
            className="text-[11px] font-bold text-stone-700 hover:text-stone-900 underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Unduh .md
          </button>
        </div>
      </div>

      {/* Code Text Area View */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#FAF7F2] font-mono-code text-xs leading-relaxed select-text">
        <pre className="whitespace-pre-wrap break-words text-stone-800 select-all font-mono">
          {promptText}
        </pre>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t-2 border-stone-900 bg-white flex items-center justify-center sm:justify-start shrink-0">
        <div className="text-[11px] text-stone-500 text-center sm:text-left">
          💡 Tempel prompt ini ke Gemini, Claude, atau ChatGPT untuk membuat slide.
        </div>
      </div>
    </div>
  );
};
