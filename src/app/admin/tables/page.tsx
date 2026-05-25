"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, QrCode, Plus, Minus } from "lucide-react";

const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function TablesPage() {
  const [tableCount, setTableCount] = useState(12);

  function handlePrint() {
    window.print();
  }

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-orange-500" />
            Table QR Codes
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Customers scan to order from their table
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2">
            <span className="text-sm text-stone-500 mr-1">Tables:</span>
            <button
              onClick={() => setTableCount((n) => Math.max(1, n - 1))}
              className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-stone-900 dark:text-white w-8 text-center">
              {tableCount}
            </span>
            <button
              onClick={() => setTableCount((n) => Math.min(50, n + 1))}
              className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print All
          </button>
        </div>
      </div>

      {/* QR grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 print:grid-cols-4 print:gap-6">
        {tables.map((table) => {
          const url = `${APP_URL}/menu?table=${table}`;
          return (
            <div
              key={table}
              className="bg-white dark:bg-stone-900 print:bg-white rounded-2xl border border-stone-200 dark:border-stone-800 print:border-stone-300 p-5 flex flex-col items-center gap-3 text-center print:break-inside-avoid"
            >
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <QRCodeSVG
                  value={url}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div>
                <p className="font-black text-2xl text-stone-900 print:text-black">
                  {table}
                </p>
                <p className="text-stone-400 print:text-stone-600 text-xs font-medium">
                  Scan to order
                </p>
              </div>
              <div className="w-full border-t border-stone-100 dark:border-stone-800 print:border-stone-200 pt-2">
                <p className="text-stone-400 print:text-stone-500 text-[9px] font-medium break-all leading-tight">
                  Ember & Oak
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          main, main * { visibility: visible; }
          main { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
