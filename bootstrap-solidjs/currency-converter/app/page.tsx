"use client";

import { useState } from "react";

interface ConversionResult {
  result: number;
  rate: number;
}

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "KRW", name: "South Korean Won" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "DKK", name: "Danish Krone" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "ZAR", name: "South African Rand" },
  { code: "RUB", name: "Russian Ruble" },
];

export default function Home() {
  const [amount, setAmount] = useState<string>("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const convertCurrency = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
      );

      if (!response.ok) {
        throw new Error("Failed to convert currency");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to convert currency. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>Currency Converter</h1>

      <div className="converter-form">
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="any"
          />
        </div>

        <div className="currency-row">
          <div className="form-group">
            <label htmlFor="from-currency">From</label>
            <select
              id="from-currency"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <button className="swap-btn" onClick={swapCurrencies} type="button">
            <svg viewBox="0 0 24 24">
              <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
            </svg>
          </button>

          <div className="form-group">
            <label htmlFor="to-currency">To</label>
            <select
              id="to-currency"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="convert-btn"
          onClick={convertCurrency}
          disabled={loading}
        >
          {loading ? "Converting..." : "Convert"}
        </button>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result">
            <div className="result-value">
              {toCurrency} {result.result.toFixed(2)}
            </div>
            <div className="result-rate">
              1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
