export interface Project {
  slug: string;
  title: string;
  description: string;
  techStack: string[];
  color: string;
  image: string;
  image3D?: string;
  visual3D?: boolean;
  category: "work" | "project";
  repo?: string;
  paper?: string;
  presentation?: string;
  startDate?: string;
  endDate?: string;
  status?: "active" | "completed" | "ongoing" | "prototype";
  role?: string;
}

export interface FoodPlacesPhoto {
  src: string;
  alt: string;
  orientation: "portrait" | "landscape";
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "github" | "linkedin" | "instagram" | "x" | "email";
  handle: string;
}

export const PROJECTS: Project[] = [
  // ── Work ──
  {
    slug: "withai-research",
    title: "WithAI Research",
    description:
      "YC W26 startup building LLMs for AI-native hedge funds. Founding engineer developing the core platform and infrastructure.",
    techStack: ["LLMs", "Next.js", "Python"],
    color: "#7c3aed",
    image: "/withai-logo.svg",
    category: "work",
    startDate: "2026-01",
    status: "active",
    role: "Founding Engineer",
  },
  {
    slug: "hmei-princeton",
    title: "HMEI Research",
    description:
      "Princeton HMEI research on solar radiation management. Found stratospheric black carbon aerosols are 10x more effective at cooling than reflective sulfate.",
    techStack: ["Python", "Climate Modeling", "Data Science"],
    color: "#f59e0b",
    image: "/images/projects/hmei/hmei.png",
    category: "work",
    presentation: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit?usp=sharing&ouid=108230747896924390036&rtpof=true&sd=true",
    startDate: "2024",
    endDate: "2025",
    status: "completed",
    role: "Research Assistant",
  },
  // ── Projects ──
  {
    slug: "hoverloon",
    title: "Hoverloon",
    description:
      "Blimp-drone hybrid founded under Princeton Robotics Club. Buoyant lift achieved 19x payload capacity of the drone alone, enabling massive energy savings for extended flight.",
    techStack: ["Computer Vision", "ROS", "CAD", "Embedded Systems"],
    color: "#2563eb",
    image: "/images/projects/hoverloon/hoverloon.png",
    category: "project",
    startDate: "2024",
    endDate: "2025",
    status: "prototype",
    role: "Co-founder & Technical Lead",
  },
  {
    slug: "humanoid-robots",
    title: "Building Humanoid Robots",
    description:
      "Experimenting with the SO-101 arm to develop smooth 'System 1 thinking' teleoperation for training and autonomy. Bridging sim-to-real through intuitive control interfaces that enable natural robot learning.",
    techStack: ["C++", "ROS", "CAD", "Teleoperation", "Robotics"],
    color: "#dc2626",
    image: "/images/projects/so1/so1-main.png",
    visual3D: false,
    category: "project",
    startDate: "2025",
    status: "active",
    role: "Independent Developer",
  },
  {
    slug: "lastcurb",
    title: "LastCurb",
    description:
      "Analyzes curb data from public NYC CCTV cameras to help find available parking spots. Built to test edge AI and machine learning for real-time urban sensing.",
    techStack: ["Edge AI", "Machine Learning", "Computer Vision", "Python"],
    color: "#059669",
    image: "/images/projects/lastcurb.png",
    category: "project",
    repo: "https://github.com/skylerlchan/LastCurb",
    startDate: "2024",
    endDate: "2024",
    status: "completed",
    role: "Creator",
  },
  {
    slug: "btc-funding-carry",
    title: "Leveraged BTC Funding Carry",
    description:
      "Delta-neutral long-spot/short-futures strategy that harvests perpetual funding rate carry with leverage while hedging away directional market risk.",
    techStack: ["Python", "Quantitative Finance", "Crypto"],
    color: "#f97316",
    image: "/images/projects/btc-funding-carry.png",
    category: "project",
    repo: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage",
    paper: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305",
    startDate: "2023",
    endDate: "2024",
    status: "completed",
    role: "Researcher & Developer",
  },
];

