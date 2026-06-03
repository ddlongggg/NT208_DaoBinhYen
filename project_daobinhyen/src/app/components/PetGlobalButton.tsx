'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Quicksand } from 'next/font/google';
import { useAuthContext } from '@/app/context/AuthContext';

const quicksand = Quicksand({
  subsets: ['vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const allowedRoutes = [
  '/homepage',
  '/vuonhoa',
  '/hangdong',
  '/haidang',
  '/thanthu',
  '/nhago',
  '/vachda',
  '/honuoc',
];

export default function PetGlobalButton() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user: firebaseUser } = useAuthContext();
  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!isAllowed || !firebaseUser) return null;

  return (
    <button
      onClick={() => router.push('/thucung')}
      className={`fixed bottom-8 left-[17rem] z-[1500] group flex min-w-[220px] items-center justify-center gap-3 bg-gradient-to-r from-emerald-500/85 to-cyan-700/85 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(20,184,166,0.35)] hover:scale-105 hover:shadow-[0_0_30px_rgba(20,184,166,0.55)] transition-all duration-300 ${quicksand.className}`}
    >
      <span className="text-2xl drop-shadow-md group-hover:-rotate-12 group-hover:scale-110 transition-transform">🐾</span>
      <span className="text-white font-black tracking-widest text-sm uppercase">Thú Cưng</span>
    </button>
  );
}
