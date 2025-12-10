export interface ApplicantData {
  school: string;
  is19Plus: boolean;
  instagramHandle: string;
  personalityTraits: string[];
  interests: string[];
  householdSize: number;
  sceneTypes: string[];
  sceneCustom: string;
  contentUploaded: boolean;
  ambassadorType: string;
  waitlistPosition: number;
  referralCode: string;
  points: number;
  email?: string;
}

export const ONTARIO_UNIVERSITIES = [
  "University of Toronto",
  "York University",
  "Toronto Metropolitan University",
  "Western University",
  "McMaster University",
  "University of Waterloo",
  "Wilfrid Laurier University",
  "University of Ottawa",
  "Queen's University",
  "University of Guelph",
];

export const PERSONALITY_TRAITS = [
  "Outgoing",
  "Creative",
  "Chill",
  "Hustler",
  "Trendsetter",
  "Connector",
  "Leader",
  "Wild Card",
];

export const INTERESTS = [
  "Sports",
  "Gaming",
  "Music",
  "Fashion",
  "Fitness",
  "Food & Drink",
  "Tech",
  "Nightlife",
  "Content Creation",
];

export const SCENE_TYPES = [
  "Campus bars",
  "House parties",
  "Club venues",
  "Campus events",
  "Sporting events",
  "Coffee shops",
  "Gyms",
  "Gaming lounges",
];

export const AMBASSADOR_TYPES = [
  { name: "The Connector", description: "You know everyone and everyone knows you. Perfect for word-of-mouth campaigns." },
  { name: "The Content King", description: "Your feed is fire. Brands need your creative eye for scroll-stopping content." },
  { name: "The Party Starter", description: "Where you go, the party follows. Ideal for event activations and nightlife campaigns." },
  { name: "The Hype Machine", description: "You bring the energy. Your enthusiasm is contagious and brands love that." },
  { name: "The Trendsetter", description: "You're always ahead of the curve. Brands want your stamp of approval." },
  { name: "The Insider", description: "You've got the inside scoop. Perfect for exclusive launches and VIP experiences." },
];

export const generateReferralCode = (): string => {
  return `SAUCE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const getRandomWaitlistPosition = (): number => {
  return Math.floor(Math.random() * 100) + 20;
};

export const getRandomAmbassadorType = (): typeof AMBASSADOR_TYPES[0] => {
  return AMBASSADOR_TYPES[Math.floor(Math.random() * AMBASSADOR_TYPES.length)];
};