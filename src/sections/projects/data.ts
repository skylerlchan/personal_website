export type Project = {
  slug: string;
  title: string;
  blurb: string;
  image?: string;
  tags: string[];
  year: string;
  repo?: string;
  paper?: string;
  href?: string;
  accent?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "hoverloon",
    title: "Hoverloon",
    blurb:
      "Blimp-drone hybrid. Buoyant lift unlocked 19× payload capacity, enabling massive energy savings for extended flight.",
    image: "/images/projects/hoverloon/hoverloon.png",
    tags: ["Robotics", "Computer Vision", "ROS"],
    year: "2024-25",
    accent: "#2563eb",
  },
  {
    slug: "humanoid-robots",
    title: "Humanoid Teleop",
    blurb:
      "Building intuitive teleop for the SO-101 arm — bridging sim-to-real via smooth 'System 1' control interfaces.",
    image: "/images/projects/so1/so1-main.png",
    tags: ["Robotics", "C++", "ROS"],
    year: "2025",
    accent: "#dc2626",
  },
  {
    slug: "lastcurb",
    title: "LastCurb",
    blurb:
      "Edge AI parking detection from public NYC CCTV. Real-time urban sensing on commodity hardware.",
    image: "/images/projects/lastcurb.png",
    tags: ["Edge AI", "Computer Vision", "Python"],
    year: "2024",
    repo: "https://github.com/skylerlchan/LastCurb",
    accent: "#059669",
  },
  {
    slug: "btc-funding-carry",
    title: "BTC Funding Carry",
    blurb:
      "Delta-neutral long-spot/short-futures strategy harvesting perpetual funding rate carry with leverage.",
    image: "/images/projects/btc-funding-carry.png",
    tags: ["Quant", "Python", "Crypto"],
    year: "2023-24",
    repo: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage",
    paper: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305",
    accent: "#f97316",
  },
];
