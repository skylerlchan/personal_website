import { SITE_CONFIG } from "@/lib/constants";

/**
 * The facts, in one place.
 *
 * Every claim here is checked against Skyler_Chan_MASTER.docx, his master
 * resume, and the countable ones are checked against the source: the
 * Marketplace gallery API for Beta Flow, his own repo for the Kalshi trades.
 *
 * Standing exclusions, never on a public page: the seed round and the
 * valuation (real, publicly reported, and not his accomplishment), client
 * AUM, and "written in high school", which he asked to drop.
 */

export type Group = "work" | "projects" | "hobbies" | "contact";

export type Entry = {
  id: string;
  group: Group;
  when: string;
  /** The outcome, stated first. The headline a buyer scans. */
  claim: string;
  /**
   * Other ways an answer might name this thing. The chat cites by finding
   * these in the text it just wrote, so the aliases live here, next to the
   * facts, and not in the component. A second list somewhere else is how the
   * two drift apart.
   */
  match?: string[];
  org?: string;
  /**
   * For the record table on the front page: the employer and the job. Having
   * a role is what puts a row in that table, independent of which rail the
   * card sits in.
   */
  place?: string;
  role?: string;
  /**
   * Which rail the card belongs to. Defaults to the group. The BTC carry was
   * a real job at Paragon, so it keeps its row in the record, but the work
   * itself reads as his own project and sits with the others.
   */
  rail?: "work" | "projects";
  /**
   * A credential that belongs next to the name, not buried in `org`: the
   * card's eyebrow renders it between the title and the stat. Y Combinator
   * is the reason this exists; the card was not saying it anywhere.
   */
  tag?: string;
  title: string;
  line: string;
  stat?: { value: string; unit?: string; note: string };
  links?: { label: string; href: string }[];
};

export const GROUPS: { id: Group; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "hobbies", label: "Hobbies" },
  { id: "contact", label: "Contact" },
];

