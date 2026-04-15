// Safe date formatting that avoids timezone shifts
// Backend sends dates as plain strings like "2026-03-25"
// Using new Date("2026-03-25") can shift by -1 day due to UTC parsing
// These functions parse the string directly without timezone conversion

export function formatDate(dateStr: string | null | undefined, format: 'short' | 'medium' | 'long' = 'short'): string {
  if (!dateStr) return 'No date'
  
  // Handle ISO datetime strings — take just the date part
  const datePart = dateStr.split('T')[0]
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return dateStr

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  switch (format) {
    case 'short': return `${months[m - 1]} ${d}`           // "Mar 25"
    case 'medium': return `${months[m - 1]} ${d}, ${y}`    // "Mar 25, 2026"
    case 'long': return `${monthFull[m - 1]} ${d}, ${y}`   // "March 25, 2026"
    default: return `${months[m - 1]} ${d}`
  }
}

export function getDateMonth(dateStr: string): string {
  const [, m] = dateStr.split('T')[0].split('-').map(Number)
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] || ''
}

export function getDateDay(dateStr: string): number {
  const [, , d] = dateStr.split('T')[0].split('-').map(Number)
  return d
}
