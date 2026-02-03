import { NextRequest, NextResponse } from "next/server";

// Free exchange rates (base: USD) - In production, use a real API like exchangerate-api.com
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.50,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.45,
  MXN: 17.15,
  BRL: 5.05,
  KRW: 1320.0,
  SGD: 1.35,
  HKD: 7.82,
  NOK: 10.75,
  SEK: 10.42,
  DKK: 6.87,
  NZD: 1.66,
  ZAR: 18.65,
  RUB: 92.50,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from")?.toUpperCase();
  const to = searchParams.get("to")?.toUpperCase();
  const amount = parseFloat(searchParams.get("amount") || "1");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Please provide 'from' and 'to' currency codes" },
      { status: 400 }
    );
  }

  if (!EXCHANGE_RATES[from] || !EXCHANGE_RATES[to]) {
    return NextResponse.json(
      { error: "Unsupported currency code" },
      { status: 400 }
    );
  }

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Invalid amount" },
      { status: 400 }
    );
  }

  // Convert through USD as base
  const amountInUSD = amount / EXCHANGE_RATES[from];
  const convertedAmount = amountInUSD * EXCHANGE_RATES[to];
  const rate = EXCHANGE_RATES[to] / EXCHANGE_RATES[from];

  return NextResponse.json({
    result: convertedAmount,
    rate: rate,
    from: from,
    to: to,
    amount: amount,
  });
}
