'use client';

import { useEffect, useState } from 'react';
import Header   from '../components/Header';
import SpinWheel from '../components/SpinWheel';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [customer, setCustomer] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) setCustomer(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-6 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Spin & Win!</h2>

        {!customer ? (
          <div className="text-red-600">
            <p>You must log in to spin.</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-[#215197] text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <SpinWheel customerId={customer.id} />
        )}
      </main>
    </div>
  );
}
