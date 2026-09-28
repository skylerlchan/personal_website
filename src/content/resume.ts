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
    claim: "AI agents for hedge funds, and one enormous API bill",
    group: "work",
    when: "Feb to Sep 2026",
    org: "Multiplier, Y Combinator Spring 2026",
    tag: "Y Combinator",
    title: "Multiplier",
    line: "A Y Combinator startup, Spring 2026 batch. An AI harness for hedge-fund analysts, built as a VS Code fork with agents inside it. I owned it end to end for six firms and wrote the largest share of the codebase.",
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
    line: "A robot teleoperation lab I founded, funded and staffed. Arms that copy your hand in real time, a tendon-driven hand I modeled in MuJoCo against Robotiq, LEAP, Allegro and Shadow, and silent electric actuators: fibers that contract like muscles, so we can get off gearboxes. The bet is that personal robotics goes the way personal computing did, and robots become the physical API for the real world. Right now that means a delivery dog and the last fifty feet.",
    stat: { value: "50 Hz", note: "leader to follower" },
    links: [{ label: "exahuman.io", href: "https://exahuman.io" }],
  },
  {
    id: "betaflow",
    match: ["Beta Flow", "BetaFlow", "VS Code extension"],
    claim: "A web browser living in your editor",
    group: "projects",
    when: "Apr to Jun 2026",
    org: "VS Code Marketplace",
    title: "Beta Flow Browser",
    line: "A full web browser in the VS Code sidebar, open source. Spaces keep their own tabs and logins, vertical tabs down the side, and one click to sort a messy pile of tabs into something you can read.",
    stat: { value: "229", unit: "downloads", note: "on the VS Code Marketplace, 60 installs" },
    links: [{ label: "Marketplace", href: "https://marketplace.visualstudio.com/items?itemName=SkylerChan.beta-flow-browser" }],
  },
  {
    id: "carry",
    place: "Paragon Global Investments",
    role: "Quant developer",
    rail: "projects",
    match: ["BTC funding carry", "funding carry", "carry trade", "Sharpe", "Paragon"],
    claim: "A trade that pays you for waiting",
    group: "work",
    when: "Jan 2025 to May 2026",
    org: "Paragon Global Investments, quant developer",
    title: "BTC funding carry",
    line: "I built an exchange-agnostic backtesting engine, raced strategies on it, and shipped the winner: a delta-neutral BTC funding carry that pockets the eight-hour funding and hedges the price away. Sharpe 6.1 over three years of tick data. The paper and the code are both public, so you can check my work.",
    stat: { value: "16.0%", note: "annualized, drawdown under 2%" },
    links: [
      { label: "Paper, SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305" },
      { label: "Code", href: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage" },
    ],
  },
  {
    id: "hoverloon",
    match: ["Hoverloon", "blimp"],
    claim: "A balloon that lifts 19x what the drone can",
    group: "projects",
    when: "Jul 2025 to Jan 2026",
    org: "Princeton Robotics Club, founder and project lead",
    title: "Hoverloon",
    line: "A blimp-drone hybrid for aerial logistics. I founded it, won $5,000 in funding and led eight people across design, hardware and software. Buoyant lift carried nineteen times the drone's own payload at roughly the same power draw. It flew indoors in December.",
    stat: { value: "19x", unit: "payload", note: "from buoyant lift, same power draw" },
  },
  {
    id: "retrieval",
    match: ["Retrieval benchmark", "retrieval architectures", "retrievers"],
    claim: "Seven retrievers, and none of them won",
    group: "projects",
    when: "Jul 2026",
    title: "Retrieval benchmark",
    line: "I benchmarked seven retrieval architectures on a hand-labeled corpus before we committed to one in production. No single retriever won across query types. Hybrid was only ever the one that was never worst, which is a less satisfying answer than I was hoping for.",
    stat: { value: "7", unit: "retrievers", note: "compared on Recall@k, MRR and nDCG" },
  },
  {
    id: "kalshi",
    match: ["Kalshi"],
    claim: "Small bets, every fifteen minutes",
    group: "projects",
    when: "2026 to now",
    title: "Kalshi trading bot",
    line: "A systematic bot on Kalshi's fifteen-minute Bitcoin contracts. It takes the favored side in small size near resolution, and it has now done that 2,422 times since July. It is not going to make me rich. It is a very good excuse to think hard about edge.",
    stat: { value: "2,422", unit: "trades", note: "live since Jul 2026" },
  },
  {
    id: "lastcurb",
    match: ["LastCurb", "Last Curb", "parking"],
    claim: "I gave myself eyes in the sky",
    group: "projects",
    when: "Jun to Aug 2025",
    title: "LastCurb",
    line: "New York City parking is a terrible mess. Traffic plus no space equals pandemonium, and garages wanted $30 an hour. Then I noticed the traffic cameras. They stream live to a city database, so I reverse-engineered the endpoints, pulled over 100 feeds every two seconds, and ran computer vision for a week watching cars pull in and out. Now it takes me five minutes to park in Manhattan.",
    links: [{ label: "Code", href: "https://github.com/skylerlchan/LastCurb" }],
  },
  {
    id: "hmei",
    place: "Princeton HMEI",
    role: "Climate modelling research intern",
    match: ["Solar geoengineering", "geoengineering", "black carbon", "HMEI", "climate model"],
    claim: "Soot cools the planet better than sulfur",
    group: "work",
    when: "Jun to Aug 2025",
    org: "Princeton HMEI, Vecchi Research Group, climate modeling research intern",
    title: "Solar geoengineering, modeled",
    line: "I modeled what solar geoengineering does to rainfall across fifteen climate models. The surprise was that stratospheric black carbon, which is basically soot, cools about ten times more effectively than the sulfates everyone proposes. Not a recommendation. Just what the models said.",
    stat: { value: "10x", unit: "cooling", note: "black carbon over sulfate aerosols" },
  },
  {
    id: "piano",
    claim: "Ravel, Liszt, Bach and one Hiromi",
    group: "hobbies",
    when: "Since childhood",
    org: "Princeton Piano Ensemble",
    title: "Classical piano",
    line: "Eight recordings up. The Bach B minor prelude and fugue is the one I keep going back to.",
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
    line: "On the club squash team.",
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
