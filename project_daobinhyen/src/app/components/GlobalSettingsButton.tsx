'use client';

import { usePathname } from 'next/navigation';
import SettingsButton from '@/app/components/SettingsButton';

const HIDDEN_ROUTES = [
  '/',
  '/login',
  '/register',
  '/survey',
  '/daily-checkin',
  '/forgot-password',
  '/forgotpassword',
];

export default function GlobalSettingsButton() {
  const pathname = usePathname();
  const shouldHide = HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (shouldHide) return null;

  return <SettingsButton className={pathname === '/thucung' ? 'fixed top-6 right-6 z-[9999]' : undefined} />;
}
