import React, { useState } from 'react';
import { X, Copy, Check, Link2, Image, Code, Sparkles, Globe } from 'lucide-react';

interface HotlinkHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl?: (url: string) => void;
  initialUrl?: string;
}

const SAMPLE_HOTLINKS = [
  {
    title: 'Kain & Tekstil',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Fashion & Kemeja',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Sepatu Kulit',
    url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Gudang & Logistik',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Avatar Eksekutif',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Bukti Transfer Bank',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
  },
];

export const HotlinkHelperModal: React.FC<HotlinkHelperModalProps> = ({
  isOpen,
  onClose,
  onSelectUrl,
  initialUrl = '',
}) => {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [altText, setAltText] = useState('Gambar Produk WebPro');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const htmlTag = `<img src="${imageUrl || 'https://via.placeholder.com/400'}" alt="${altText}" class="webpro-hotlink-img" loading="lazy" />`;
  const markdownTag = `![${altText}](${imageUrl || 'https://via.placeholder.com/400'})`;

  const copyToClipboard = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleApplyUrl = () => {
    if (onSelectUrl && imageUrl) {
      onSelectUrl(imageUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#131b2e] border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0b0f17] text-cyan-400 rounded-xl border border-slate-800">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Hotlink Generator & HTML Tester
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  HTML Utility
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Uji URL Gambar dari Web dan Dapatkan Kode HTML Hotlink secara Instan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> URL Gambar Web (Direct Hotlink Link):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setTestSuccess(null);
                }}
                placeholder="https://images.unsplash.com/... atau https://domain.com/gambar.jpg"
                className="flex-1 px-3 py-2 bg-[#0b0f17] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              {onSelectUrl && (
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!imageUrl}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-xs rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Gunakan URL Ini
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Alt Text (Deskripsi Gambar):</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0b0f17] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Sample Hotlinks Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Sampel URL Hotlink Siap Pakai:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_HOTLINKS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageUrl(sample.url);
                    setAltText(sample.title);
                    setTestSuccess(null);
                  }}
                  className="flex items-center gap-2 p-2 bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-white group-hover:text-cyan-400 truncate">
                      {sample.title}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">Unsplash HD</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-[#0b0f17] border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-cyan-400" /> Dynamic Live Preview:
              </span>
              {testSuccess === true && (
                <span className="text-[11px] text-emerald-400 font-semibold">✓ URL Valid & Loaded</span>
              )}
              {testSuccess === false && (
                <span className="text-[11px] text-rose-400 font-semibold">✗ Gambar Gagal Dimuat</span>
              )}
            </div>

            <div className="flex items-center justify-center min-h-[140px] bg-[#131b2e] rounded-xl border border-dashed border-slate-700 p-2 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={altText}
                  onLoad={() => setTestSuccess(true)}
                  onError={() => setTestSuccess(false)}
                  className="max-h-36 rounded-lg object-contain"
                />
              ) : (
                <div className="text-center text-slate-500 py-6">
                  <Globe className="w-8 h-8 mx-auto mb-1 opacity-40 text-slate-400" />
                  <p className="text-xs">Masukkan URL untuk melihat pratinjau hotlink langsung</p>
                </div>
              )}
            </div>
          </div>

          {/* HTML & Markdown Export Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* HTML Tag */}
            <div className="p-3 bg-[#0b0f17] border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5" /> HTML Tag
                </span>
                <button
                  onClick={() => copyToClipboard(htmlTag, 'html')}
                  className="p-1 text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'html' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <pre className="p-2 bg-[#131b2e] rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all border border-slate-800">
                {htmlTag}
              </pre>
            </div>

            {/* Markdown Tag */}
            <div className="p-3 bg-[#0b0f17] border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-semibold text-indigo-400 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5" /> Markdown Code
                </span>
                <button
                  onClick={() => copyToClipboard(markdownTag, 'md')}
                  className="p-1 text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'md' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <pre className="p-2 bg-[#131b2e] rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all border border-slate-800">
                {markdownTag}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup Utility
          </button>
        </div>
      </div>
    </div>
  );
};
