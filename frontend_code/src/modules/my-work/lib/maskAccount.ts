export function maskAccount(num: string): string {
  if (!num || num.length < 4) return '\u2022\u2022\u2022\u2022'
  return `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${num.slice(-4)}`
}