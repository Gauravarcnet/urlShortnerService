const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length;

export function encodeBase62(num: number | bigint): string {
  let n = BigInt(num);
  if (n === 0n) return ALPHABET[0];
  let result = '';
  while (n > 0n) {
    const rem = Number(n % BigInt(BASE));
    result = ALPHABET[rem] + result;
    n = n / BigInt(BASE);
  }
  return result;
}
