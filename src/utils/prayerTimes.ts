// Prayer time calculations for Misbah-ul-Quran UK (London) and Pakistan (Haripur) campuses

export interface PrayerSlot {
  name: string;
  timeStr: string;
  iqamahStr?: string;
  hours: number;
  minutes: number;
  isSpecial?: boolean;
}

export interface BranchPrayerSummary {
  branchCode: 'UK' | 'PK';
  branchLabel: string;
  locationName: string;
  timezone: string;
  coordinates: string;
  calculationMethod: string;
  hijriDate: string;
  nextPrayer: string;
  nextPrayerTime: string;
  nextPrayerIqamah?: string;
  countdownMinutes: number;
  currentTimeStr: string;
  currentDateStr: string;
  fullSchedule: { name: string; adhan: string; iqamah: string; isNext: boolean }[];
  jummahSchedule: { firstKhutbah: string; firstSalah: string; secondKhutbah?: string; secondSalah?: string };
}

export interface DualBranchNamaz {
  uk: BranchPrayerSummary;
  pk: BranchPrayerSummary;
}

const UK_PRAYERS: PrayerSlot[] = [
  { name: 'Fajr', timeStr: '05:40 AM', iqamahStr: '06:15 AM', hours: 5, minutes: 40 },
  { name: 'Sunrise', timeStr: '07:10 AM', iqamahStr: '—', hours: 7, minutes: 10, isSpecial: true },
  { name: 'Dhuhr', timeStr: '01:00 PM', iqamahStr: '01:30 PM', hours: 13, minutes: 0 },
  { name: 'Asr', timeStr: '04:15 PM', iqamahStr: '04:45 PM', hours: 16, minutes: 15 },
  { name: 'Maghrib', timeStr: '06:30 PM', iqamahStr: '06:35 PM', hours: 18, minutes: 30 },
  { name: 'Isha', timeStr: '08:00 PM', iqamahStr: '08:30 PM', hours: 20, minutes: 0 },
];

const PK_PRAYERS: PrayerSlot[] = [
  { name: 'Fajr', timeStr: '04:55 AM', iqamahStr: '05:30 AM', hours: 4, minutes: 55 },
  { name: 'Sunrise', timeStr: '06:18 AM', iqamahStr: '—', hours: 6, minutes: 18, isSpecial: true },
  { name: 'Dhuhr', timeStr: '12:05 PM', iqamahStr: '12:30 PM', hours: 12, minutes: 5 },
  { name: 'Asr', timeStr: '04:35 PM', iqamahStr: '05:00 PM', hours: 16, minutes: 35 },
  { name: 'Maghrib', timeStr: '05:50 PM', iqamahStr: '05:55 PM', hours: 17, minutes: 50 },
  { name: 'Isha', timeStr: '07:15 PM', iqamahStr: '07:45 PM', hours: 19, minutes: 15 },
];

function getBranchNextPrayer(
  timeZone: string,
  schedule: PrayerSlot[],
  branchCode: 'UK' | 'PK',
  branchLabel: string,
  locationName: string,
  coordinates: string,
  calculationMethod: string,
  jummahSchedule: { firstKhutbah: string; firstSalah: string; secondKhutbah?: string; secondSalah?: string }
): BranchPrayerSummary {
  const now = new Date();

  // Extract hour & minute in target timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const time12Formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const parts = formatter.format(now).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const currentTotalMinutes = h * 60 + m;

  // Filter only obligatory prayers for "Next Prayer" calculation
  const obligatoryPrayers = schedule.filter((p) => !p.isSpecial);

  let nextP = obligatoryPrayers.find((p) => p.hours * 60 + p.minutes > currentTotalMinutes);
  let countdownMinutes = 0;

  if (nextP) {
    countdownMinutes = nextP.hours * 60 + nextP.minutes - currentTotalMinutes;
  } else {
    // Tomorrow Fajr
    nextP = obligatoryPrayers[0];
    countdownMinutes = 24 * 60 - currentTotalMinutes + (nextP.hours * 60 + nextP.minutes);
  }

  // Estimated Hijri date string for Rabi' al-Thani 1448 AH
  const hijriDate = branchCode === 'UK' ? '25 Rabi al-Thani 1448 AH' : '26 Rabi al-Thani 1448 AH';

  return {
    branchCode,
    branchLabel,
    locationName,
    timezone: timeZone,
    coordinates,
    calculationMethod,
    hijriDate,
    nextPrayer: nextP.name,
    nextPrayerTime: nextP.timeStr,
    nextPrayerIqamah: nextP.iqamahStr,
    countdownMinutes,
    currentTimeStr: time12Formatter.format(now),
    currentDateStr: dateFormatter.format(now),
    fullSchedule: schedule.map((s) => ({
      name: s.name,
      adhan: s.timeStr,
      iqamah: s.iqamahStr || '—',
      isNext: s.name === nextP.name,
    })),
    jummahSchedule,
  };
}

export function getDualBranchNamazTimes(): DualBranchNamaz {
  return {
    uk: getBranchNextPrayer(
      'Europe/London',
      UK_PRAYERS,
      'UK',
      'UK Campus (London)',
      '142 Whitechapel Rd, London E1 1JE',
      '51.5195° N, 0.0594° W',
      'Unified London Calculation (Hanafi Asr)',
      {
        firstKhutbah: '01:15 PM',
        firstSalah: '01:45 PM',
        secondKhutbah: '02:15 PM',
        secondSalah: '02:40 PM',
      }
    ),
    pk: getBranchNextPrayer(
      'Asia/Karachi',
      PK_PRAYERS,
      'PK',
      'KTS Pakistan Campus (Haripur)',
      'Sector 3, Khalabat Township, Haripur, KPK',
      '33.9943° N, 72.9341° E',
      'Univ. of Islamic Sciences, Karachi (Hanafi Asr)',
      {
        firstKhutbah: '12:30 PM',
        firstSalah: '01:00 PM',
      }
    ),
  };
}

export function getCampusPrayerTimes(campusId: string): BranchPrayerSummary {
  const dual = getDualBranchNamazTimes();
  if (campusId === 'uk') return dual.uk;
  if (campusId === 'kts') return dual.pk;
  // If 'all', default to UK but full schedule is available
  return dual.uk;
}
