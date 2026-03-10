import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatMessageTime(timestamp) {
  const date = new Date(timestamp)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Ayer'
  return format(date, 'dd/MM/yy')
}

export function formatFullTime(timestamp) {
  return format(new Date(timestamp), "d 'de' MMMM, HH:mm", { locale: es })
}

export function formatRelativeTime(timestamp) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: es })
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export const STATUS_LABELS = {
  open: 'Abierto',
  pending: 'Pendiente',
  resolved: 'Resuelto',
}

export const STATUS_STYLES = {
  open: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-slate-100 text-slate-500',
}

export const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-orange-100 text-orange-600',
  low: 'bg-blue-100 text-blue-600',
}
