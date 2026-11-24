// Misbah-ul-Quran International — Core Islamic Curriculum, 114 Surahs, 30 Juz & Prophetic Hadith Dataset

export interface QuranSurah {
  number: number;
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string;
  totalAyahs: number;
  juzNumber: number;
  revelationType: 'MAKKI' | 'MADANI';
}

export interface QuranJuzInfo {
  juzNumber: number;
  arabicName: string;
  transliteratedName: string;
  startSurah: string;
  startAyah: number;
  endSurah: string;
  endAyah: number;
  totalAyahs: number;
  themeSummary: string;
}

export interface DailyIslamicReflection {
  id: string;
  type: 'HADITH' | 'AYAH';
  arabicText: string;
  englishTranslation: string;
  sourceReference: string;
  narratorOrSurah: string;
  theme: 'QURAN_STUDY' | 'KNOWLEDGE' | 'PATIENCE' | 'PARENTS' | 'SINCERITY' | 'ADAB';
}

export interface SunnahHabitItem {
  id: string;
  title: string;
  category: 'SALAH' | 'ADHKAR' | 'QURAN' | 'AKHLAQ' | 'FASTING';
  arabicTitle: string;
  rewardPoints: number;
  description: string;
}

// 30 Juz Complete Reference Matrix
export const QURAN_30_JUZ: QuranJuzInfo[] = [
  { juzNumber: 1, arabicName: 'الم', transliteratedName: 'Alif Lam Meem', startSurah: 'Al-Fatihah', startAyah: 1, endSurah: 'Al-Baqarah', endAyah: 141, totalAyahs: 148, themeSummary: 'Praise of Allah, Guidance, Adam & Creation, Bani Israel' },
  { juzNumber: 2, arabicName: 'سَيَقُولُ', transliteratedName: 'Sayaqool', startSurah: 'Al-Baqarah', startAyah: 142, endSurah: 'Al-Baqarah', endAyah: 252, totalAyahs: 111, themeSummary: 'Change of Qibla, Fasting in Ramadan, Hajj, Jihad, Talut & Jalut' },
  { juzNumber: 3, arabicName: 'تِلْكَ الرُّسُلُ', transliteratedName: 'Tilka ar-Rusul', startSurah: 'Al-Baqarah', startAyah: 253, endSurah: 'Ali \'Imran', endAyah: 92, totalAyahs: 126, themeSummary: 'Ayat al-Kursi, Riba prohibitions, Family of Imran, Maryam' },
  { juzNumber: 4, arabicName: 'لَنْ تَنَالُوا', transliteratedName: 'Lan Tanaaloo', startSurah: 'Ali \'Imran', startAyah: 93, endSurah: 'An-Nisa', endAyah: 23, totalAyahs: 131, themeSummary: 'Battle of Uhud, Unity of Ummah, Rights of Orphans & Women' },
  { juzNumber: 5, arabicName: 'وَالْمُحْصَنَاتُ', transliteratedName: 'Wal-Muhsanat', startSurah: 'An-Nisa', startAyah: 24, endSurah: 'An-Nisa', endAyah: 147, totalAyahs: 124, themeSummary: 'Marital laws, Justice, Obedience to Messenger, Hypocrisy' },
  { juzNumber: 6, arabicName: 'لَا يُحِبُّ اللَّهُ', transliteratedName: 'La Yuhibbullah', startSurah: 'An-Nisa', startAyah: 148, endSurah: 'Al-Ma\'idah', endAyah: 81, totalAyahs: 110, themeSummary: 'Isa and cross, Dietary laws, Wudu, Covenant with Ahl al-Kitab' },
  { juzNumber: 7, arabicName: 'وَإِذَا سَمِعُوا', transliteratedName: 'Wa Iza Sami\'oo', startSurah: 'Al-Ma\'idah', startAyah: 82, endSurah: 'Al-An\'am', endAyah: 110, totalAyahs: 148, themeSummary: 'Kaffarah of oaths, Prohibition of wine & gambling, Tawheed' },
  { juzNumber: 8, arabicName: 'وَلَوْ أَنَّنَا', transliteratedName: 'Wa Law Annana', startSurah: 'Al-An\'am', startAyah: 111, endSurah: 'Al-A\'raf', endAyah: 87, totalAyahs: 142, themeSummary: 'Prophetic dialogues, Ibrahim\'s argument, Stories of Prophets' },
  { juzNumber: 9, arabicName: 'قَالَ الْمَلَأُ', transliteratedName: 'Qal-al-Mala\'u', startSurah: 'Al-A\'raf', startAyah: 88, endSurah: 'Al-Anfal', endAyah: 40, totalAyahs: 159, themeSummary: 'Musa and Fir\'awn, As-Hab al-A\'raf, Battle of Badr' },
  { juzNumber: 10, arabicName: 'وَاعْلَمُوا', transliteratedName: 'Wa\'lamoo', startSurah: 'Al-Anfal', startAyah: 41, endSurah: 'At-Tawbah', endAyah: 92, totalAyahs: 127, themeSummary: 'Spoils of war, Treaty of Hudaybiyyah, Tabuk Expedition' },
  { juzNumber: 11, arabicName: 'يَعْتَذِرُونَ', transliteratedName: 'Ya\'taziroona', startSurah: 'At-Tawbah', startAyah: 93, endSurah: 'Hud', endAyah: 5, totalAyahs: 151, themeSummary: 'Sadaqat recipients, Prophet Yunus, Story of Nuh\'s ark' },
  { juzNumber: 12, arabicName: 'وَمَا مِنْ دَابَّةٍ', transliteratedName: 'Wa Ma Min Dabbatin', startSurah: 'Hud', startAyah: 6, endSurah: 'Yusuf', endAyah: 52, totalAyahs: 170, themeSummary: 'Prophet Hud, Salih, Ibrahim, Shu\'ayb, Beautiful Story of Yusuf' },
  { juzNumber: 13, arabicName: 'وَمَا أُبَرِّئُ', transliteratedName: 'Wa Ma Ubarri\'u', startSurah: 'Yusuf', startAyah: 53, endSurah: 'Ibrahim', endAyah: 52, totalAyahs: 154, themeSummary: 'Yusuf\'s reunion, Thunder (Ar-Ra\'d) glorification, Ibrahim\'s Dua' },
  { juzNumber: 14, arabicName: 'رُبَمَا', transliteratedName: 'Rubama', startSurah: 'Al-Hijr', startAyah: 1, endSurah: 'An-Nahl', endAyah: 128, totalAyahs: 227, themeSummary: 'Protection of Quran, Signs of creation, The Bee (Nahl) & Honey' },
  { juzNumber: 15, arabicName: 'سُبْحَانَ الَّذِي', transliteratedName: 'Subhanallazi', startSurah: 'Al-Isra', startAyah: 1, endSurah: 'Al-Kahf', endAyah: 74, totalAyahs: 185, themeSummary: 'Al-Isra wal-Mi\'raj, Filial piety to parents, Sleepers of the Cave' },
  { juzNumber: 16, arabicName: 'قَالَ أَلَمْ', transliteratedName: 'Qala Alam', startSurah: 'Al-Kahf', startAyah: 75, endSurah: 'Ta-Ha', endAyah: 135, totalAyahs: 269, themeSummary: 'Musa & Khidr, Dhul-Qarnayn, Maryam & Isa, Story of Ta-Ha' },
  { juzNumber: 17, arabicName: 'اقْتَرَبَ', transliteratedName: 'Iqtaraba', startSurah: 'Al-Anbiya', startAyah: 1, endSurah: 'Al-Hajj', endAyah: 78, totalAyahs: 190, themeSummary: 'Stories of 21 Prophets, Creation from water, Rites of Hajj' },
  { juzNumber: 18, arabicName: 'قَدْ أَفْلَحَ', transliteratedName: 'Qad Aflaha', startSurah: 'Al-Mu\'minun', startAyah: 1, endSurah: 'Al-Furqan', endAyah: 20, totalAyahs: 202, themeSummary: 'Qualities of successful believers, Ayat an-Nur, Modesty' },
  { juzNumber: 19, arabicName: 'وَقَالَ الَّذِينَ', transliteratedName: 'Wa Qalallazina', startSurah: 'Al-Furqan', startAyah: 21, endSurah: 'An-Naml', endAyah: 55, totalAyahs: 339, themeSummary: 'Ibad ar-Rahman qualities, The Poets (Shu\'ara), Sulayman & Bilqis' },
  { juzNumber: 20, arabicName: 'أَمَّنْ خَلَقَ', transliteratedName: 'Amman Khalaqa', startSurah: 'An-Naml', startAyah: 56, endSurah: 'Al-Ankabut', endAyah: 45, totalAyahs: 171, themeSummary: 'Story of Musa in Madyan, Qarun\'s arrogance, The Spider\'s web' },
  { juzNumber: 21, arabicName: 'اتْلُ مَا أُوحِيَ', transliteratedName: 'Utlu Ma Oohiya', startSurah: 'Al-Ankabut', startAyah: 46, endSurah: 'Al-Ahzab', endAyah: 30, totalAyahs: 178, themeSummary: 'Signs in Romans (Rum), Luqman\'s advice to his son, As-Sajdah' },
  { juzNumber: 22, arabicName: 'وَمَنْ يَقْنُتْ', transliteratedName: 'Wa Man Yaqnut', startSurah: 'Al-Ahzab', startAyah: 31, endSurah: 'Ya-Sin', endAyah: 27, totalAyahs: 169, themeSummary: 'Mothers of Believers, Battle of Trench, Saba, Heart of Quran Ya-Sin' },
  { juzNumber: 23, arabicName: 'وَمَا لِيَ', transliteratedName: 'Wa Maliya', startSurah: 'Ya-Sin', startAyah: 28, endSurah: 'Az-Zumar', endAyah: 31, totalAyahs: 357, themeSummary: 'Resurrection in Ya-Sin, Angels in ranks (Saffat), Prophet Dawud & Sulayman' },
  { juzNumber: 24, arabicName: 'فَمَنْ أَظْلَمُ', transliteratedName: 'Fa Man Azlamu', startSurah: 'Az-Zumar', startAyah: 32, endSurah: 'Fussilat', endAyah: 46, totalAyahs: 175, themeSummary: 'Never despair of Allah\'s mercy, Believer in Pharaoh\'s court' },
  { juzNumber: 25, arabicName: 'إِلَيْهِ يُرَدُّ', transliteratedName: 'Ilayhi Yuraddu', startSurah: 'Fussilat', startAyah: 47, endSurah: 'Al-Jathiyah', endAyah: 37, totalAyahs: 246, themeSummary: 'Consultation (Shura), Golden ornaments (Zukhruf), Night of Decree (Dukhan)' },
  { juzNumber: 26, arabicName: 'حم', transliteratedName: 'Ha-Meem', startSurah: 'Al-Ahqaf', startAyah: 1, endSurah: 'Az-Zariyat', endAyah: 30, totalAyahs: 195, themeSummary: 'Prophet Muhammad, Victory (Fath), Islamic Manners (Hujurat), Qaf' },
  { juzNumber: 27, arabicName: 'قَالَ فَمَا خَطْبُكُمْ', transliteratedName: 'Qala Fama Khatbukum', startSurah: 'Az-Zariyat', startAyah: 31, endSurah: 'Al-Hadid', endAyah: 29, totalAyahs: 399, themeSummary: 'At-Tur, An-Najm, Ar-Rahman, Al-Waqi\'ah, Iron (Al-Hadid)' },
  { juzNumber: 28, arabicName: 'قَدْ سَمِعَ اللَّهُ', transliteratedName: 'Qad Sami\'allahu', startSurah: 'Al-Mujadilah', startAyah: 1, endSurah: 'At-Tahrim', endAyah: 12, totalAyahs: 137, themeSummary: 'Al-Hashr, Al-Jumu\'ah, Al-Munafiqun, At-Talaq, At-Tahrim' },
  { juzNumber: 29, arabicName: 'تَبَارَكَ الَّذِي', transliteratedName: 'Tabarakallazi', startSurah: 'Al-Mulk', startAyah: 1, endSurah: 'Al-Mursalat', endAyah: 50, totalAyahs: 431, themeSummary: 'Al-Mulk (Dominion), Al-Qalam, Al-Haqqah, Nuh, Al-Jinn, Al-Muzzammil' },
  { juzNumber: 30, arabicName: 'عَمَّ يَتَسَاءَلُونَ', transliteratedName: 'Amma Yatasa\'aloon', startSurah: 'An-Naba', startAyah: 1, endSurah: 'An-Nas', endAyah: 6, totalAyahs: 564, themeSummary: 'Juz Amma: 37 Short Surahs, Resurrection, Day of Judgment, Sincerity, Mu\'awwidhatayn' },
];

