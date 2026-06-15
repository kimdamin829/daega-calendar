/** 현황판용 이름 마스킹 */
export function maskGuestName(name: string): string {
  const chars = [...name];
  const len = chars.length;

  if (len <= 1) return name;
  if (len === 2) return `${chars[0]}*`;
  if (len === 3) return `${chars[0]}*${chars[2]}`;
  if (len === 4) return `${chars[0]}**${chars[3]}`;

  return chars.map((char, index) => (index === 0 || index === 2 ? char : "*")).join("");
}
