const displayFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 2,
});

const fullFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

export const defaultNumberFormatter = {
  display: (n) => displayFormatter.format(n),
  tooltip: (n) => fullFormatter.format(n),
};
