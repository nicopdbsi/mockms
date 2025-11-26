// Currency formatting utilities
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "$",
  CAD: "$",
  CHF: "₣",
  CNY: "¥",
  INR: "₹",
  PHP: "₱",
  SGD: "$",
  HKD: "$",
  MXN: "$",
  NZD: "$",
};

export function formatCurrency(amount: number | string, currency: string = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${num.toFixed(2)}`;
}

export function getCurrencySymbol(currency: string = "USD"): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
