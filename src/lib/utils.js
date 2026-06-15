/**
 * Format price to Indonesian Rupiah
 * @param {number} amount - Price in IDR (integer)
 * @returns {string} Formatted string like "Rp 65.000"
 */
export function formatRupiah(amount) {
  const num = Math.round(amount || 0);
  return 'Rp ' + num.toLocaleString('id-ID');
}
