import React, { useState } from 'react';
import { HelpCircle, Code, Globe, Sparkles, BookOpen, ExternalLink, Check, Copy, MessageSquare } from 'lucide-react';

interface HelpViewProps {
  onOpenHotlinkUtility: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onOpenHotlinkUtility }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const codeSnippets = [
    {
      title: '1. Standard HTML Hotlink Image Tag',
      desc: 'Sintaks HTML paling dasar untuk menampilkan gambar langsung dari URL web luar.',
      code: `<img src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633" alt="Kain Katun Silk" loading="lazy" width="400" height="300" />`,
    },
    {
      title: '2. React / JSX Hotlink Component',
      desc: 'Cara menggunakan gambar hotlink di React dengan atribut referrerPolicy="no-referrer" agar aman dari blokir CORS.',
      code: `<img\n  src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c"\n  alt="Kemeja Linen"\n  referrerPolicy="no-referrer"\n  className="rounded-lg object-cover"\n/>`,
    },
    {
      title: '3. CSS Background Image Hotlink',
      desc: 'Menggunakan hotlink URL sebagai gambar latar belakang komponen CSS.',
      code: `.hero-banner {\n  background-image: url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d');\n  background-size: cover;\n  background-position: center;\n}`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00eefc]/10 text-[#00eefc] rounded-xl border border-[#00eefc]/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pusat Bantuan & Panduan Hotlink HTML</h1>
            <p className="text-xs text-[#8e9192]">
              Panduan integrasi gambar web via hotlink, sintaks HTML, serta FAQ sistem WebPro
            </p>
          </div>
        </div>
      </div>

      {/* Hotlink Banner Highlight */}
      <div className="p-5 bg-gradient-to-r from-[#1c1b1b] to-[#131313] border border-[#00eefc]/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00eefc]" />
            <h3 className="font-bold text-white text-base">Fitur Generator Hotlink Gambar HTML</h3>
          </div>
          <p className="text-xs text-gray-300 max-w-xl">
            Anda dapat memasukkan URL gambar langsung dari internet (seperti Unsplash, Imgur, CDN web) ke dalam form
            Suppliers, Barang, Pembeli, dan Pembayaran tanpa perlu mengunggah file lokal!
          </p>
        </div>
        <button
          onClick={onOpenHotlinkUtility}
          className="px-5 py-2.5 bg-[#00eefc] hover:bg-cyan-300 text-[#00363a] font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(0,238,252,0.3)] transition-all whitespace-nowrap cursor-pointer"
        >
          Buka Utility Tester Hotlink
        </button>
      </div>

      {/* Code Snippets Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#00eefc] uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Contoh Kode HTML & Hotlink Gambar
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {codeSnippets.map((snippet, idx) => (
            <div key={idx} className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-bold text-white text-sm">{snippet.title}</h4>
                <button
                  onClick={() => handleCopy(snippet.code, idx)}
                  className="px-2.5 py-1 bg-[#201f1f] border border-[#2a2a2a] hover:border-[#00eefc] rounded text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === idx ? 'Tersalin' : 'Salin Kode'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">{snippet.desc}</p>
              <pre className="p-3 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg text-xs font-mono text-[#00eefc] overflow-x-auto whitespace-pre-wrap">
                {snippet.code}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4 pt-4 border-t border-[#2a2a2a]">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pertanyaan Umum (FAQ)</h3>

        <div className="space-y-3">
          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Apakah data di WebPro tersimpan otomatis?</h4>
            <p className="text-xs text-gray-300">
              Ya! Semua perubahan data (Suppliers, Barang, Pembeli, Transaksi, dan Pembayaran) tersimpan di LocalStorage
              browser Anda secara otomatis sehingga tidak akan hilang saat halaman diperbarui (refresh).
            </p>
          </div>

          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Mengapa gambar hotlink saya tidak muncul?</h4>
            <p className="text-xs text-gray-300">
              Pastikan URL gambar berakhiran format gambar (seperti `.jpg`, `.png`, `.webp`) atau merupakan Direct Image Link
              bebas CORS (misalnya dari Unsplash Direct URL).
            </p>
          </div>

          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Bagaimana cara mencetak laporan transaksi?</h4>
            <p className="text-xs text-gray-300">
              Klik tombol <strong className="text-[#00eefc]">"Print Report"</strong> di menu sebelah kiri. Pilih jenis laporan
              dan klik "Cetak / Download PDF" untuk membuka dialog cetak printer resmi atau menyimpan sebagai PDF.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support Footer */}
      <div className="p-4 bg-[#131313] border border-[#2a2a2a] rounded-xl flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#00eefc]" />
          <span>Butuh bantuan lebih lanjut tentang sistem WebPro? Hubungi Tim Tim Teknis Admin.</span>
        </div>
        <span className="font-mono text-[#00eefc]">support@webpro.co.id</span>
      </div>
    </div>
  );
};
