export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export const number = new Intl.NumberFormat("pt-BR");

export function percent(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function shortCurrency(value: number) {
  return currency.format(value).replace(/\s/g, " ");
}
