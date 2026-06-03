import { NextRequest, NextResponse } from 'next/server';
import { ONBOARDING_COOKIE } from './app/lib/onboarding';

const publicRoutes = new Set([
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
]);

const publicPrefixes = [
    '/api',
    '/_next',
];

const appRoutes = new Set([
    '/',
    '/daily-checkin',
    '/forgot-password',
    '/haidang',
    '/homepage',
    '/honuoc',
    '/login',
    '/nhago',
    '/register',
    '/reset-password',
    '/suoinguon',
    '/survey',
    '/thanthu',
    '/thucung',
    '/vuonhoa',
]);

function isPublicRoute(pathname: string) {
    if (publicRoutes.has(pathname)) return true;
    return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    const session = request.cookies.get('session')?.value;
    if (session) {
        const onboardingStep = request.cookies.get(ONBOARDING_COOKIE)?.value;

        console.log(`🔍 [MIDDLEWARE] pathname: ${pathname}, onboardingStep: ${onboardingStep}`);

        if (!onboardingStep) {
            const isRequiredFlowPage = pathname === '/survey' || pathname === '/daily-checkin';

            if (!isRequiredFlowPage) {
                console.log(`🔍 [MIDDLEWARE] No onboardingStep, redirecting to /survey`);
                return NextResponse.redirect(new URL('/survey', request.url));
            }
        }

        if (onboardingStep === 'survey' && pathname !== '/survey') {
            console.log(`🔍 [MIDDLEWARE] onboardingStep=survey, redirecting to /survey`);
            return NextResponse.redirect(new URL('/survey', request.url));
        }

        if (onboardingStep === 'daily') {
            const isDailyPage = pathname === '/daily-checkin';
            const isForcedSurvey = pathname === '/survey' && !!searchParams.get('topic');

            if (!isDailyPage && !isForcedSurvey) {
                console.log(`🔍 [MIDDLEWARE] onboardingStep=daily, not daily page, redirecting to /daily-checkin`);
                return NextResponse.redirect(new URL('/daily-checkin', request.url));
            }
        }

        // 🔥 Allow access to any app route if onboarding is 'done'
        if (onboardingStep === 'done') {
            console.log(`🔍 [MIDDLEWARE] onboardingStep=done, allowing path: ${pathname}`);
            if (!appRoutes.has(pathname)) {
                return NextResponse.redirect(new URL('/homepage', request.url));
            }
            return NextResponse.next();
        }

        if (!appRoutes.has(pathname)) {
            return NextResponse.redirect(new URL('/homepage', request.url));
        }

        return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|models|audio|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|mp3|wav|m4a|json|css|js|map)$).*)',
    ],
};
