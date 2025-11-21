"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthAwareGallery() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!mounted) return;
        setAuthenticated(!!data.authenticated);
      } catch (e) {
        if (!mounted) return;
        setAuthenticated(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !authenticated) return null;

  return (
    <Link
      href="/gallery"
      className="inline-flex items-center mr-10 px-4 py-2 text-xl font-semibold sm:text-lg text-gray-700 hover:text-primary transition-colors duration-200 rounded-md hover:bg-gray-50"
    >
      Gallery
    </Link>
  );
}