// Complete dataset of all 114 Surahs of the Holy Quran
export const COMPLETE_114_SURAHS: QuranSurah[] = [
  { number: 1, nameArabic: 'الفاتحة', nameTransliterated: 'Al-Fatihah', nameEnglish: 'The Opening', totalAyahs: 7, juzNumber: 1, revelationType: 'MAKKI' },
  { number: 2, nameArabic: 'البقرة', nameTransliterated: 'Al-Baqarah', nameEnglish: 'The Cow', totalAyahs: 286, juzNumber: 1, revelationType: 'MADANI' },
  { number: 3, nameArabic: 'آل عمران', nameTransliterated: 'Ali \'Imran', nameEnglish: 'Family of Imran', totalAyahs: 200, juzNumber: 3, revelationType: 'MADANI' },
  { number: 4, nameArabic: 'النساء', nameTransliterated: 'An-Nisa', nameEnglish: 'The Women', totalAyahs: 176, juzNumber: 4, revelationType: 'MADANI' },
  { number: 5, nameArabic: 'المائدة', nameTransliterated: 'Al-Ma\'idah', nameEnglish: 'The Table Spread', totalAyahs: 120, juzNumber: 6, revelationType: 'MADANI' },
  { number: 6, nameArabic: 'الأنعام', nameTransliterated: 'Al-An\'am', nameEnglish: 'The Cattle', totalAyahs: 165, juzNumber: 7, revelationType: 'MAKKI' },
  { number: 7, nameArabic: 'الأعراف', nameTransliterated: 'Al-A\'raf', nameEnglish: 'The Heights', totalAyahs: 206, juzNumber: 8, revelationType: 'MAKKI' },
  { number: 8, nameArabic: 'الأنفال', nameTransliterated: 'Al-Anfal', nameEnglish: 'The Spoils of War', totalAyahs: 75, juzNumber: 9, revelationType: 'MADANI' },
  { number: 9, nameArabic: 'التوبة', nameTransliterated: 'At-Tawbah', nameEnglish: 'The Repentance', totalAyahs: 129, juzNumber: 10, revelationType: 'MADANI' },
  { number: 10, nameArabic: 'يونس', nameTransliterated: 'Yunus', nameEnglish: 'Jonah', totalAyahs: 109, juzNumber: 11, revelationType: 'MAKKI' },
  { number: 11, nameArabic: 'هود', nameTransliterated: 'Hud', nameEnglish: 'Hud', totalAyahs: 123, juzNumber: 11, revelationType: 'MAKKI' },
  { number: 12, nameArabic: 'يوسف', nameTransliterated: 'Yusuf', nameEnglish: 'Joseph', totalAyahs: 111, juzNumber: 12, revelationType: 'MAKKI' },
  { number: 13, nameArabic: 'الرعد', nameTransliterated: 'Ar-Ra\'d', nameEnglish: 'The Thunder', totalAyahs: 43, juzNumber: 13, revelationType: 'MADANI' },
  { number: 14, nameArabic: 'إبراهيم', nameTransliterated: 'Ibrahim', nameEnglish: 'Abraham', totalAyahs: 52, juzNumber: 13, revelationType: 'MAKKI' },
  { number: 15, nameArabic: 'الحجر', nameTransliterated: 'Al-Hijr', nameEnglish: 'The Rocky Tract', totalAyahs: 99, juzNumber: 14, revelationType: 'MAKKI' },
  { number: 16, nameArabic: 'النحل', nameTransliterated: 'An-Nahl', nameEnglish: 'The Bee', totalAyahs: 128, juzNumber: 14, revelationType: 'MAKKI' },
  { number: 17, nameArabic: 'الإسراء', nameTransliterated: 'Al-Isra', nameEnglish: 'The Night Journey', totalAyahs: 111, juzNumber: 15, revelationType: 'MAKKI' },
  { number: 18, nameArabic: 'الكهف', nameTransliterated: 'Al-Kahf', nameEnglish: 'The Cave', totalAyahs: 110, juzNumber: 15, revelationType: 'MAKKI' },
  { number: 19, nameArabic: 'مريم', nameTransliterated: 'Maryam', nameEnglish: 'Mary', totalAyahs: 98, juzNumber: 16, revelationType: 'MAKKI' },
  { number: 20, nameArabic: 'طه', nameTransliterated: 'Ta-Ha', nameEnglish: 'Ta-Ha', totalAyahs: 135, juzNumber: 16, revelationType: 'MAKKI' },
  { number: 21, nameArabic: 'الأنبياء', nameTransliterated: 'Al-Anbiya', nameEnglish: 'The Prophets', totalAyahs: 112, juzNumber: 17, revelationType: 'MAKKI' },
  { number: 22, nameArabic: 'الحج', nameTransliterated: 'Al-Hajj', nameEnglish: 'The Pilgrimage', totalAyahs: 78, juzNumber: 17, revelationType: 'MADANI' },
  { number: 23, nameArabic: 'المؤمنون', nameTransliterated: 'Al-Mu\'minun', nameEnglish: 'The Believers', totalAyahs: 118, juzNumber: 18, revelationType: 'MAKKI' },
  { number: 24, nameArabic: 'النور', nameTransliterated: 'An-Nur', nameEnglish: 'The Light', totalAyahs: 64, juzNumber: 18, revelationType: 'MADANI' },
  { number: 25, nameArabic: 'الفرقان', nameTransliterated: 'Al-Furqan', nameEnglish: 'The Criterion', totalAyahs: 77, juzNumber: 18, revelationType: 'MAKKI' },
  { number: 26, nameArabic: 'الشعراء', nameTransliterated: 'Ash-Shu\'ara', nameEnglish: 'The Poets', totalAyahs: 227, juzNumber: 19, revelationType: 'MAKKI' },
  { number: 27, nameArabic: 'النمل', nameTransliterated: 'An-Naml', nameEnglish: 'The Ant', totalAyahs: 93, juzNumber: 19, revelationType: 'MAKKI' },
  { number: 28, nameArabic: 'القصص', nameTransliterated: 'Al-Qasas', nameEnglish: 'The Stories', totalAyahs: 88, juzNumber: 20, revelationType: 'MAKKI' },
  { number: 29, nameArabic: 'العنكبوت', nameTransliterated: 'Al-\'Ankabut', nameEnglish: 'The Spider', totalAyahs: 69, juzNumber: 20, revelationType: 'MAKKI' },
  { number: 30, nameArabic: 'الروم', nameTransliterated: 'Ar-Rum', nameEnglish: 'The Romans', totalAyahs: 60, juzNumber: 21, revelationType: 'MAKKI' },
  { number: 31, nameArabic: 'لقمان', nameTransliterated: 'Luqman', nameEnglish: 'Luqman', totalAyahs: 34, juzNumber: 21, revelationType: 'MAKKI' },
  { number: 32, nameArabic: 'السجدة', nameTransliterated: 'As-Sajdah', nameEnglish: 'The Prostration', totalAyahs: 30, juzNumber: 21, revelationType: 'MAKKI' },
  { number: 33, nameArabic: 'الأحزاب', nameTransliterated: 'Al-Ahzab', nameEnglish: 'The Combined Forces', totalAyahs: 73, juzNumber: 21, revelationType: 'MADANI' },
  { number: 34, nameArabic: 'سبأ', nameTransliterated: 'Saba', nameEnglish: 'Sheba', totalAyahs: 54, juzNumber: 22, revelationType: 'MAKKI' },
  { number: 35, nameArabic: 'فاطر', nameTransliterated: 'Fatir', nameEnglish: 'Originator', totalAyahs: 45, juzNumber: 22, revelationType: 'MAKKI' },
  { number: 36, nameArabic: 'يس', nameTransliterated: 'Ya-Sin', nameEnglish: 'Ya-Sin', totalAyahs: 83, juzNumber: 22, revelationType: 'MAKKI' },
  { number: 37, nameArabic: 'الصافات', nameTransliterated: 'As-Saffat', nameEnglish: 'Those Ranged in Ranks', totalAyahs: 182, juzNumber: 23, revelationType: 'MAKKI' },
  { number: 38, nameArabic: 'ص', nameTransliterated: 'Sad', nameEnglish: 'Sad', totalAyahs: 88, juzNumber: 23, revelationType: 'MAKKI' },
  { number: 39, nameArabic: 'الزمر', nameTransliterated: 'Az-Zumar', nameEnglish: 'The Crowds', totalAyahs: 75, juzNumber: 23, revelationType: 'MAKKI' },
  { number: 40, nameArabic: 'غافر', nameTransliterated: 'Ghafir', nameEnglish: 'The Forgiver', totalAyahs: 85, juzNumber: 24, revelationType: 'MAKKI' },
  { number: 41, nameArabic: 'فصلت', nameTransliterated: 'Fussilat', nameEnglish: 'Explained in Detail', totalAyahs: 54, juzNumber: 24, revelationType: 'MAKKI' },
  { number: 42, nameArabic: 'الشورى', nameTransliterated: 'Ash-Shura', nameEnglish: 'The Consultation', totalAyahs: 53, juzNumber: 25, revelationType: 'MAKKI' },
  { number: 43, nameArabic: 'الزخرف', nameTransliterated: 'Az-Zukhruf', nameEnglish: 'The Gold Adornments', totalAyahs: 89, juzNumber: 25, revelationType: 'MAKKI' },
  { number: 44, nameArabic: 'الدخان', nameTransliterated: 'Ad-Dukhan', nameEnglish: 'The Smoke', totalAyahs: 59, juzNumber: 25, revelationType: 'MAKKI' },
  { number: 45, nameArabic: 'الجاثية', nameTransliterated: 'Al-Jathiyah', nameEnglish: 'The Kneeling', totalAyahs: 37, juzNumber: 25, revelationType: 'MAKKI' },
  { number: 46, nameArabic: 'الأحقاف', nameTransliterated: 'Al-Ahqaf', nameEnglish: 'The Wind-Curved Sandhills', totalAyahs: 35, juzNumber: 26, revelationType: 'MAKKI' },
  { number: 47, nameArabic: 'محمد', nameTransliterated: 'Muhammad', nameEnglish: 'Muhammad', totalAyahs: 38, juzNumber: 26, revelationType: 'MADANI' },
  { number: 48, nameArabic: 'الفتح', nameTransliterated: 'Al-Fath', nameEnglish: 'The Victory', totalAyahs: 29, juzNumber: 26, revelationType: 'MADANI' },
  { number: 49, nameArabic: 'الحجرات', nameTransliterated: 'Al-Hujurat', nameEnglish: 'The Rooms', totalAyahs: 18, juzNumber: 26, revelationType: 'MADANI' },
  { number: 50, nameArabic: 'ق', nameTransliterated: 'Qaf', nameEnglish: 'Qaf', totalAyahs: 45, juzNumber: 26, revelationType: 'MAKKI' },
  { number: 51, nameArabic: 'الذاريات', nameTransliterated: 'Az-Zariyat', nameEnglish: 'The Winnowing Winds', totalAyahs: 60, juzNumber: 26, revelationType: 'MAKKI' },
  { number: 52, nameArabic: 'الطور', nameTransliterated: 'At-Tur', nameEnglish: 'The Mount', totalAyahs: 49, juzNumber: 27, revelationType: 'MAKKI' },
  { number: 53, nameArabic: 'النجم', nameTransliterated: 'An-Najm', nameEnglish: 'The Star', totalAyahs: 62, juzNumber: 27, revelationType: 'MAKKI' },
  { number: 54, nameArabic: 'القمر', nameTransliterated: 'Al-Qamar', nameEnglish: 'The Moon', totalAyahs: 55, juzNumber: 27, revelationType: 'MAKKI' },
  { number: 55, nameArabic: 'الرحمن', nameTransliterated: 'Ar-Rahman', nameEnglish: 'The Beneficent', totalAyahs: 78, juzNumber: 27, revelationType: 'MADANI' },
  { number: 56, nameArabic: 'الواقعة', nameTransliterated: 'Al-Waqi\'ah', nameEnglish: 'The Inevitable', totalAyahs: 96, juzNumber: 27, revelationType: 'MAKKI' },
  { number: 57, nameArabic: 'الحديد', nameTransliterated: 'Al-Hadid', nameEnglish: 'The Iron', totalAyahs: 29, juzNumber: 27, revelationType: 'MADANI' },
  { number: 58, nameArabic: 'المجادلة', nameTransliterated: 'Al-Mujadilah', nameEnglish: 'The Pleading Woman', totalAyahs: 22, juzNumber: 28, revelationType: 'MADANI' },
  { number: 59, nameArabic: 'الحشر', nameTransliterated: 'Al-Hashr', nameEnglish: 'The Exile', totalAyahs: 24, juzNumber: 28, revelationType: 'MADANI' },
  { number: 60, nameArabic: 'الممتحنة', nameTransliterated: 'Al-Mumtahanah', nameEnglish: 'She That Is Examined', totalAyahs: 13, juzNumber: 28, revelationType: 'MADANI' },
  { number: 61, nameArabic: 'الصف', nameTransliterated: 'As-Saff', nameEnglish: 'The Ranks', totalAyahs: 14, juzNumber: 28, revelationType: 'MADANI' },
  { number: 62, nameArabic: 'الجمعة', nameTransliterated: 'Al-Jumu\'ah', nameEnglish: 'The Congregation', totalAyahs: 11, juzNumber: 28, revelationType: 'MADANI' },
  { number: 63, nameArabic: 'المنافقون', nameTransliterated: 'Al-Munafiqun', nameEnglish: 'The Hypocrites', totalAyahs: 11, juzNumber: 28, revelationType: 'MADANI' },
  { number: 64, nameArabic: 'التغابن', nameTransliterated: 'At-Taghabun', nameEnglish: 'Mutual Disillusion', totalAyahs: 18, juzNumber: 28, revelationType: 'MADANI' },
  { number: 65, nameArabic: 'الطلاق', nameTransliterated: 'At-Talaq', nameEnglish: 'The Divorce', totalAyahs: 12, juzNumber: 28, revelationType: 'MADANI' },
  { number: 66, nameArabic: 'التحريم', nameTransliterated: 'At-Tahrim', nameEnglish: 'The Prohibition', totalAyahs: 12, juzNumber: 28, revelationType: 'MADANI' },
  { number: 67, nameArabic: 'الملك', nameTransliterated: 'Al-Mulk', nameEnglish: 'The Sovereignty', totalAyahs: 30, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 68, nameArabic: 'القلم', nameTransliterated: 'Al-Qalam', nameEnglish: 'The Pen', totalAyahs: 52, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 69, nameArabic: 'الحاقة', nameTransliterated: 'Al-Haqqah', nameEnglish: 'The Inevitable Reality', totalAyahs: 52, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 70, nameArabic: 'المعارج', nameTransliterated: 'Al-Ma\'arij', nameEnglish: 'The Ascending Stairways', totalAyahs: 44, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 71, nameArabic: 'نوح', nameTransliterated: 'Nuh', nameEnglish: 'Noah', totalAyahs: 28, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 72, nameArabic: 'الجن', nameTransliterated: 'Al-Jinn', nameEnglish: 'The Jinn', totalAyahs: 28, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 73, nameArabic: 'المزمل', nameTransliterated: 'Al-Muzzammil', nameEnglish: 'The Enshrouded One', totalAyahs: 20, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 74, nameArabic: 'المدثر', nameTransliterated: 'Al-Muddaththir', nameEnglish: 'The Cloaked One', totalAyahs: 56, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 75, nameArabic: 'القيامة', nameTransliterated: 'Al-Qiyamah', nameEnglish: 'The Resurrection', totalAyahs: 40, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 76, nameArabic: 'الإنسان', nameTransliterated: 'Al-Insan', nameEnglish: 'Man', totalAyahs: 31, juzNumber: 29, revelationType: 'MADANI' },
  { number: 77, nameArabic: 'المرسلات', nameTransliterated: 'Al-Mursalat', nameEnglish: 'Those Sent Forth', totalAyahs: 50, juzNumber: 29, revelationType: 'MAKKI' },
  { number: 78, nameArabic: 'النبأ', nameTransliterated: 'An-Naba', nameEnglish: 'The Tidings', totalAyahs: 40, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 79, nameArabic: 'النازعات', nameTransliterated: 'An-Nazi\'at', nameEnglish: 'Those Who Drag Forth', totalAyahs: 46, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 80, nameArabic: 'عبس', nameTransliterated: '\'Abasa', nameEnglish: 'He Frowned', totalAyahs: 42, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 81, nameArabic: 'التكوير', nameTransliterated: 'At-Takwir', nameEnglish: 'The Overthrowing', totalAyahs: 29, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 82, nameArabic: 'الانفطار', nameTransliterated: 'Al-Infitar', nameEnglish: 'The Cleaving', totalAyahs: 19, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 83, nameArabic: 'المطففين', nameTransliterated: 'Al-Mutaffifin', nameEnglish: 'Defrauding', totalAyahs: 36, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 84, nameArabic: 'الانشقاق', nameTransliterated: 'Al-Inshiqaq', nameEnglish: 'The Splitting Asunder', totalAyahs: 25, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 85, nameArabic: 'البروج', nameTransliterated: 'Al-Buruj', nameEnglish: 'The Constellations', totalAyahs: 22, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 86, nameArabic: 'الطارق', nameTransliterated: 'At-Tariq', nameEnglish: 'The Morning Star', totalAyahs: 17, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 87, nameArabic: 'الأعلى', nameTransliterated: 'Al-A\'la', nameEnglish: 'The Most High', totalAyahs: 19, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 88, nameArabic: 'الغاشية', nameTransliterated: 'Al-Ghashiyah', nameEnglish: 'The Overwhelming Event', totalAyahs: 26, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 89, nameArabic: 'الفجر', nameTransliterated: 'Al-Fajr', nameEnglish: 'The Dawn', totalAyahs: 30, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 90, nameArabic: 'البلد', nameTransliterated: 'Al-Balad', nameEnglish: 'The City', totalAyahs: 20, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 91, nameArabic: 'الشمس', nameTransliterated: 'Ash-Shams', nameEnglish: 'The Sun', totalAyahs: 15, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 92, nameArabic: 'الليل', nameTransliterated: 'Al-Layl', nameEnglish: 'The Night', totalAyahs: 21, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 93, nameArabic: 'الضحى', nameTransliterated: 'Ad-Duha', nameEnglish: 'The Morning Brightness', totalAyahs: 11, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 94, nameArabic: 'الشرح', nameTransliterated: 'Ash-Sharh', nameEnglish: 'The Relief', totalAyahs: 8, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 95, nameArabic: 'التين', nameTransliterated: 'At-Tin', nameEnglish: 'The Fig', totalAyahs: 8, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 96, nameArabic: 'العلق', nameTransliterated: 'Al-\'Alaq', nameEnglish: 'The Clot', totalAyahs: 19, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 97, nameArabic: 'القدر', nameTransliterated: 'Al-Qadr', nameEnglish: 'The Power', totalAyahs: 5, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 98, nameArabic: 'البينة', nameTransliterated: 'Al-Bayyinah', nameEnglish: 'The Clear Proof', totalAyahs: 8, juzNumber: 30, revelationType: 'MADANI' },
  { number: 99, nameArabic: 'الزلزلة', nameTransliterated: 'Az-Zalzalah', nameEnglish: 'The Earthquake', totalAyahs: 8, juzNumber: 30, revelationType: 'MADANI' },
  { number: 100, nameArabic: 'العاديات', nameTransliterated: 'Al-\'Adiyat', nameEnglish: 'The Courser', totalAyahs: 11, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 101, nameArabic: 'القارعة', nameTransliterated: 'Al-Qari\'ah', nameEnglish: 'The Calamity', totalAyahs: 11, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 102, nameArabic: 'التكاثر', nameTransliterated: 'At-Takathur', nameEnglish: 'The Rivalry in World Increase', totalAyahs: 8, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 103, nameArabic: 'العصر', nameTransliterated: 'Al-\'Asr', nameEnglish: 'The Declining Day', totalAyahs: 3, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 104, nameArabic: 'الهمزة', nameTransliterated: 'Al-Humazah', nameEnglish: 'The Scorner', totalAyahs: 9, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 105, nameArabic: 'الفيل', nameTransliterated: 'Al-Fil', nameEnglish: 'The Elephant', totalAyahs: 5, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 106, nameArabic: 'قريش', nameTransliterated: 'Quraysh', nameEnglish: 'Quraysh', totalAyahs: 4, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 107, nameArabic: 'الماعون', nameTransliterated: 'Al-Ma\'un', nameEnglish: 'The Small Kindness', totalAyahs: 7, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 108, nameArabic: 'الكوثر', nameTransliterated: 'Al-Kawthar', nameEnglish: 'The Abundance', totalAyahs: 3, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 109, nameArabic: 'الكافرون', nameTransliterated: 'Al-Kafirun', nameEnglish: 'The Disbelievers', totalAyahs: 6, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 110, nameArabic: 'النصر', nameTransliterated: 'An-Nasr', nameEnglish: 'The Divine Support', totalAyahs: 3, juzNumber: 30, revelationType: 'MADANI' },
  { number: 111, nameArabic: 'المسد', nameTransliterated: 'Al-Masad', nameEnglish: 'The Palm Fiber', totalAyahs: 5, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 112, nameArabic: 'الإخلاص', nameTransliterated: 'Al-Ikhlas', nameEnglish: 'The Sincerity', totalAyahs: 4, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 113, nameArabic: 'الفلق', nameTransliterated: 'Al-Falaq', nameEnglish: 'The Daybreak', totalAyahs: 5, juzNumber: 30, revelationType: 'MAKKI' },
  { number: 114, nameArabic: 'الناس', nameTransliterated: 'An-Nas', nameEnglish: 'Mankind', totalAyahs: 6, juzNumber: 30, revelationType: 'MAKKI' },
];

