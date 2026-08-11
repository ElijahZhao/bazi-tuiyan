/**
 * 通用工具函数
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 五行颜色映射
 */
export const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  木: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', hex: '#10b981' },
  火: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', hex: '#ef4444' },
  土: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', hex: '#f59e0b' },
  金: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', hex: '#64748b' },
  水: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', hex: '#3b82f6' },
};

/**
 * 十神颜色映射（按吉凶分类）
 */
export const TEN_GOD_COLORS: Record<string, string> = {
  比肩: 'text-emerald-600',
  劫财: 'text-orange-600',
  食神: 'text-blue-600',
  伤官: 'text-purple-600',
  偏财: 'text-cyan-600',
  正财: 'text-teal-600',
  七杀: 'text-red-600',
  正官: 'text-indigo-600',
  偏印: 'text-gray-600',
  正印: 'text-green-600',
};

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化起运岁数
 */
export function formatStartAge(startAge: number, startMonth: number, startDay: number, startHour: number): string {
  const parts: string[] = [];
  if (startAge > 0) parts.push(`${startAge}岁`);
  if (startMonth > 0) parts.push(`${startMonth}月`);
  if (startDay > 0) parts.push(`${startDay}天`);
  if (startHour > 0) parts.push(`${startHour}时`);
  return parts.join('') || '0岁';
}
