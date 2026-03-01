import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';

export interface Delivery {
  transactionId: string;
  productName?: string;
  user?: string;
  email?: string;
  address?: string;
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
  quantity?: number;
}

export interface HeaderProps {
  title?: string;
}

const statusStyles: Record<string, { text: string; icon: React.ReactNode; bg: string; border: string }> = {
  ACCEPTED: { text: 'text-emerald-700', icon: <CheckCircle className="h-4 w-4" />, bg: 'bg-emerald-50', border: 'ring-emerald-100' },
  PENDING: { text: 'text-amber-600', icon: <Clock className="h-4 w-4" />, bg: 'bg-amber-50', border: 'ring-amber-100' },
  REJECTED: { text: 'text-rose-600', icon: <XCircle className="h-4 w-4" />, bg: 'bg-rose-50', border: 'ring-rose-100' },
};

const mapApiStatus = (s?: string) => {
  if (!s) return 'PENDING';
  const st = s.toString().toUpperCase();
  if (st === 'APPROVED' || st === 'ACCEPTED') return 'ACCEPTED';
  if (st === 'PENDING') return 'PENDING';
  return 'REJECTED';
};

type ApiDelivery = {
  status?: string;
  address?: string;
  city?: string;
  productName?: string;
  user?: string;
  email?: string;
  quantity?: number;
  transactionId?: string;
  transaction?: {
    id?: string;
    product?: { name?: string };
    customer?: { fullName?: string; email?: string };
    quantity?: number;
  };
};

export const Header: React.FC<HeaderProps> = ({ title = 'Checkout Store' }) => {
  const [open, setOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const fetchDeliveries = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<{ success: boolean; data: ApiDelivery[] }>(
          'http://localhost:3000/delivery',
          { signal: controller.signal }
        );
        const items = res.data?.data ?? [];
        const mapped: Delivery[] = items.map((d) => ({
          transactionId:
            d.transactionId ??
            d.transaction?.id ??
            `tx-${Math.random().toString(36).slice(2, 9)}`,

          productName:
            d.productName ??
            d.transaction?.product?.name ??
            'Producto',

          user:
            d.user ??
            d.transaction?.customer?.fullName ??
            d.email ??
            d.transaction?.customer?.email ??
            'Cliente',

          email:
            d.email ??
            d.transaction?.customer?.email,

          address: `${d.address ?? ''}${d.city ? ', ' + d.city : ''}`.trim(),

          status: mapApiStatus(d.status),

          quantity: d.quantity ?? d.transaction?.quantity,
        }));
        setDeliveries(mapped);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        console.error('Error fetching deliveries', err);
        setError('No se pudieron cargar los pedidos.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();

    return () => {
      controller.abort();
    };
  }, [open]);

  const shortId = (id: string) => {
    if (!id) return '';
    return id.length > 10 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-0 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 w-9 h-9 flex items-center justify-center shadow">
                <span className="text-sm font-semibold text-white">CS</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                  {title}
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5">Gestión de pedidos</p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir pedidos">
                  <ClipboardList className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[min(520px,100%)]">
                <SheetHeader>
                  <SheetTitle>Pedidos</SheetTitle>
                  <SheetDescription>Lista de entregas y su estado</SheetDescription>
                </SheetHeader>

                <div className="mt-4 px-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="py-6 px-4 text-sm text-rose-600">{error}</div>
                  ) : deliveries.length === 0 ? (
                    <p className="text-sm text-gray-500 px-4 py-6">No hay pedidos recientes.</p>
                  ) : (
                    <div className="space-y-4 pb-6 overflow-auto max-h-[70vh] pr-2">
                      {deliveries.map((d) => {
                        const st = statusStyles[d.status];
                        return (
                          <article
                            key={d.transactionId}
                            className="flex items-stretch gap-4 p-4 rounded-xl bg-white shadow-sm"
                            aria-labelledby={`tx-${d.transactionId}`}
                          >

                            {/* Main column */}
                            <div className="flex-1 min-w-0">
                              {/* First row: product name */}
                              <h3
                                id={`tx-${d.transactionId}`}
                                className="text-sm font-semibold text-gray-900 break-words"
                                title={d.productName}
                              >
                                {d.productName ?? 'Producto'}
                              </h3>

                              {/* Second row: transaction id */}
                              <p className="text-xs text-gray-500 font-mono mt-1 whitespace-nowrap truncate">
                                Pedido: {d.transactionId}
                              </p>

                              {/* Third row: user (name) */}
                              <p className="text-xs text-gray-700 mt-2 truncate">
                                {d.user ?? 'Cliente'}
                              </p>

                              {/* Fourth row: email on its own line */}
                              {d.email && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {d.email}
                                </p>
                              )}

                              {/* Fifth row: address */}
                              {d.address && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{d.address}</p>}
                            </div>

                            {/* Right column: status + quantity */}
                            <div className="flex flex-col items-end justify-start gap-2">
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text} ${st.border}`}
                                role="status"
                                aria-label={`Estado: ${d.status}`}
                              >
                                <span className="flex items-center">{st.icon}</span>
                                <span>{d.status}</span>
                              </div>

                              {/* Quantity badge under status */}
                              {typeof d.quantity === 'number' && (
                                <span className="mt-2 inline-flex items-center justify-center px-2 py-1 text-xs bg-slate-100 rounded-full text-slate-700">
                                  Cant: {d.quantity}
                                </span>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;