export const POPULAR_SURAH_LIST: QuranSurah[] = COMPLETE_114_SURAHS.filter((s) =>
  [1, 2, 3, 18, 36, 49, 55, 56, 67, 78, 79, 87, 93, 94, 97, 103, 108, 112, 113, 114].includes(s.number)
);

// Interactive Dhikr items for Digital Tasbeeh Counter
export interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  virtue: string;
  recommendedCount: number;
}

export const DHIKR_PRESETS: DhikrItem[] = [
  {
    id: 'dhikr-subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    translation: 'Glory be to Allah',
    virtue: 'Plants a palm tree for the believer in Jannah (Tirmidhi 3464)',
    recommendedCount: 33,
  },
  {
    id: 'dhikr-alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'All praise is due to Allah',
    virtue: 'Fills the scale (Meezan) with heavy reward on the Day of Judgment (Muslim 223)',
    recommendedCount: 33,
  },
  {
    id: 'dhikr-allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
    virtue: 'Fills that which is between the heavens and the earth (Muslim 223)',
    recommendedCount: 34,
  },
  {
    id: 'dhikr-astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullah wa atoobu ilayh',
    translation: 'I seek forgiveness from Allah and repent unto Him',
    virtue: 'The Prophet ﷺ sought forgiveness more than 70 times every day (Bukhari 6307)',
    recommendedCount: 100,
  },
  {
    id: 'dhikr-tahlil',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'La ilaha illa Allah wahdahu la shareeka lah',
    translation: 'None has the right to be worshipped except Allah alone without partner',
    virtue: 'Best dhikr said by Prophets; equal to freeing ten slaves (Bukhari 3293)',
    recommendedCount: 100,
  },
  {
    id: 'dhikr-salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ',
    transliteration: 'Allahumma salli \'ala Muhammad wa \'ala aali Muhammad',
    translation: 'O Allah, send blessings upon Muhammad and upon the family of Muhammad',
    virtue: 'Whoever sends one blessing upon the Prophet ﷺ, Allah sends ten blessings upon him (Muslim 408)',
    recommendedCount: 100,
  },
  {
    id: 'dhikr-hawqalah',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    transliteration: 'La hawla wa la quwwata illa billahil \'Aliyyil \'Azeem',
    translation: 'There is no power nor might except with Allah, the Most High, the Supreme',
    virtue: 'A treasure from under the Throne of Ar-Rahman (Bukhari 4205)',
    recommendedCount: 33,
  },
];

