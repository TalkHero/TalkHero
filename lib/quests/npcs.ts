export type NPCEmotion =
  | "happy"
  | "neutral"
  | "thinking"
  | "surprised"
  | "encouraging"
  | "celebrating";

export type NPCAccent =
  | "british"
  | "american"
  | "neutral";

export type NPCVoiceId =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer"
  | "verse"
  | "marin"
  | "cedar";

export type NPC = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  emotion: NPCEmotion;
  accent: NPCAccent;
  voiceId: NPCVoiceId | null;
  theme:
    | "violet"
    | "emerald"
    | "blue"
    | "amber"
    | "rose"
    | "slate";
};

export const NPCS: Record<string, NPC> = {
  // ========================================================
  // Global / legacy characters
  // ========================================================

  emma: {
    id: "emma",
    name: "Емма",
    role: "Ваш наставник",
    avatar: "/images/emma/emma-hero.png",
    emotion: "encouraging",
    accent: "british",
    voiceId: "marin",
    theme: "violet",
  },

  mia: {
    id: "mia",
    name: "Mia",
    role: "Barista",
    avatar: "☕",
    emotion: "happy",
    accent: "british",
    voiceId: "nova",
    theme: "emerald",
  },

  // ========================================================
  // London First Day
  // ========================================================

  james: {
    id: "james",
    name: "James",
    role: "Місцевий житель",
    avatar: "/images/characters/james/james.png",
    emotion: "happy",
    accent: "british",
    voiceId: "cedar",
    theme: "blue",
  },

  sophie: {
    id: "sophie",
    name: "Sophie",
    role: "Бариста",
    avatar: "/images/characters/sophie/sophie.png",
    emotion: "happy",
    accent: "british",
    voiceId: "coral",
    theme: "rose",
  },

  daniel: {
    id: "daniel",
    name: "Daniel",
    role: "Менеджер готелю",
    avatar: "/images/characters/daniel/daniel.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "onyx",
    theme: "slate",
  },

  // ========================================================
  // London Life
  // ========================================================

  "london-life-renting-a-flat-rebecca": {
    id: "london-life-renting-a-flat-rebecca",
    name: "Rebecca",
    role: "Estate Agent",
    avatar:
      "/images/characters/london-life/rebecca-estate-agent.png",
    emotion: "happy",
    accent: "british",
    voiceId: "shimmer",
    theme: "emerald",
  },

  "london-life-meeting-a-neighbor-daniel": {
    id: "london-life-meeting-a-neighbor-daniel",
    name: "Daniel",
    role: "Neighbor",
    avatar:
      "/images/characters/london-life/daniel-neighbor.png",
    emotion: "happy",
    accent: "british",
    voiceId: "onyx",
    theme: "blue",
  },

  "london-life-grocery-shopping-alex": {
    id: "london-life-grocery-shopping-alex",
    name: "Alex",
    role: "Shop Assistant",
    avatar:
      "/images/characters/london-life/alex-shop-assistant.png",
    emotion: "happy",
    accent: "british",
    voiceId: "ash",
    theme: "emerald",
  },

  "london-life-grocery-shopping-maya": {
    id: "london-life-grocery-shopping-maya",
    name: "Maya",
    role: "Cashier",
    avatar:
      "/images/characters/london-life/maya-cashier.png",
    emotion: "happy",
    accent: "british",
    voiceId: "nova",
    theme: "emerald",
  },

  "london-life-getting-a-mobile-plan-nina": {
    id: "london-life-getting-a-mobile-plan-nina",
    name: "Nina",
    role: "Mobile Adviser",
    avatar:
      "/images/characters/london-life/nina-mobile-adviser.png",
    emotion: "happy",
    accent: "british",
    voiceId: "coral",
    theme: "blue",
  },

  "london-life-at-the-pharmacy-olivia": {
    id: "london-life-at-the-pharmacy-olivia",
    name: "Olivia",
    role: "Pharmacist",
    avatar:
      "/images/characters/london-life/olivia-pharmacist-v2.png",
    emotion: "happy",
    accent: "british",
    voiceId: "shimmer",
    theme: "rose",
  },

  "london-life-booking-a-gp-appointment-sarah": {
    id: "london-life-booking-a-gp-appointment-sarah",
    name: "Sarah",
    role: "Receptionist",
    avatar:
      "/images/characters/london-life/sarah-receptionist.png",
    emotion: "happy",
    accent: "british",
    voiceId: "sage",
    theme: "blue",
  },

  "london-life-post-office-henry": {
    id: "london-life-post-office-henry",
    name: "Henry",
    role: "Postal Clerk",
    avatar:
      "/images/characters/london-life/henry-postal-clerk.png",
    emotion: "happy",
    accent: "british",
    voiceId: "echo",
    theme: "blue",
  },

  "london-life-opening-a-bank-account-ethan": {
    id: "london-life-opening-a-bank-account-ethan",
    name: "Ethan",
    role: "Bank Adviser",
    avatar:
      "/images/characters/london-life/ethan-bank-adviser.png",
    emotion: "happy",
    accent: "british",
    voiceId: "echo",
    theme: "blue",
  },

  "london-life-setting-up-utilities-grace": {
    id: "london-life-setting-up-utilities-grace",
    name: "Grace",
    role: "Customer Service Adviser",
    avatar:
      "/images/characters/london-life/grace-utilities-adviser.png",
    emotion: "happy",
    accent: "british",
    voiceId: "ballad",
    theme: "blue",
  },

  "london-life-reporting-a-problem-daniel": {
    id: "london-life-reporting-a-problem-daniel",
    name: "Daniel",
    role: "Landlord",
    avatar:
      "/images/characters/daniel/daniel.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "onyx",
    theme: "slate",
  },

  "london-life-at-the-launderette-chloe": {
    id: "london-life-at-the-launderette-chloe",
    name: "Chloe",
    role: "Launderette Assistant",
    avatar:
      "/images/characters/london-life/chloe-launderette-assistant.png",
    emotion: "happy",
    accent: "british",
    voiceId: "fable",
    theme: "blue",
  },

  "london-life-buying-a-travelcard-marcus": {
    id: "london-life-buying-a-travelcard-marcus",
    name: "Marcus",
    role: "Station Assistant",
    avatar:
      "/images/characters/london-life/marcus-station-assistant.png",
    emotion: "happy",
    accent: "british",
    voiceId: "cedar",
    theme: "blue",
  },

  // ========================================================
  // London Independence — B1
  // ========================================================

  "london-independence-job-interview-victoria": {
    id: "london-independence-job-interview-victoria",
    name: "Victoria",
    role: "Hiring Manager",
    avatar:
      "/images/characters/london-independence/victoria-hiring-manager.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "shimmer",
    theme: "slate",
  },

    "london-independence-first-day-at-work-nathan": {
    id: "london-independence-first-day-at-work-nathan",
    name: "Nathan",
    role: "Team Lead",
    avatar:
      "/images/characters/london-independence/nathan-team-lead.png",
    emotion: "happy",
    accent: "british",
    voiceId: "cedar",
    theme: "blue",
  },

    "london-independence-customer-support-harriet": {
    id: "london-independence-customer-support-harriet",
    name: "Harriet",
    role: "Customer Support Agent",
    avatar:
      "/images/characters/london-independence/harriet-customer-support.png",
    emotion: "happy",
    accent: "british",
    voiceId: "coral",
    theme: "rose",
  },

    "london-independence-returning-purchase-priya": {
    id: "london-independence-returning-purchase-priya",
    name: "Priya",
    role: "Store Assistant",
    avatar:
      "/images/characters/london-independence/priya-store-assistant.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "sage",
    theme: "violet",
  },

    "london-independence-dinner-with-friends-leo": {
    id: "london-independence-dinner-with-friends-leo",
    name: "Leo",
    role: "Friend",
    avatar:
      "/images/characters/london-independence/leo-friend.png",
    emotion: "happy",
    accent: "british",
    voiceId: "ash",
    theme: "amber",
  },

    "london-independence-weekend-trip-megan": {
    id: "london-independence-weekend-trip-megan",
    name: "Megan",
    role: "Friend",
    avatar:
      "/images/characters/london-independence/megan-friend.png",
    emotion: "happy",
    accent: "british",
    voiceId: "marin",
    theme: "emerald",
  },

    "london-independence-hotel-problem-george": {
    id: "london-independence-hotel-problem-george",
    name: "George",
    role: "Hotel Receptionist",
    avatar:
      "/images/characters/london-independence/george-hotel-receptionist.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "echo",
    theme: "slate",
  },
  "london-independence-missing-train-aisha": {
    id: "london-independence-missing-train-aisha",
    name: "Aisha",
    role: "Station Supervisor",
    avatar:
      "/images/characters/london-independence/aisha-station-supervisor.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "nova",
    theme: "rose",
  },

    "london-independence-at-the-doctor-eleanor": {
    id: "london-independence-at-the-doctor-eleanor",
    name: "Dr. Eleanor Price",
    role: "GP",
    avatar:
      "/images/characters/london-independence/eleanor-gp.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "shimmer",
    theme: "emerald",
  },

    "london-independence-office-meeting-monica": {
    id: "london-independence-office-meeting-monica",
    name: "Monica",
    role: "Project Manager",
    avatar:
      "/images/characters/london-independence/monica-project-manager.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "coral",
    theme: "amber",
  },

    "london-independence-making-new-friends-callum": {
    id: "london-independence-making-new-friends-callum",
    name: "Callum",
    role: "Graphic Designer",
    avatar:
      "/images/characters/london-independence/callum-graphic-designer.png",
    emotion: "happy",
    accent: "british",
    voiceId: "ash",
    theme: "violet",
  },

    // ========================================================
  // London Professional — B2
  // ========================================================

  "london-professional-salary-negotiation-richard": {
    id: "london-professional-salary-negotiation-richard",
    name: "Richard",
    role: "Department Manager",
    avatar:
      "/images/characters/london-professional/richard-department-manager.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "cedar",
    theme: "slate",
  },

  "london-professional-presenting-an-idea-sophie": {
    id: "london-professional-presenting-an-idea-sophie",
    name: "Sophie",
    role: "Marketing Director",
    avatar:
      "/images/characters/london-professional/sophie-marketing-director.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "shimmer",
    theme: "violet",
  },

  "london-professional-handling-criticism-daniel": {
    id: "london-professional-handling-criticism-daniel",
    name: "Daniel",
    role: "Senior Project Lead",
    avatar:
      "/images/characters/london-professional/daniel-senior-project-lead.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "onyx",
    theme: "slate",
  },

  "london-professional-team-conflict-emily": {
    id: "london-professional-team-conflict-emily",
    name: "Emily",
    role: "HR Business Partner",
    avatar:
      "/images/characters/london-professional/emily-hr-business-partner.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "coral",
    theme: "rose",
  },

  "london-professional-client-meeting-arjun": {
    id: "london-professional-client-meeting-arjun",
    name: "Arjun",
    role: "Client Partner",
    avatar:
      "/images/characters/london-professional/arjun-client-partner.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "ash",
    theme: "blue",
  },

  "london-professional-deadline-problem-chloe": {
    id: "london-professional-deadline-problem-chloe",
    name: "Chloe",
    role: "Creative Lead",
    avatar:
      "/images/characters/london-professional/chloe-creative-lead.png",
    emotion: "thinking",
    accent: "british",
    voiceId: "fable",
    theme: "amber",
  },

  "london-professional-apartment-dispute-mark": {
    id: "london-professional-apartment-dispute-mark",
    name: "Mark",
    role: "Operations Manager",
    avatar:
      "/images/characters/london-professional/mark-operations-manager.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "echo",
    theme: "slate",
  },

  "london-professional-networking-event-isabella": {
    id: "london-professional-networking-event-isabella",
    name: "Isabella",
    role: "Finance Controller",
    avatar:
      "/images/characters/london-professional/isabella-finance-controller.png",
    emotion: "happy",
    accent: "british",
    voiceId: "nova",
    theme: "emerald",
  },

  "london-professional-giving-a-presentation-tom": {
    id: "london-professional-giving-a-presentation-tom",
    name: "Tom",
    role: "Junior Analyst",
    avatar:
      "/images/characters/london-professional/tom-junior-analyst.png",
    emotion: "encouraging",
    accent: "british",
    voiceId: "sage",
    theme: "blue",
  },

  "london-professional-debating-an-issue-maya": {
    id: "london-professional-debating-an-issue-maya",
    name: "Maya",
    role: "Product Manager",
    avatar:
      "/images/characters/london-professional/maya-product-manager.png",
    emotion: "thinking",
    accent: "british",
    voiceId: "marin",
    theme: "violet",
  },

  "london-professional-crisis-at-work-jonathan": {
    id: "london-professional-crisis-at-work-jonathan",
    name: "Jonathan",
    role: "Executive Director",
    avatar:
      "/images/characters/london-professional/jonathan-executive-director.png",
    emotion: "neutral",
    accent: "british",
    voiceId: "cedar",
    theme: "slate",
  },

  "london-professional-promotion-laura": {
    id: "london-professional-promotion-laura",
    name: "Laura",
    role: "Client Success Manager",
    avatar:
      "/images/characters/london-professional/laura-client-success-manager.png",
    emotion: "encouraging",
    accent: "british",
    voiceId: "shimmer",
    theme: "rose",
  },

};

export function getNPCById(
  id: string | null | undefined,
): NPC | null {
  if (!id) {
    return null;
  }

  return NPCS[id.trim().toLowerCase()] ?? null;
}

export function getNPC(
  id: string | null | undefined,
): NPC | null {
  return getNPCById(id);
}

export function getNPCBySpeaker(
  speaker: string | null | undefined,
): NPC | null {
  if (!speaker) {
    return null;
  }

  const normalized = speaker.trim().toLowerCase();

  return (
    Object.values(NPCS).find(
      (npc) =>
        npc.id === normalized ||
        npc.name.toLowerCase() === normalized,
    ) ?? null
  );
}
