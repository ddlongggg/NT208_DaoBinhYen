type DefaultUserParams = {
  uid: string;
  email?: string | null;
  provider: string;
  createdAt?: string;
  lastLogin?: string | null;
};

export const createDefaultUserData = ({
  uid,
  email = null,
  provider,
  createdAt = new Date().toISOString(),
  lastLogin = null,
}: DefaultUserParams) => ({
  uid,
  email,
  provider,
  createdAt,
  lastLogin,
  username: null,
  lastSurveyScore: null,
  lastSurveyType: null,
  avatar: null,
  topicStreak: 0,
  lastCheckinDate: null,
  updatedAt: null,
  seeds: 0,
  money: 0,
  fish: 0,
  leaves: 0,
  essence_lam: 0,
  essence_tim: 0,
  essence_vang: 0,
  essence_cam: 0,
  ownedPets: [],
  survey_study: null,
  survey_emotion: null,
  survey_sleep: null,
});
