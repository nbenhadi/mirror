export function capitalize(str: string, sentences = false): string {
  if (!str) return str
  if (!sentences) return str.charAt(0).toUpperCase() + str.slice(1)
  return str
    .split('. ')
    .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1))
    .join('. ')
}
