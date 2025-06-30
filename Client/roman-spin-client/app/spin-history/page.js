'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { useRouter } from 'next/navigation';

const fmtDate = (iso) => new Date(iso).toLocaleDateString();

export default function SummaryPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (!stored) return;

    const cust = JSON.parse(stored);
    setCustomer(cust);

    fetch(`http://localhost:5000/api/history/${cust.id}`)
      .then((r) => r.json())
      .then((d) => {
        setHistory(d.history || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('customer');
    router.push('/login');
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-6 text-center">
          <p className="text-red-600">Please log in to view your summary.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-[#215197] text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </main>
      </div>
    );
  }

  const totalSpins = history.length;
  const totalWins  = history.filter((h) => h.prize !== 'Try Again').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-2xl mx-auto p-6 pt-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-black">
            Welcome back, {customer.name}!
          </h1>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Log out
          </button>
        </div>

        {loading ? (
          <p>Loading your spins…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded shadow p-4">
                <p className="text-black/70">Total Spins</p>
                <p className="text-2xl font-bold text-black">{totalSpins}</p>
              </div>
              <div className="bg-white rounded shadow p-4">
                <p className="text-black/70">Total Wins</p>
                <p className="text-2xl font-bold text-black">{totalWins}</p>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2 text-black/70">Recent Spins</h2>
            {history.length === 0 ? (
              <p>No spins yet – go spin the wheel!</p>
            ) : (
              <table className="w-full bg-white rounded shadow text-left">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-black font-semibold">Date</th>
                    <th className="px-4 py-2 text-black font-semibold">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((h, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2 text-black">{fmtDate(h.spun_at)}</td>
                      <td className="px-4 py-2 text-black">{h.prize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  );
}
