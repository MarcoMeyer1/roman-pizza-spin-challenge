'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-[#215197] text-white p-4 flex justify-between">
      <h1 className="font-bold text-lg">🍕 Roman&apos;s Pizza Spin</h1>
      <nav className="flex gap-4">
        <Link href="/">Spin</Link>
        <Link href="/spin/summary">Summary</Link>
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
      </nav>
    </header>
  );
}