export const ENTRIES: Entry[] = [
  {
    id: "multiplier",
    place: "Multiplier",
    role: "Founding software engineer",
    match: ["Multiplier", "YC startup", "Y Combinator"],
    claim: "AI harnesses for hedge-fund analysts",
    group: "work",
    when: "Feb to Sep 2026",
    org: "Multiplier, Y Combinator Spring 2026",
    tag: "Y Combinator",
    title: "Multiplier",
    line: "A VS Code fork with embedded AI agents, sold to hedge funds; Y Combinator Spring 2026. Owned the product end to end for six enterprise clients and grew it into the company's first paid product at $208K ARR. Joined as one of 5 engineers and wrote about 30% of the in-house codebase, the largest share on the team: the AI chat client, charting, the markdown editor, and the automations backend.",
    stat: { value: "$208K", unit: "ARR", note: "from zero, six enterprise clients" },
  },
  {
    id: "exahuman",
    match: ["Exahuman", "teleoperation", "teleop"],
    claim: "Robots you install skills on, like apps",
    group: "projects",
    when: "Aug 2026 to now",
    org: "Princeton Robotics Club, founder and tech lead",
    title: "Exahuman",
    line: "A robot teleoperation lab. Founded the lab, secured $4,500 in funding, and recruited a 5-person research team. I'm working on silent electric actuators, fibers that contract like muscles; this gets us off gearboxes and lets us imitate muscles more accurately. Right now we're focused on a robotic dog that can do delivery, to solve the last 50-foot problem, and on making teleoperation as seamless as possible. Ultimately, we're building humanoids.",
    stat: { value: "50 Hz", note: "leader to follower" },
    links: [{ label: "exahuman.io", href: "https://exahuman.io" }],
  },
  {
    id: "betaflow",
    match: ["Beta Flow", "BetaFlow", "VS Code extension"],
    claim: "A full web browser in the editor sidebar",
    group: "projects",
    when: "Apr to Jun 2026",
    org: "VS Code Marketplace",
    title: "Beta Flow Browser",
    line: "Published an open-source (MIT) VS Code extension that puts a full web browser in the editor sidebar: spaces, vertical tabs, favorites and drag-to-bookmark, multi-engine search, per-profile cookie isolation, and one-click Auto Tidy.",
    stat: { value: "229", unit: "downloads", note: "on the VS Code Marketplace, 60 installs" },
    links: [{ label: "Marketplace", href: "https://marketplace.visualstudio.com/items?itemName=SkylerChan.beta-flow-browser" }],
  },
  {
    id: "carry",
    place: "Paragon Global Investments",
    role: "Quant developer",
    rail: "projects",
    match: ["BTC funding carry", "funding carry", "carry trade", "Sharpe", "Paragon"],
    claim: "A delta-neutral BTC funding-carry strategy",
    group: "work",
    when: "Jan 2025 to May 2026",
    org: "Paragon Global Investments, quant developer",
    title: "BTC funding carry",
    line: "Engineered a high-frequency, exchange-agnostic backtesting engine across spot and perpetual futures, so adding a market was a plug-in, not a rewrite. Ran head-to-head strategy evaluations on it and shipped the winner: a 3x-leveraged, delta-neutral long-spot/short-perpetual BTC funding-carry strategy. Published as a sole-author SSRN paper: 16.0% annualized return, Sharpe 6.1, max drawdown under 2% over three years of tick-level data; 516 downloads.",
    stat: { value: "16.0%", note: "annualized, drawdown under 2%" },
    links: [
      { label: "Paper, SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305" },
      { label: "Code", href: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage" },
    ],
  },
  {
    id: "hoverloon",
    match: ["Hoverloon", "blimp"],
    claim: "Buoyant lift achieved 19x the drone's own payload",
    group: "projects",
    when: "Jul 2025 to Jan 2026",
    org: "Princeton Robotics Club, founder and project lead",
    title: "Hoverloon",
    line: "Aerial logistics with a blimp-drone hybrid. Founded the project, won $5,000 in club funding, and recruited and led an 8-person cross-disciplinary team across design, hardware and software. Developed prototypes and test aircraft; buoyant lift achieved 19x the drone's own payload capacity at roughly the same power draw, enabling extended flight. Indoor test flight in December 2025; the team pivoted to robot-arm teleoperation, now Exahuman, in February 2026.",
    stat: { value: "19x", unit: "payload", note: "from buoyant lift, same power draw" },
  },
  {
    id: "retrieval",
    match: ["Retrieval benchmark", "retrieval architectures", "retrievers"],
    claim: "7 retrieval architectures, benchmarked",
    group: "projects",
    when: "Jul 2026",
    title: "Retrieval benchmark",
    line: "Benchmarked 7 retrieval architectures against a synthetic corpus and a 21-document hand-labeled corpus on Recall@k, MRR and nDCG, and wrote it up as a paper to drive a production retrieval decision.",
    stat: { value: "7", unit: "retrievers", note: "compared on Recall@k, MRR and nDCG" },
  },
  {
    id: "kalshi",
    match: ["Kalshi"],
    claim: "A small systematic bot on Kalshi's 15-minute BTC contracts",
    group: "projects",
    when: "2026 to now",
    title: "Kalshi trading bot",
    line: "Built and run a small systematic bot on Kalshi's 15-minute BTC up/down event contracts, buying the favored side in small size near resolution. 2,422 live trades since July 2026.",
    stat: { value: "2,422", unit: "trades", note: "live since Jul 2026" },
  },
  {
    id: "lastcurb",
    match: ["LastCurb", "Last Curb", "parking"],
    claim: "I've got eyes in the sky",
    group: "projects",
    when: "Jun to Aug 2025",
    title: "LastCurb",
    line: "New York City parking is a terrible mess. Crazy traffic + lack of parking space = pandemonium. Then I noticed that there were traffic cameras, streaming in real time to a database on the NYC government website. I reverse-engineered their endpoints and was able to pull from over 100 camera feeds every 2 seconds, then ran computer vision for a whole week and tracked cars pulling in and out. Now whenever I go to Manhattan, it takes me 5 minutes to get parking because I've got eyes in the sky.",
    links: [{ label: "Code", href: "https://github.com/skylerlchan/LastCurb" }],
  },
  {
    id: "hmei",
    place: "Princeton HMEI",
    role: "Climate modeling research intern",
    match: ["Solar geoengineering", "geoengineering", "black carbon", "HMEI", "climate model"],
    claim: "Black carbon cools 10x more effectively than sulfate",
    group: "work",
    when: "Jun to Aug 2025",
    org: "Princeton HMEI, Vecchi Research Group, climate modeling research intern",
    title: "Solar geoengineering research",
    line: "Quantified precipitation sensitivity to solar radiation management via vertical moisture-flux modeling, across 15 CMIP6 climate models. Found stratospheric black carbon aerosols cool roughly 10x more effectively than reflective sulfate aerosols, and presented the results to the Vecchi Research Group. Built Python pipelines (NumPy, xarray, pandas) to process large 3D climate-model outputs and generate the spatial maps used in the analysis.",
    stat: { value: "10x", unit: "cooling", note: "black carbon over sulfate aerosols" },
  },
  {
    id: "piano",
    claim: "Classical pianist, Princeton Piano Ensemble",
    group: "hobbies",
    when: "Since childhood",
    org: "Princeton Piano Ensemble",
    title: "Classical piano",
    line: "Repertoire includes Ravel La Valse, Liszt Waldesrauschen, Bach Prelude and Fugue No. 24 in B minor, Debussy En blanc et noir I, Barber Souvenirs, Beethoven Sonata Op. 10 No. 2 II, Hiromi The Gambler, and the John Williams Harry Potter Medley. Eight recordings online.",
    links: [
      { label: "Hiromi", href: "https://www.youtube.com/watch?v=bbVHVRnYNCc" },
      { label: "John Williams", href: "https://www.youtube.com/watch?v=YyEYwovCLXQ" },
      { label: "Ravel", href: "https://www.youtube.com/watch?v=yFAoNvYfLFc" },
      { label: "Debussy", href: "https://www.youtube.com/watch?v=hLuJJEzfAmU" },
      { label: "Barber", href: "https://www.youtube.com/watch?v=spG0MDRDHnY" },
      { label: "Bach", href: "https://www.youtube.com/watch?v=o0TaftOh0RE" },
      { label: "Beethoven", href: "https://www.youtube.com/watch?v=zGDqk6S47Nw" },
      { label: "Liszt", href: "https://www.youtube.com/watch?v=CdODEdTNAa0" },
    ],
  },
  {
    id: "squash",
    match: ["Squash"],
    claim: "Club squash at Princeton",
    group: "hobbies",
    when: "Princeton",
    title: "Squash",
    line: "Club Squash, Princeton.",
  },
];

/**
 * The spec sheet. Six numbers, each traceable to the resume: the audit that
 * produced them refuted anything it could not quote a source for.
 *
 * Two things are deliberately absent. "The first written in high school" was
 * cut from the papers line because he asked for that detail gone. The seed
 * round, the valuation and client AUM are not here and never go on a public
 * page.
 */
export const ELSEWHERE = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

/**
 * Questions and answers.
 *
 * These are his own words, from his TreeHacks 2027 application. They are the
 * best writing he has about himself, so they are quoted rather than
 * paraphrased. The first is reordered and has its TreeHacks references
 * removed; the rest are verbatim.
 */
export const QA: { q: string; a: string[] }[] = [
  {
    q: "Why do you build?",
    a: [
      "The energy I feel from people who are building makes me want to get out of my seat and join them. It is incredibly addictive when I get immersed in a sticky problem and let my mind explore novel solutions.",
      "I want to be shoulder to shoulder with the best builders. I cannot wait to find the risk-takers who are trying to change the status quo. I love showing people what I build, and I am eager to share my tips, tricks, setups and CLAUDE.md. I am eager to learn from theirs too.",
    ],
  },
  {
    q: "What do you want to work on in the next ten years?",
    a: [
      "Just like how computing was initially confined to institutions and gradually transformed into the personal computer, I feel like personal robotics will go through the same transition very soon. I envision a future with general-purpose robots that you can install skills on, like apps, to do real-world tasks. I see human-robot interaction becoming a field where robots, working alongside humans, become the physical API for the real world. That is why I am working on a robotic dog that can do delivery, to solve the last 50-foot problem. Ultimately we are building humanoids, but right now we are focused on the dog and on making teleoperation as seamless as possible.",
      "Extending the personal computer analogy, in our lifetime the iPhone moment for robotics will come next, and hopefully we will have solved the AI alignment problem by then.",
    ],
  },
  {
    q: "Tell me about a day you enjoyed.",
    a: [
      "My friends and I at Multiplier, our YC startup, had a challenge of making our agents work continuously for as long as we could. The only rule was that they had to be on real products. We could not just loop an agent or build slop.",
      "At first I thought we were only going to create slop. But by punching out so many prompts, we began to see things that stuck, and sometimes they were better than the original design. By complete accident we also created an internal tool that let us monitor agents in parallel.",
      "At the end of this experiment we saw our API bill, and you can probably guess what our reaction was. I came in second, but for the record, my agents lasted 56 hours.",
    ],
  },
  {
    q: "Describe yourself in two words.",
    a: ["Compulsive Optimizer."],
  },
  {
    q: "A fun fact?",
    a: [
      "I was born on April Fools' Day. I am a literal joke.",
      "But in all honesty, I love humor because it makes life better for me and more fun for those around me.",
    ],
  },
];