// Interactive Islamic & Madrasa Calendar Events
export interface IslamicCalendarEvent {
  id: string;
  title: string;
  arabicTitle: string;
  hijriDate: string;
  gregorianDate: string;
  category: 'SUNNAH_FAST' | 'SACRED_HOLIDAY' | 'MADRASA_ACADEMIC' | 'EXAMINATION';
  campusScope: 'all' | 'uk' | 'kts';
  description: string;
}

export const ISLAMIC_CALENDAR_EVENTS: IslamicCalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Shawwal 6 Sunnah Fasts Period',
    arabicTitle: 'صِيَامُ سِتٍّ مِنْ شَوَّالٍ',
    hijriDate: '2 - 30 Shawwal 1447 AH',
    gregorianDate: 'April - May 2026',
    category: 'SUNNAH_FAST',
    campusScope: 'all',
    description: 'Fasting 6 days in Shawwal after Ramadan yields the reward of fasting the whole year.',
  },
  {
    id: 'cal-2',
    title: 'Mid-Shawwal White Days (Ayyam al-Beed)',
    arabicTitle: 'أَيَّامُ الْبِيضِ - شَوَّال',
    hijriDate: '13, 14, 15 Shawwal 1447 AH',
    gregorianDate: '10 - 12 May 2026',
    category: 'SUNNAH_FAST',
    campusScope: 'all',
    description: 'Sunnah fasting on the 13th, 14th, and 15th of the lunar month when the moon is full.',
  },
  {
    id: 'cal-3',
    title: 'UK Campus Hifz Annual Sanad Convocation',
    arabicTitle: 'حَفْلُ تَخْرِيجِ حَفَظَةِ الْقُرْآنِ الْكَرِيمِ',
    hijriDate: '24 Shawwal 1447 AH',
    gregorianDate: '21 May 2026',
    category: 'MADRASA_ACADEMIC',
    campusScope: 'uk',
    description: 'Grand Sanad awarding ceremony for students completing full 30 Juz memorization with certified Isnad.',
  },
  {
    id: 'cal-4',
    title: 'KTS Pakistan Dars-e-Nizami Annual Examinations',
    arabicTitle: 'امْتِحَانَاتُ دَرْسِ نِظَامِي السَّنَوِيَّةِ',
    hijriDate: '5 - 18 Dhu al-Qi\'dah 1447 AH',
    gregorianDate: '1 - 14 June 2026',
    category: 'EXAMINATION',
    campusScope: 'kts',
    description: 'Comprehensive annual examinations in Tafseer, Hadith (Sihah Sittah), Fiqh, and Arabic grammar.',
  },
  {
    id: 'cal-5',
    title: 'First 10 Days of Dhu al-Hijjah (Sacred Days)',
    arabicTitle: 'عَشْرُ ذِي الْحِجَّةِ الْمُبَارَكَةِ',
    hijriDate: '1 - 10 Dhu al-Hijjah 1447 AH',
    gregorianDate: '26 June - 5 July 2026',
    category: 'SACRED_HOLIDAY',
    campusScope: 'all',
    description: 'The most virtuous 10 days of the year for good deeds, fasting, Takbeerat, and charity.',
  },
  {
    id: 'cal-6',
    title: 'Day of Arafah (9 Dhu al-Hijjah)',
    arabicTitle: 'يَوْمُ عَرَفَةَ الْمُبَارَكُ',
    hijriDate: '9 Dhu al-Hijjah 1447 AH',
    gregorianDate: '4 July 2026',
    category: 'SACRED_HOLIDAY',
    campusScope: 'all',
    description: 'Pinnacle of Hajj pilgrimage. Fasting on this day expiates sins of the previous and coming year.',
  },
  {
    id: 'cal-7',
    title: 'Eid al-Adha (Feast of Sacrifice)',
    arabicTitle: 'عِيدُ الأَضْحَى الْمُبَارَكُ',
    hijriDate: '10 - 13 Dhu al-Hijjah 1447 AH',
    gregorianDate: '5 - 8 July 2026',
    category: 'SACRED_HOLIDAY',
    campusScope: 'all',
    description: 'Madrasa campus holiday for Eid prayers, Qurbani (Udhiyah), and family celebrations across UK and PK.',
  },
  {
    id: 'cal-8',
    title: 'New Islamic Hijri Year 1448 AH',
    arabicTitle: 'رَأْسُ السَّنَةِ الْهِجْرِيَّةِ الْجَدِيدَةِ',
    hijriDate: '1 Muharram 1448 AH',
    gregorianDate: '25 July 2026',
    category: 'SACRED_HOLIDAY',
    campusScope: 'all',
    description: 'Commencement of the new academic session and Hijri year across all Misbah-ul-Quran branches.',
  },
  {
    id: 'cal-9',
    title: 'Day of Ashura (10 Muharram)',
    arabicTitle: 'يَوْمُ عَاشُورَاءَ',
    hijriDate: '10 Muharram 1448 AH',
    gregorianDate: '3 August 2026',
    category: 'SUNNAH_FAST',
    campusScope: 'all',
    description: 'Recommended Sunnah fast on the 9th and 10th of Muharram commemorating Musa\'s salvation.',
  },
];


