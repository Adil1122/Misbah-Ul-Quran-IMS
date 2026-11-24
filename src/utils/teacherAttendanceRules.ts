// Misbah-ul-Quran IMS — Strict Teacher Attendance Time Rules Engine
//
// Rule Specification:
// Local Campus Timezone: Asia/Karachi (Pakistan KTS) or Europe/London (UK)
// - Before or at 5:00 PM (<= 17:00:00): Permitted statuses are PRESENT or ABSENT.
// - After 5:00 PM and before or at 5:30 PM (> 17:00:00 and <= 17:30:00): Permitted statuses are LATE or ABSENT.
// - After 5:30 PM (> 17:30:00): Permitted status is ABSENT only. Present and Late are prohibited.
//
// Edge cases:
// - At exactly 5:00:00 PM -> PRESENT or ABSENT
// - At exactly 5:00:01 PM -> LATE or ABSENT
// - At exactly 5:30:00 PM -> LATE or ABSENT
// - At 5:30:01 PM -> ABSENT only

import { TeacherAttendanceStatus } from '../types/ims.ts';

export type TeacherAttendanceRuleWindow =
  | 'UP_TO_5PM'
  | 'LATE_WINDOW_5_01_TO_5_30'
  | 'AUTO_ABSENT_AFTER_5_30';

export interface TimeRuleEvaluation {
  timeStr: string; // HH:mm:ss
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  window: TeacherAttendanceRuleWindow;
  windowLabel: string;
  allowedStatuses: TeacherAttendanceStatus[];
  disallowedStatuses: TeacherAttendanceStatus[];
  defaultStatus: TeacherAttendanceStatus;
  isAutoAbsent: boolean;
  ruleExplanation: string;
}

/**
 * Seconds thresholds:
 * 17:00:00 = 17 * 3600 = 61200 seconds
 * 17:30:00 = 17 * 3600 + 30 * 60 = 63000 seconds
 */
export const FIVE_PM_SECONDS = 61200; // 17:00:00
export const FIVE_THIRTY_PM_SECONDS = 63000; // 17:30:00

/**
 * Parse time string "HH:mm" or "HH:mm:ss" into total seconds from midnight
 */
export function parseTimeToSeconds(timeStr: string): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  if (!timeStr) {
    return { hours: 16, minutes: 0, seconds: 0, totalSeconds: 16 * 3600 };
  }
  const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10) || 0);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return { hours, minutes, seconds, totalSeconds };
}

/**
 * Format total seconds to "HH:mm:ss"
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format time to human-readable 12-hour format e.g. "5:15:00 PM"
 */
export function formatTime12h(timeStr: string): string {
  const { hours, minutes, seconds } = parseTimeToSeconds(timeStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
}

/**
 * Get current time details in specified campus timezone
 */
export function getCampusCurrentTime(timezone: string = 'Asia/Karachi'): {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm:ss
  totalSeconds: number;
  formatted12h: string;
} {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour'), 10) || 0;
    const minute = parseInt(getPart('minute'), 10) || 0;
    const second = parseInt(getPart('second'), 10) || 0;

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    const totalSeconds = hour * 3600 + minute * 60 + second;

    return {
      dateStr,
      timeStr,
      totalSeconds,
      formatted12h: formatTime12h(timeStr),
    };
  } catch {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0] || '17:00:00';
    const { totalSeconds } = parseTimeToSeconds(timeStr);
    return {
      dateStr,
      timeStr,
      totalSeconds,
      formatted12h: formatTime12h(timeStr),
    };
  }
}

/**
 * Pure evaluation function for teacher attendance time rule.
 * Strict boundary conditions:
 * - totalSeconds <= 61200 (<= 17:00:00) -> Present or Absent
 * - 61200 < totalSeconds <= 63000 (17:00:01 - 17:30:00) -> Late or Absent
 * - totalSeconds > 63000 (> 17:30:00) -> Absent only
 */
