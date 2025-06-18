export function toCurrency(num: number, currency: string): string {
  return (
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) +
    " " +
    currency
  );
}