// Authentic Prophetic Hadith & Quranic Gems for Daily Interactive Reflection
export const DAILY_ISLAMIC_REFLECTIONS: DailyIslamicReflection[] = [
  {
    id: 'ref-1',
    type: 'HADITH',
    arabicText: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    englishTranslation: 'The best of you are those who learn the Quran and teach it to others.',
    sourceReference: 'Sahih al-Bukhari 5027',
    narratorOrSurah: 'Narrated by Uthman ibn Affan (RA)',
    theme: 'QURAN_STUDY',
  },
  {
    id: 'ref-2',
    type: 'HADITH',
    arabicText: 'الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ',
    englishTranslation: 'The one who is skilled in the Quran will be with the noble, obedient angels.',
    sourceReference: 'Sahih Muslim 798',
    narratorOrSurah: 'Narrated by Aisha (RA)',
    theme: 'QURAN_STUDY',
  },
  {
    id: 'ref-3',
    type: 'AYAH',
    arabicText: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ',
    englishTranslation: 'Allah will elevate those of you who believe and those who are given knowledge by many degrees.',
    sourceReference: 'Surah Al-Mujadilah (58:11)',
    narratorOrSurah: 'Holy Quran',
    theme: 'KNOWLEDGE',
  },
  {
    id: 'ref-4',
    type: 'HADITH',
    arabicText: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    englishTranslation: 'Whoever travels upon a path seeking sacred knowledge, Allah makes easy for him a path to Jannah.',
    sourceReference: 'Sahih Muslim 2699',
    narratorOrSurah: 'Narrated by Abu Hurairah (RA)',
    theme: 'KNOWLEDGE',
  },
  {
    id: 'ref-5',
    type: 'AYAH',
    arabicText: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا',
    englishTranslation: 'Your Lord has decreed that you worship none but Him, and be kind to your parents.',
    sourceReference: 'Surah Al-Isra (17:23)',
    narratorOrSurah: 'Holy Quran',
    theme: 'PARENTS',
  },
  {
    id: 'ref-6',
    type: 'HADITH',
    arabicText: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    englishTranslation: 'Actions are judged by intentions, and every person will get what he intended.',
    sourceReference: 'Sahih al-Bukhari 1',
    narratorOrSurah: 'Narrated by Umar ibn al-Khattab (RA)',
    theme: 'SINCERITY',
  },
  {
    id: 'ref-7',
    type: 'HADITH',
    arabicText: 'إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلاَقًا',
    englishTranslation: 'Indeed, the best amongst you are those with the finest character and conduct (Akhlaq).',
    sourceReference: 'Sahih al-Bukhari 6035',
    narratorOrSurah: 'Narrated by Abdullah ibn Amr (RA)',
    theme: 'ADAB',
  },
];