export const FOOD_PLACES_PHOTOS: FoodPlacesPhoto[] = [
  { src: "/images/food-places/IMG_1478.jpg", alt: "Gringotts dragon at Universal Studios", orientation: "portrait" },
  { src: "/images/food-places/IMG_20240814_104404.jpg", alt: "Avocado toast with fried egg", orientation: "landscape" },
  { src: "/images/food-places/IMG_3281.jpg", alt: "Japanese sake bar", orientation: "portrait" },
  { src: "/images/food-places/IMG_20241016_135106.jpg", alt: "Moulin Rouge musical", orientation: "landscape" },
  { src: "/images/food-places/IMG_3589.jpg", alt: "Bustling food hall", orientation: "portrait" },
  { src: "/images/food-places/IMG_20240814_104406.jpg", alt: "Strawberry pancakes", orientation: "landscape" },
  { src: "/images/food-places/IMG_4169.jpg", alt: "Toronto at night", orientation: "portrait" },
  { src: "/images/food-places/IMG_20240822_122617.jpg", alt: "Upscale restaurant interior", orientation: "landscape" },
  { src: "/images/food-places/IMG_20241013_200718.jpg", alt: "Cucumber and fish slices", orientation: "landscape" },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/skylerlchan", icon: "github", handle: "@skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan", icon: "linkedin", handle: "Skyler Chan" },
  { label: "X", href: "https://x.com/SkylerChan17", icon: "x", handle: "@SkylerChan17" },
  { label: "Instagram", href: "https://www.instagram.com/_.skyler.chan._/", icon: "instagram", handle: "@_.skyler.chan._" },
  { label: "Email", href: "mailto:skylerlchan@gmail.com", icon: "email", handle: "skylerlchan@gmail.com" },
];

export interface PianoVideo {
  id: string;
  title: string;
  composer: string;
  youtubeId: string;
}

export const PIANO_VIDEOS: PianoVideo[] = [
  { id: "piano-01", title: "The Gambler", composer: "Hiromi", youtubeId: "bbVHVRnYNCc" },
  { id: "piano-02", title: "Harry Potter Medley", composer: "John Williams", youtubeId: "YyEYwovCLXQ" },
  { id: "piano-03", title: "La Valse", composer: "Ravel", youtubeId: "yFAoNvYfLFc" },
  { id: "piano-04", title: "En blanc et noir, I", composer: "Debussy", youtubeId: "hLuJJEzfAmU" },
  { id: "piano-05", title: "Souvenirs, Hesitation-Tango & Galop", composer: "Barber", youtubeId: "spG0MDRDHnY" },
  { id: "piano-06", title: "Prelude & Fugue No. 24 in B minor", composer: "Bach", youtubeId: "o0TaftOh0RE" },
  { id: "piano-07", title: "Piano Sonata Op. 10 No. 2, II", composer: "Beethoven", youtubeId: "zGDqk6S47Nw" },
  { id: "piano-08", title: "Waldesrauschen", composer: "Liszt", youtubeId: "CdODEdTNAa0" },
];

export const SECTIONS = [
  { id: "hero", label: "Intro" },
  { id: "work", label: "Work", children: [
    { id: "withai-research", label: "WithAI" },
    { id: "hmei-princeton", label: "HMEI" },
  ]},
  { id: "project", label: "Project", children: [
    { id: "hoverloon", label: "Hoverloon" },
    { id: "humanoid-robots", label: "Humanoid" },
    { id: "lastcurb", label: "LastCurb" },
    { id: "btc-funding-carry", label: "BTC Carry" },
  ]},
  { id: "hobbies", label: "Hobbies", children: [
    { id: "piano", label: "Piano" },
    { id: "travel", label: "Travel" },
  ]},
  { id: "contact", label: "Connect", children: [
    { id: "assistant", label: "DM Me" },
    { id: "socials", label: "Socials" },
  ]},
] as const;

export const SITE_CONFIG = {
  name: "Skyler Chan",
  title: "",
  description: "Always building. Always thinking.",
  longDescription: "Founding engineer at WithAI Research (YC W26), building LLM infrastructure for AI-native hedge funds. Princeton student focused on robotics, AI, and climate tech. Building systems that matter.",
  url: "https://skyler-chan.com",
  author: {
    name: "Skyler Chan",
    email: "skylerlchan@gmail.com",
    title: "Founding Engineer",
    organization: "WithAI Research",
    location: "Princeton, NJ",
    education: "Princeton University",
  },
  keywords: [
    "Skyler Chan",
    "AI Engineer",
    "Machine Learning",
    "Large Language Models",
    "LLMs",
    "Robotics",
    "Computer Vision",
    "Climate Science",
    "Quantitative Finance",
    "WithAI Research",
    "Y Combinator",
    "Princeton",
    "Software Engineer",
    "Full Stack Developer",
    "Next.js",
    "React",
    "TypeScript",
    "Python",
    "Edge AI",
    "Autonomous Systems",
  ],
};
