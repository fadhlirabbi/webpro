import React, { useState } from 'react';
import { HelpCircle, BookOpen, MessageSquare } from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pusat Bantuan WebPro</h1>
            <p className="text-xs text-slate-400">
              Panduan penggunaan dan FAQ sistem WebPro
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Pertanyaan Umum (FAQ)
        </h3>

        <div className="space-y-3">
          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Bagaimana cara login ke sistem?</h4>
            <p className="text-xs text-gray-300">
              Masukkan email dan password yang sudah didaftarkan. Akun baru memerlukan persetujuan admin sebelum bisa digunakan.
            </p>
          </div>

          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Bagaimana cara menambah barang baru?</h4>
            <p className="text-xs text-gray-300">
              Buka menu <strong className="text-cyan-400">Barang</strong> dan klik tombol <strong>"Tambah Barang"</strong>. Isi informasi barang termasuk nama, supplier, harga, dan stok.
            </p>
          </div>

          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Bagaimana cara membuat transaksi baru?</h4>
            <p className="text-xs text-gray-300">
              Buka menu <strong className="text-cyan-400">Transaksi</strong> dan klik tombol <strong>"Buat Transaksi Baru"</strong>. Pilih pembeli dan barang yang akan dijual.
            </p>
          </div>

          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Bagaimana cara mencetak laporan?</h4>
            <p className="text-xs text-gray-300">
              Klik tombol <strong className="text-cyan-400">"Print / Export Laporan"</strong> di sidebar. Pilih jenis laporan dan klik "Cetak / Download PDF".
            </p>
          </div>

          <div className="p-4 bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl">
            <h4 className="font-bold text-white text-sm mb-1">Q: Bagaimana cara reset password?</h4>
            <p className="text-xs text-gray-300">
              Klik ikon profil di header, lalu pilih <strong>"Reset Password"</strong>. Masukkan password lama dan password baru.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support Footer */}
      <div className="p-4 bg-[#131313] border border-[#2a2a2a] rounded-xl flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Butuh bantuan lebih lanjut? Hubungi Tim Teknis Admin.</span>
        </div>
        <span className="font-mono text-cyan-400">support@webpro.co.id</span>
      </div>
    </div>
  );
};