// Interactive Daily Sunnah Checklist Items
export const DAILY_SUNNAH_CHECKLIST: SunnahHabitItem[] = [
  {
    id: 'sunnah-1',
    title: '5 Fard Prayers in Congregation (Jama\'ah)',
    arabicTitle: 'الصَّلَوَاتُ الْخَمْسُ فِي جَمَاعَةٍ',
    category: 'SALAH',
    rewardPoints: 25,
    description: 'Perform all 5 obligatory daily prayers with congregational Iqamah at the campus mosque or local musalla.',
  },
  {
    id: 'sunnah-2',
    title: 'Morning & Evening Adhkar & Ayat al-Kursi',
    arabicTitle: 'أَذْكَارُ الصَّبَاحِ وَالْمَسَاءِ',
    category: 'ADHKAR',
    rewardPoints: 15,
    description: 'Recite Ayat al-Kursi, the 3 Quls (Ikhlas, Falaq, Nas), and SubhanAllah wa Bihamdihi 100 times.',
  },
  {
    id: 'sunnah-3',
    title: 'Daily Quran Tilawah (Minimum 1 Ruku / 1/2 Juz)',
    arabicTitle: 'تِلاوَةُ الْقُرْآنِ الْكَرِيمِ',
    category: 'QURAN',
    rewardPoints: 20,
    description: 'Sit in a quiet space with Wudu, facing the Qibla, reciting in Tartil tone.',
  },
  {
    id: 'sunnah-4',
    title: 'Sunnah Greeting with Salam & Smiling',
    arabicTitle: 'إِفْشَاءُ السَّلَامِ وَالتَّبَسُّمُ',
    category: 'AKHLAQ',
    rewardPoints: 10,
    description: 'Greet fellow students, teachers, and parents with Assalamu Alaikum wa Rahmatullahi wa Barakatuh.',
  },
  {
    id: 'sunnah-5',
    title: 'Dua & Service for Parents & Family',
    arabicTitle: 'بِرُّ الْوَالِدَيْنِ وَالدُّعَاءُ لَهُمَا',
    category: 'AKHLAQ',
    rewardPoints: 15,
    description: 'Recite Rabbi-rhamhuma kama rabbayani sagheera and assist parents with cheerful humility.',
  },
  {
    id: 'sunnah-6',
    title: 'Daily Sadaqah or Charitable Act',
    arabicTitle: 'الصَّدَقَةُ وَفِعْلُ الْخَيْرِ',
    category: 'AKHLAQ',
    rewardPoints: 10,
    description: 'Give charity or remove a harmful object from the path, as every good deed is Sadaqah.',
  },
  {
    id: 'sunnah-7',
    title: 'Sunnah Fasting (Mondays & Thursdays / Ayyam al-Beed)',
    arabicTitle: 'صِيَامُ الإِثْنَيْنِ وَالْخَمِيسِ',
    category: 'FASTING',
    rewardPoints: 20,
    description: 'Voluntary fasting reviving the Prophetic tradition to elevate spirituality and discipline.',
  },
];