export function evaluateTeacherAttendanceTimeRule(timeStrOrSeconds: string | number): TimeRuleEvaluation {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let totalSeconds = 0;
  let timeStr = '';

  if (typeof timeStrOrSeconds === 'number') {
    totalSeconds = Math.max(0, Math.min(86399, timeStrOrSeconds));
    timeStr = formatSecondsToTime(totalSeconds);
    const parsed = parseTimeToSeconds(timeStr);
    hours = parsed.hours;
    minutes = parsed.minutes;
    seconds = parsed.seconds;
  } else {
    timeStr = timeStrOrSeconds;
    const parsed = parseTimeToSeconds(timeStr);
    hours = parsed.hours;
    minutes = parsed.minutes;
    seconds = parsed.seconds;
    totalSeconds = parsed.totalSeconds;
  }

  // A. At or before 5:00:00 PM (totalSeconds <= 61200)
  if (totalSeconds <= FIVE_PM_SECONDS) {
    return {
      timeStr,
      hours,
      minutes,
      seconds,
      totalSeconds,
      window: 'UP_TO_5PM',
      windowLabel: 'On or Before 5:00 PM',
      allowedStatuses: ['PRESENT', 'ABSENT'],
      disallowedStatuses: ['LATE', 'LEAVE'],
      defaultStatus: 'PRESENT',
      isAutoAbsent: false,
      ruleExplanation: 'Arrival at or before 5:00 PM allows Present or Absent status.',
    };
  }

  // B. After 5:00:00 PM through 5:30:00 PM inclusive (61200 < totalSeconds <= 63000)
  if (totalSeconds <= FIVE_THIRTY_PM_SECONDS) {
    return {
      timeStr,
      hours,
      minutes,
      seconds,
      totalSeconds,
      window: 'LATE_WINDOW_5_01_TO_5_30',
      windowLabel: '5:00:01 PM – 5:30:00 PM (Late Window)',
      allowedStatuses: ['LATE', 'ABSENT'],
      disallowedStatuses: ['PRESENT', 'LEAVE'],
      defaultStatus: 'LATE',
      isAutoAbsent: false,
      ruleExplanation: 'Arrival between 5:00:01 PM and 5:30:00 PM allows Late or Absent status only. Present is locked.',
    };
  }

  // C. After 5:30:00 PM (totalSeconds > 63000)
  return {
    timeStr,
    hours,
    minutes,
    seconds,
    totalSeconds,
    window: 'AUTO_ABSENT_AFTER_5_30',
    windowLabel: 'After 5:30 PM (Absent Only)',
    allowedStatuses: ['ABSENT'],
    disallowedStatuses: ['PRESENT', 'LATE', 'LEAVE'],
    defaultStatus: 'ABSENT',
    isAutoAbsent: true,
    ruleExplanation: 'Arrival after 5:30:00 PM automatically enforces Absent status. Present and Late are strictly prohibited.',
  };
}

/**
 * Validate teacher attendance status against time rule.
 * Throws an error or returns validation failure message if invalid.
 */
export function validateTeacherAttendanceSubmission(
  status: TeacherAttendanceStatus,
  timeStr: string
): { isValid: boolean; errorMessage?: string; evaluation: TimeRuleEvaluation } {
  const evaluation = evaluateTeacherAttendanceTimeRule(timeStr);
  const isValid = evaluation.allowedStatuses.includes(status);

  if (!isValid) {
    let errorMessage = `Status "${status}" is not permitted at ${formatTime12h(timeStr)}.`;
    if (evaluation.window === 'LATE_WINDOW_5_01_TO_5_30') {
      errorMessage = `Cannot mark "${status}" after 5:00 PM. Permitted statuses between 5:00:01 PM and 5:30:00 PM are Late or Absent only.`;
    } else if (evaluation.window === 'AUTO_ABSENT_AFTER_5_30') {
      errorMessage = `Cannot mark "${status}" after 5:30 PM. Institute rules strictly enforce Absent only after 5:30:00 PM.`;
    }
    return { isValid: false, errorMessage, evaluation };
  }

  return { isValid: true, evaluation };
}

/**
 * Preset simulation test times for evaluators and administrators
 */
export const TEACHER_ATTENDANCE_TEST_PRESETS = [
  { label: '4:45 PM (Standard Arrival)', timeStr: '16:45:00', totalSeconds: 16 * 3600 + 45 * 60, expected: 'Present or Absent' },
  { label: '5:00:00 PM (Exact Cutoff)', timeStr: '17:00:00', totalSeconds: 17 * 3600, expected: 'Present or Absent' },
  { label: '5:00:01 PM (1 Second Late)', timeStr: '17:00:01', totalSeconds: 17 * 3600 + 1, expected: 'Late or Absent' },
  { label: '5:15:00 PM (Mid-Late Window)', timeStr: '17:15:00', totalSeconds: 17 * 3600 + 15 * 60, expected: 'Late or Absent' },
  { label: '5:30:00 PM (Exact Late Cutoff)', timeStr: '17:30:00', totalSeconds: 17 * 3600 + 30 * 60, expected: 'Late or Absent' },
  { label: '5:30:01 PM (1 Second Past Cutoff)', timeStr: '17:30:01', totalSeconds: 17 * 3600 + 30 * 60 + 1, expected: 'Absent Only' },
  { label: '5:45:00 PM (Late Evening)', timeStr: '17:45:00', totalSeconds: 17 * 3600 + 45 * 60, expected: 'Absent Only' },
];
