import React, { useRef } from 'react';
import { X, Award, Printer, Download, CheckCircle, Sparkles } from 'lucide-react';
import { StudentRecord } from '../../types/ims.ts';

interface HifzSanadCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  certifiedQariName?: string;
  milestoneTitle?: string;
}

export const HifzSanadCertificateModal: React.FC<HifzSanadCertificateModalProps> = ({
  isOpen,
  onClose,
  student,
  certifiedQariName = 'Qari Sheikh Bilal Ahmed',
  milestoneTitle = 'Hifz al-Quran al-Kareem & Tajweed Proficiency',
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const campusTitle =
    student.campusId === 'uk'
      ? 'London Campus (United Kingdom)'
      : 'Haripur KTS Campus (Pakistan)';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="bg-[#0D381E] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#E5C158]" />
            <span className="font-heading font-bold text-sm text-[#F3D273]">
              Official Madrasa Sanad & Ijazah Certificate Preview
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#E5C158] hover:bg-[#d8b346] text-[#0D381E] font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-[#F9F8F4] flex items-center justify-center flex-1">
          {/* Authentic Islamic Certificate Parchment */}
          <div
            ref={certificateRef}
            className="w-full max-w-3xl bg-[#FFFDF9] border-8 border-double border-[#0D381E] p-6 sm:p-10 shadow-lg relative text-center text-[#1A231E] rounded-md overflow-hidden"
            style={{
              boxShadow: '0 0 25px rgba(13, 56, 30, 0.08), inset 0 0 30px rgba(229, 193, 88, 0.08)',
            }}
          >
            {/* Corner Arabesque Accents */}
            <div className="absolute top-2 left-2 text-[#E5C158] text-2xl select-none">۞</div>
            <div className="absolute top-2 right-2 text-[#E5C158] text-2xl select-none">۞</div>
            <div className="absolute bottom-2 left-2 text-[#E5C158] text-2xl select-none">۞</div>
            <div className="absolute bottom-2 right-2 text-[#E5C158] text-2xl select-none">۞</div>

            {/* Inner Gold Frame */}
            <div className="border border-[#E5C158] p-6 sm:p-8 rounded relative">
              {/* Bismillah */}
              <div className="text-base sm:text-2xl font-arabic text-[#0D381E] font-bold mb-2 tracking-wide">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              <div className="text-xs uppercase tracking-widest text-[#57655B] font-semibold">
                جامعة مصباح القرآن الدولية
              </div>
              <h2 className="font-heading font-extrabold text-xl sm:text-3xl text-[#0D381E] tracking-wider mt-1">
                MISBAH-UL-QURAN INTERNATIONAL
              </h2>
              <p className="text-[11px] text-[#57655B] font-serif italic mb-6">
                Official Sanad & Certificate of Quranic Memorization · {campusTitle}
              </p>

              <div className="text-xs sm:text-sm text-[#57655B] uppercase tracking-wider mb-2">
                This certifies that the esteemed student
              </div>

              {/* Student Name */}
              <div className="my-3 py-2 border-b-2 border-t-2 border-[#E5C158]/40 bg-[#F9F8F4]/60">
                <h3 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#0D381E] tracking-wide">
                  {student.firstName} {student.lastName}
                </h3>
                <div className="text-xs font-mono text-[#57655B] mt-1">
                  Permanent Admission ID: <strong className="text-[#0D381E]">{student.admissionNumber}</strong>
                </div>
              </div>

              {/* Achievement Body */}
              <p className="text-xs sm:text-sm text-[#1A231E] leading-relaxed max-w-xl mx-auto my-5">
                Has diligently studied the Holy Quran with adherence to the authentic rules of{' '}
                <strong className="text-[#0D381E]">Tajweed (Riwayah Hafs 'an 'Asim)</strong>, demonstrating
                superb precision in letter articulations (Makharij), elongations (Madd), and continuous retention,
                qualifying for the academic honor of:
              </p>

              <div className="inline-block px-5 py-2.5 rounded-lg bg-[#0D381E] text-[#F3D273] font-heading font-bold text-base sm:text-lg tracking-wide shadow-xs mb-6 border border-[#E5C158]/50">
                {milestoneTitle}
              </div>

              <div className="text-xs text-[#57655B] italic max-w-md mx-auto mb-8 font-arabic text-sm text-[#0D381E]">
                "اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا"
                <span className="block text-[11px] font-sans text-[#57655B] not-italic mt-0.5">
                  "Recite and ascend, and recite with Tartil as you used to in the world." (Abu Dawud)
                </span>
              </div>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-3 items-end pt-6 border-t border-[#E6E2D8] gap-4">
                {/* Certified Qari */}
                <div className="text-center">
                  <div className="font-heading font-bold text-xs sm:text-sm text-[#0D381E]">
                    {certifiedQariName}
                  </div>
                  <div className="text-[10px] text-[#57655B] uppercase tracking-wider">
                    Senior Qari & Halaqah Lead
                  </div>
                </div>

                {/* Official Gold Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#E5C158] bg-[#0D381E] text-[#F3D273] flex flex-col items-center justify-center p-1 shadow-md select-none">
                    <span className="text-[7px] uppercase font-bold tracking-tighter">Verified</span>
                    <span className="text-lg">📖</span>
                    <span className="text-[6px] uppercase tracking-tighter font-mono">MQ Seal</span>
                  </div>
                  <span className="text-[9px] text-[#57655B] font-mono mt-1">
                    Serial: SANAD-{student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '')}-2026
                  </span>
                </div>

                {/* Central Rector / Principal */}
                <div className="text-center">
                  <div className="font-heading font-bold text-xs sm:text-sm text-[#0D381E]">
                    Dr. Shaykh Muhammad Tahir
                  </div>
                  <div className="text-[10px] text-[#57655B] uppercase tracking-wider">
                    Dean of Academic Affairs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