// Tajweed Criteria & Assessment Guide
export const TAJWEED_ASSESSMENT_CRITERIA = [
  {
    id: 'makharij',
    name: 'Makharij al-Huroof (Articulations)',
    arabic: 'مَخَارِجُ الْحُرُوفِ',
    description: 'Accurate emission of letters from throat (Halq), tongue (Lisan), lips (Shafatayn), and nasal cavity (Khayshoom).',
  },
  {
    id: 'ghunnah',
    name: 'Ahkam an-Noon & Meem (Ghunnah)',
    arabic: 'أَحْكَامُ النُّونِ وَالْمِيمِ',
    description: 'Flawless execution of Idgham (Merging), Ikhfa (Concealment), Iqlab (Conversion), and Izhar (Clarity).',
  },
  {
    id: 'qalqalah',
    name: 'Ahkam al-Qalqalah (Echoing)',
    arabic: 'أَحْكَامُ الْقَلْقَلَةِ',
    description: 'Proper bouncing resonance on the five letters of Qutb Jad (ق, ط, ب, ج, د) when in Sukoon.',
  },
  {
    id: 'madd',
    name: 'Ahkam al-Madd (Elongations)',
    arabic: 'أَحْكَامُ الْمَدِّ',
    description: 'Natural 2-harakah Madd Asli, 4-5 harakah Munfasil/Muttasil, and 6-harakah Madd Lazim counts.',
  },
  {
    id: 'waqf',
    name: 'Waqf & Ibtida (Stopping Rules)',
    arabic: 'الْوَقْفُ وَالاِبْتِدَاءُ',
    description: 'Stopping at permissible Quranic symbols (م, ج, صلي, قلي) without cutting breath mid-meaning.',
  },
];
