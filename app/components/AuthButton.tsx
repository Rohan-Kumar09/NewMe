"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type User = { name?: string | null; email?: string | null; picture?: string | null };

export default function AuthButton() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!mounted) return;
        setAuthenticated(!!data.authenticated);
        setUser(data.user ?? null);
      } catch (e) {
        console.error('Failed to fetch auth status', e);
        if (!mounted) return;
        setAuthenticated(false);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    function handleDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    check();
    document.addEventListener('click', handleDocClick);
    return () => {
      mounted = false;
      document.removeEventListener('click', handleDocClick);
    };
  }, []);

  if (loading) {
    return (
      <span className="ml-4 inline-flex items-center px-4 py-2 text-black text-2xl font-medium font-['Comfortaa',sans-serif]">
        ...
      </span>
    );
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // redirect to home which will show login
      window.location.href = '/';
    } catch (e) {
      console.error('Logout failed', e);
    }
  }

  if (authenticated) {
    return (
      <div ref={containerRef} className="relative inline-flex items-center">
        {user?.picture ? (
          <Image
            src={user.picture}
            alt={user.name ?? 'avatar'}
            width={36}
            height={36}
            className="ml-3 rounded-full cursor-pointer transition-transform transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
            onClick={() => setMenuOpen((s) => !s)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMenuOpen((s) => !s);
              }
            }}
          />
        ) : (
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="ml-4 inline-flex items-center px-3 py-1 text-black text-xl font-medium hover:underline hover:bg-gray-100 transition-colors rounded"
          >
            Account
          </button>
        )}

        {menuOpen ? (
          <div className="absolute right-0 top-full mt-3 w-40 bg-white border rounded shadow-md z-50">
            <div className="px-3 py-2 text-sm text-gray-700">{user?.name ?? user?.email}</div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href="/api/auth/google"
      className="ml-4 inline-flex items-center px-4 py-2 text-black text-2xl font-medium hover:underline font-['Comfortaa',sans-serif]"
    >
      Login
    </Link>
  );
}
