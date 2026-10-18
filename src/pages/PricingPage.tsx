import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getPricingConfig, updatePricingConfig } from '../api/pricing';
import type { PricingConfig } from '../api/pricing';
import { formatCOP, formatPercent } from '../utils/format';

/** Converts a decimal API value to the percentage shown in the UI. */
function toPercent(decimal: number): string {
  return String(Number((decimal * 100).toFixed(2)));
}

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [profitMargin, setProfitMargin] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [returnRate, setReturnRate] = useState('');
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPricingConfig()
      .then((cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        setProfitMargin(toPercent(cfg.profitMarginTarget));
        setShippingCost(String(cfg.averageShippingCost));
        setReturnRate(toPercent(cfg.returnRate));
        setCurrency(cfg.currency);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar la configuración de pricing.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const margin = Number(profitMargin);
    const shipping = Number(shippingCost);
    const ret = Number(returnRate);

    if (!Number.isFinite(margin) || margin < 0) {
      setError('El margen de utilidad debe ser un número mayor o igual a 0.');
      return;
    }
    if (!Number.isFinite(shipping) || shipping < 0) {
      setError('El costo promedio de flete debe ser un número mayor o igual a 0.');
      return;
    }
    if (!Number.isFinite(ret) || ret < 0 || ret >= 100) {
      setError('La tasa de retorno debe estar entre 0% y 100%.');
      return;
    }
    if (!currency.trim()) {
      setError('La moneda es obligatoria.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePricingConfig({
        profitMarginTarget: margin / 100,
        averageShippingCost: shipping,
        returnRate: ret / 100,
        currency: currency.trim(),
      });
      setConfig(updated);
      setSuccess(true);
    } catch {
      setError('No se pudo guardar la configuración. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Cargando configuración…</p>;
  }

  const inputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        Configuración de Pricing
      </h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Configuración guardada correctamente.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Margen de utilidad objetivo (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tasa de retorno (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={returnRate}
              onChange={(e) => setReturnRate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Costo promedio de flete (COP)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Moneda
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-700">
              RLC (Real Logistic Cost):
            </span>{' '}
            <span className="font-semibold text-slate-900">
              {config ? formatCOP(config.rlc) : '—'}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Margen {config ? formatPercent(config.profitMarginTarget * 100) : '—'}
              {' · '}
              Retorno {config ? formatPercent(config.returnRate * 100) : '—'}
            </span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
