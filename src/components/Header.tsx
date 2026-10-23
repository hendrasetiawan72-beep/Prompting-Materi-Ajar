import React from 'react';
import { Copy, BookOpen, Check, Download, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onCopy: () => void;
  copied: boolean;
  onDownload: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCopy,
  copied,
  onDownload,
  onReset,
}) => {
  return (
    <header className="border-b-2 border-stone-900 bg-[#FAF7F2] sticky top-0 z-40">
      {/* Top Bar Contract (3 zones) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 border-2 border-stone-900 bg-[#FEF08A] rounded flex items-center justify-center neo-shadow-sm">
            <BookOpen className="w-5 h-5 text-stone-900" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg md:text-xl tracking-tight text-stone-900 block leading-tight">
              PROMPT SLIDE
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
              Kurikulum Merdeka Edition
            </span>
          </div>
        </div>

        {/* Zone 2: Quick Links / Status */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-stone-700">
          <span className="bg-[#DCFCE7] border border-stone-900 px-2.5 py-1 rounded neo-shadow-sm font-semibold">
            Postmodern Neobrutalist
          </span>
          <span className="text-stone-400">/</span>
          <span className="bg-[#E0F2FE] border border-stone-900 px-2.5 py-1 rounded neo-shadow-sm font-semibold">
            HTML Interaktif & PPTX Ready
          </span>
          <span className="text-stone-400">/</span>
          <span className="bg-[#FCE7F3] border border-stone-900 px-2.5 py-1 rounded neo-shadow-sm font-semibold">
            Anti-Cheat Quiz Built-in
          </span>
        </div>

        {/* Zone 3: Primary Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            title="Reset Form ke default"
            className="p-2 border-2 border-stone-900 bg-white hover:bg-stone-100 rounded text-stone-700 neo-shadow-sm neo-shadow-hover transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDownload}
            title="Unduh Prompt sebagai file Markdown (.md)"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 border-stone-900 bg-[#E0F2FE] hover:bg-[#bae6fd] rounded text-stone-900 neo-shadow-sm neo-shadow-hover transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh .MD</span>
          </button>

          <button
            type="button"
            onClick={onCopy}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded text-stone-900 neo-shadow neo-shadow-hover transition-all whitespace-nowrap ${
              copied ? 'bg-[#86efac]' : 'bg-[#FEF08A] hover:bg-[#fde047]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-800" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
