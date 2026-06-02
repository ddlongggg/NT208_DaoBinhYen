export type OnboardingStep = 'survey' | 'daily' | 'done';

export function getOnboardingStep(userData: any): OnboardingStep {
  const hasUsername = !!userData?.username;
  const hasSurvey = userData?.lastSurveyScore !== null
    && userData?.lastSurveyScore !== undefined
    && !!userData?.lastSurveyType;

  if (!hasUsername || !hasSurvey) return 'survey';
  return 'daily';
}

export const ONBOARDING_COOKIE = 'onboarding_step';

export const ONBOARDING_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
