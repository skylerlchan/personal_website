import type { ReactNode } from "react";

/**
 * The picture on a card.
 *
 * A drawing of the actual thing, one per card, rather than a symbol in a
 * badge. The badge was the first pass and it said too little: eleven cards
 * each got a small generic mark floating in a wash, which told you the
 * category and nothing else. The arm, the airship, the kerb and the keyboard
 * tell you what the thing is before you read a word.
 *
 * House rules, so eleven separately drawn scenes read as one set. Everything
 * is white and depth comes from opacity alone: 0.95 for the subject, 0.55 for
 * secondary parts, 0.3 for background. Strokes are 2.4 on the subject and 1.6
 * on detail. Fills are white at 0.14 to 0.26. The subject lives in the top
 * 72% of the box, because the bottom of the art dissolves into the card and
 * anything below y=82 disappears.
 *
 * No defs, gradients, filters, masks or clip paths. Those would either not
 * survive being inlined eleven times or would cost a paint on every frame of
 * a rail being flicked.
 */

const SCENES: Record<string, ReactNode> = {
  // The editor, with agents working in it.
  multiplier: (
    <>
      <rect x="20" y="11" width="120" height="65" rx="6" fill="#fff" fillOpacity="0.14" strokeOpacity="0.95" />
      <path d="M20 25 H140" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M45 25 V76" strokeWidth="1.6" strokeOpacity="0.55" />
      <circle cx="28.5" cy="18" r="1.9" fill="#fff" fillOpacity="0.55" stroke="none" />
      <circle cx="35.5" cy="18" r="1.9" fill="#fff" fillOpacity="0.55" stroke="none" />
      <path d="M28 36 H40 M31 46 H40 M31 56 H37" strokeWidth="2.4" strokeOpacity="0.55" />
      <path d="M53 36 H88" strokeOpacity="0.95" />
      <path d="M60 46 H126" strokeOpacity="0.95" />
      <path d="M60 56 H84" strokeOpacity="0.95" />
      <path d="M53 66 H104" strokeOpacity="0.95" />
      <path d="M101 30 C101.9 34.3 102.7 35.1 107 36 C102.7 36.9 101.9 37.7 101 42 C100.1 37.7 99.3 36.9 95 36 C99.3 35.1 100.1 34.3 101 30 Z" fill="#fff" fillOpacity="0.95" stroke="none" />
      <path d="M97 50 C97.9 54.3 98.7 55.1 103 56 C98.7 56.9 97.9 57.7 97 62 C96.1 57.7 95.3 56.9 91 56 C95.3 55.1 96.1 54.3 97 50 Z" fill="#fff" fillOpacity="0.95" stroke="none" />
      <path d="M117 60 C117.9 64.3 118.7 65.1 123 66 C118.7 66.9 117.9 67.7 117 72 C116.1 67.7 115.3 66.9 111 66 C115.3 65.1 116.1 64.3 117 60 Z" fill="#fff" fillOpacity="0.95" stroke="none" />
    </>
  ),

  // Sunlight into the aerosol layer, and some of it back out.
  hmei: (
    <>
      <path d="M0 90 Q80 52 160 90 L160 106 L0 106 Z" fill="#fff" fillOpacity="0.26" stroke="none" />
      <path d="M0 65 Q80 27 160 65 L160 77 Q80 39 0 77 Z" fill="#fff" fillOpacity="0.16" stroke="none" />
      <path d="M0 90 Q80 52 160 90" strokeOpacity="0.95" />
      <path d="M0 65 Q80 27 160 65" strokeOpacity="0.6" strokeWidth="1.6" />
      <path d="M0 77 Q80 39 160 77" strokeOpacity="0.3" strokeWidth="1.6" />
      <circle cx="22" cy="62" r="1.9" fill="#fff" fillOpacity="0.9" stroke="none" />
      <circle cx="42" cy="56.3" r="1.9" fill="#fff" fillOpacity="0.9" stroke="none" />
      <circle cx="62" cy="53" r="1.9" fill="#fff" fillOpacity="0.9" stroke="none" />
      <circle cx="98" cy="53" r="1.9" fill="#fff" fillOpacity="0.9" stroke="none" />
      <circle cx="118" cy="56.3" r="1.9" fill="#fff" fillOpacity="0.9" stroke="none" />
      <circle cx="138" cy="62" r="1.9" fill="#fff" fillOpacity="0.9" stroke="none" />
      <circle cx="80" cy="17" r="9" fill="#fff" fillOpacity="0.2" strokeOpacity="0.95" />
      <path d="M68 17 L64.5 17 M70.2 10.3 L67.3 8.2 M89.8 10.3 L92.7 8.2 M92 17 L95.5 17" strokeOpacity="0.8" strokeWidth="2" />
      <path d="M70.7 25.4 L43.4 50 M74.9 28.4 L66.9 46.5 M80 26 L80 46 M85.1 28.4 L93.1 46.5 M89.3 25.4 L116.6 50" strokeOpacity="0.95" />
      <path d="M28 54 L18 27 M17.6 31.5 L18 27 L21.2 30.2 M132 54 L142 27 M142.4 31.5 L142 27 L138.8 30.2" strokeOpacity="0.9" strokeWidth="2.2" />
      <path d="M80 58.5 L80 70" strokeOpacity="0.45" strokeWidth="1.6" />
    </>
  ),

  // The follower arm, with the leader ghosted behind it.
  exahuman: (
    <>
      <path d="M 10 74 H 150" strokeOpacity="0.3" strokeWidth="1.6" />
      <polyline points="47,59 64,27 110,48" strokeOpacity="0.3" />
      <polyline points="123.3,62.5 110.5,56.9 116.9,42.3 129.7,47.9" strokeOpacity="0.3" />
      <path d="M 22 74 L 29 60 L 65 60 L 72 74 Z" fill="white" fillOpacity="0.2" strokeOpacity="0.95" />
      <path d="M 33 67.5 H 61" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M 41.5 56.1 L 62.5 17.1 L 73.5 22.9 L 52.5 61.9 Z" fill="white" fillOpacity="0.16" strokeOpacity="0.95" />
      <path d="M 65.8 25 L 111.8 45 L 116.2 35 L 70.2 15 Z" fill="white" fillOpacity="0.16" strokeOpacity="0.95" />
      <circle cx="47" cy="59" r="7" fill="white" fillOpacity="0.22" strokeOpacity="0.95" />
      <circle cx="68" cy="20" r="6.5" fill="white" fillOpacity="0.22" strokeOpacity="0.95" />
      <circle cx="114" cy="40" r="5" fill="white" fillOpacity="0.22" strokeOpacity="0.95" />
      <path d="M 114.9 49.1 L 121.3 34.5" strokeOpacity="0.95" />
      <path d="M 114.9 49.1 L 127.7 54.7 L 128.9 51.9" strokeOpacity="0.95" />
      <path d="M 121.3 34.5 L 134.1 40.1 L 132.9 42.9" strokeOpacity="0.95" />
    </>
  ),

  // The equity curve, wobble and all.
  carry: (
    <>
      <line x1="18" y1="59" x2="142" y2="59" strokeWidth="1.6" opacity="0.3" />
      <line x1="18" y1="44" x2="142" y2="44" strokeWidth="1.6" opacity="0.3" />
      <line x1="18" y1="29" x2="142" y2="29" strokeWidth="1.6" opacity="0.3" />
      <path d="M 21,69 L 24.5,66.7 L 27.9,63.8 L 31.4,60 L 34.8,57.4 L 38.3,55.4 L 41.7,54.6 L 45.2,52.6 L 48.6,53.9 L 52.1,55.6 L 55.5,52.9 L 59,50.9 L 62.5,48 L 65.9,46 L 69.4,43.7 L 72.8,42.1 L 76.3,40.2 L 79.7,41.5 L 83.2,40.3 L 86.6,38.8 L 90.1,36.9 L 93.5,35.6 L 97,33.5 L 100.5,31.8 L 103.9,32.6 L 107.4,33.6 L 110.8,30.7 L 114.3,27.2 L 117.7,24.3 L 121.2,21.8 L 124.6,20.5 L 128.1,19.3 L 131.5,17.5 L 135,16 L 135,74 L 21,74 Z" fill="#fff" fillOpacity="0.24" stroke="none" />
      <line x1="18" y1="74" x2="142" y2="74" strokeWidth="1.6" opacity="0.55" />
      <line x1="18" y1="12" x2="18" y2="74" strokeWidth="1.6" opacity="0.55" />
      <line x1="49" y1="74" x2="49" y2="78" strokeWidth="1.6" opacity="0.55" />
      <line x1="78" y1="74" x2="78" y2="78" strokeWidth="1.6" opacity="0.55" />
      <line x1="107" y1="74" x2="107" y2="78" strokeWidth="1.6" opacity="0.55" />
      <polyline points="21,69 24.5,66.7 27.9,63.8 31.4,60 34.8,57.4 38.3,55.4 41.7,54.6 45.2,52.6 48.6,53.9 52.1,55.6 55.5,52.9 59,50.9 62.5,48 65.9,46 69.4,43.7 72.8,42.1 76.3,40.2 79.7,41.5 83.2,40.3 86.6,38.8 90.1,36.9 93.5,35.6 97,33.5 100.5,31.8 103.9,32.6 107.4,33.6 110.8,30.7 114.3,27.2 117.7,24.3 121.2,21.8 124.6,20.5 128.1,19.3 131.5,17.5 135,16" strokeWidth="2.4" opacity="0.95" />
      <circle cx="135" cy="16" r="3.6" fill="#fff" fillOpacity="0.26" strokeWidth="2.4" opacity="0.95" />
    </>
  ),

  // The airship, carrying something.
  hoverloon: (
    <>
      <path d="M24 23C27 13 48 9 88 9C116 9 137 13 137 23C137 33 116 37 88 37C48 37 27 33 24 23Z" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <path d="M38 13.3L30 5L27 19.2C30 16.3 34 14.4 38 13.3Z" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <path d="M38 32.7L30 41L27 26.8C30 29.7 34 31.6 38 32.7Z" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <path d="M62 9.8C57 16 57 30 62 36.2" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M100 9.3C95 16 95 30 100 36.7" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M126 13.2C131 17 131 29 126 32.8" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M76 37L76 41M94 37L94 41" strokeWidth="1.6" strokeOpacity="0.55" />
      <rect x="66" y="41" width="38" height="11" rx="4" fill="#fff" fillOpacity="0.18" strokeOpacity="0.95" />
      <path d="M66 50L49 50L49 44" strokeOpacity="0.95" />
      <ellipse cx="49" cy="43" rx="12" ry="3" strokeOpacity="0.95" />
      <circle cx="49" cy="43" r="1.8" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M104 50L121 50L121 44" strokeOpacity="0.95" />
      <ellipse cx="121" cy="43" rx="12" ry="3" strokeOpacity="0.95" />
      <circle cx="121" cy="43" r="1.8" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M79 52L79 59M91 52L91 59" strokeWidth="1.6" strokeOpacity="0.55" />
      <rect x="74" y="59" width="22" height="13" rx="1.5" fill="#fff" fillOpacity="0.22" strokeOpacity="0.95" />
      <path d="M74 63.5L96 63.5" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M26 78L134 78" strokeWidth="1.6" strokeOpacity="0.3" />
    </>
  ),

  // A browser docked in the editor, vertical tabs down the side.
  betaflow: (
    <>
      <rect x="14" y="12" width="132" height="64" rx="7" fill="#fff" fillOpacity="0.14" strokeOpacity="0.95" />
      <path d="M14 25 H50" strokeWidth="1.6" strokeOpacity="0.5" />
      <circle cx="22" cy="18.5" r="1.8" fill="#fff" fillOpacity="0.8" stroke="none" />
      <circle cx="29" cy="18.5" r="1.8" fill="#fff" fillOpacity="0.8" stroke="none" />
      <circle cx="36" cy="18.5" r="1.8" fill="#fff" fillOpacity="0.8" stroke="none" />
      <path d="M20 34 H42 M24 42 H38 M24 50 H44 M20 58 H36 M24 66 H40" strokeWidth="1.6" strokeOpacity="0.45" />
      <path d="M50 25 H146 V69 A7 7 0 0 1 139 76 H50 Z" fill="#fff" fillOpacity="0.14" strokeOpacity="0.95" />
      <path d="M72 25 V76" strokeWidth="1.6" strokeOpacity="0.45" />
      <rect x="54" y="31" width="14" height="8.5" rx="4.25" fill="#fff" fillOpacity="0.34" strokeOpacity="0.95" strokeWidth="1.6" />
      <rect x="54" y="41.5" width="14" height="8.5" rx="4.25" strokeOpacity="0.6" strokeWidth="1.6" />
      <rect x="54" y="52" width="14" height="8.5" rx="4.25" strokeOpacity="0.6" strokeWidth="1.6" />
      <rect x="54" y="62.5" width="14" height="8.5" rx="4.25" strokeOpacity="0.6" strokeWidth="1.6" />
      <rect x="78" y="31" width="58" height="9.5" rx="4.75" strokeOpacity="0.95" strokeWidth="1.6" />
      <circle cx="84.5" cy="35.75" r="2.9" strokeOpacity="0.85" strokeWidth="1.6" />
      <rect x="78" y="47" width="18" height="16" rx="2.5" fill="#fff" fillOpacity="0.26" strokeOpacity="0.6" strokeWidth="1.6" />
      <path d="M103 51.5 H134 M103 59 H124 M78 69.5 H128" strokeWidth="1.6" strokeOpacity="0.6" />
    </>
  ),

  // Price crossing the resolution line, entries clustered at the end.
  kalshi: (
    <>
      <line x1="12" y1="74" x2="150" y2="74" strokeWidth="1.6" strokeOpacity=".3" />
      <line x1="30" y1="69" x2="30" y2="74" strokeWidth="1.6" strokeOpacity=".3" />
      <line x1="58" y1="69" x2="58" y2="74" strokeWidth="1.6" strokeOpacity=".3" />
      <line x1="86" y1="69" x2="86" y2="74" strokeWidth="1.6" strokeOpacity=".3" />
      <line x1="114" y1="69" x2="114" y2="74" strokeWidth="1.6" strokeOpacity=".3" />
      <line x1="12" y1="46" x2="150" y2="46" strokeWidth="2.2" strokeOpacity=".55" strokeDasharray="6 6" />
      <line x1="141" y1="29" x2="141" y2="74" strokeWidth="1.6" strokeOpacity=".55" strokeDasharray="4 4" />
      <polyline points="16,63 30,55 43,66 57,54 70,63 80,51 90,33 99,28 110,34 121,27 132,31 141,20" strokeOpacity=".95" />
      <circle cx="99" cy="28" r="3.4" fill="#fff" fillOpacity=".26" strokeWidth="1.6" strokeOpacity=".95" />
      <circle cx="110" cy="34" r="3.4" fill="#fff" fillOpacity=".26" strokeWidth="1.6" strokeOpacity=".95" />
      <circle cx="121" cy="27" r="3.4" fill="#fff" fillOpacity=".26" strokeWidth="1.6" strokeOpacity=".95" />
      <circle cx="132" cy="31" r="3.4" fill="#fff" fillOpacity=".26" strokeWidth="1.6" strokeOpacity=".95" />
      <circle cx="141" cy="20" r="5" fill="#fff" fillOpacity=".26" strokeOpacity=".95" />
    </>
  ),

  // Seven retrievers. Note that two tie for tallest.
  retrieval: (
    <>
      <line x1="24" y1="48" x2="136" y2="48" strokeWidth="1.6" strokeOpacity="0.32" />
      <rect x="28" y="41" width="11" height="33" rx="2" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <rect x="43.5" y="26" width="11" height="48" rx="2" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <rect x="59" y="49" width="11" height="25" rx="2" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <rect x="74.5" y="22" width="11" height="52" rx="2" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <rect x="90" y="33" width="11" height="41" rx="2" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <rect x="105.5" y="22" width="11" height="52" rx="2" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <rect x="121" y="43" width="11" height="31" rx="2" fill="#fff" fillOpacity="0.16" strokeOpacity="0.95" />
      <line x1="24" y1="22" x2="136" y2="22" strokeWidth="1.6" strokeOpacity="0.5" strokeDasharray="5 4" />
      <circle cx="80" cy="14" r="3.9" fill="#fff" fillOpacity="0.95" stroke="none" />
      <circle cx="111" cy="14" r="3.9" fill="#fff" fillOpacity="0.95" stroke="none" />
      <line x1="24" y1="74" x2="136" y2="74" strokeWidth="2.4" strokeOpacity="0.95" />
    </>
  ),

  // The camera, the kerb, and the gap.
  lastcurb: (
    <>
      <path d="M 56.36 35.45 L 69 60.5" strokeOpacity="0.3" strokeWidth="1.6" strokeDasharray="3 4" />
      <path d="M 56.36 35.45 L 103 60.5" strokeOpacity="0.3" strokeWidth="1.6" strokeDasharray="3 4" />
      <path d="M 10 74 L 150 74" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M 10 78.5 L 150 78.5" strokeOpacity="0.3" strokeWidth="1.6" />
      <rect x="69" y="60.5" width="34" height="13.5" rx="2.5" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="4 3.5" />
      <circle cx="37" cy="69" r="5" fill="#fff" fillOpacity="0.22" strokeOpacity="0.95" />
      <circle cx="54" cy="69" r="5" fill="#fff" fillOpacity="0.22" strokeOpacity="0.95" />
      <path d="M 26 67 L 26 59.5 C 26 57 27.5 55.8 30 55.6 L 60 55.6 C 62.5 55.8 64 57 64 59.5 L 64 67 Z" fill="#fff" fillOpacity="0.22" strokeOpacity="0.95" />
      <path d="M 33 55.6 L 38 47.8 C 38.8 46.8 39.8 46.4 41 46.4 L 50 46.4 C 51.4 46.4 52.4 47 53 48 L 56.5 55.6 Z" fill="#fff" fillOpacity="0.14" strokeOpacity="0.95" />
      <circle cx="119" cy="69" r="5" fill="#fff" fillOpacity="0.22" strokeOpacity="0.95" />
      <circle cx="136" cy="69" r="5" fill="#fff" fillOpacity="0.22" strokeOpacity="0.95" />
      <path d="M 108 67 L 108 59.5 C 108 57 109.5 55.8 112 55.6 L 142 55.6 C 144.5 55.8 146 57 146 59.5 L 146 67 Z" fill="#fff" fillOpacity="0.22" strokeOpacity="0.95" />
      <path d="M 115 55.6 L 120 47.8 C 120.8 46.8 121.8 46.4 123 46.4 L 132 46.4 C 133.4 46.4 134.4 47 135 48 L 138.5 55.6 Z" fill="#fff" fillOpacity="0.14" strokeOpacity="0.95" />
      <path d="M 14 74 L 14 27 C 14 19 18 15.1 26 15.1 L 46.4 15.1" strokeOpacity="0.95" />
      <path d="M 46.42 15.07 L 58 28.85 L 49.58 35.93 L 38 22.15 Z" fill="#fff" fillOpacity="0.2" strokeOpacity="0.95" />
      <path d="M 56.09 30.46 L 58.66 33.52 L 54.06 37.38 L 51.49 34.32" strokeOpacity="0.95" />
    </>
  ),

  // The keyboard, in three quarters.
  piano: (
    <>
      <path d="M32 43 L35 35 L141 35 L138 43" strokeOpacity="0.4" strokeWidth="1.6" fill="#fff" fillOpacity="0.14" />
      <path d="M22 69 L128 69 L138 43 L32 43 Z" strokeOpacity="0.95" fill="#fff" fillOpacity="0.14" />
      <path d="M22 69 L22 75 L128 75 L128 69" strokeOpacity="0.95" fill="#fff" fillOpacity="0.18" />
      <path d="M32.6 69 L36.8 58 M43.2 69 L47.4 58 M64.4 69 L68.6 58 M75 69 L79.2 58 M85.6 69 L89.8 58 M106.8 69 L111 58 M117.4 69 L121.6 58 M53.8 69 L63.8 43 M96.2 69 L106.2 43" strokeOpacity="0.62" strokeWidth="1.6" />
      <path d="M34.1 58 L39.6 58 L45.4 43 L39.8 43 Z M44.7 58 L50.2 58 L56 43 L50.4 43 Z M65.9 58 L71.4 58 L77.2 43 L71.6 43 Z M76.5 58 L82 58 L87.8 43 L82.2 43 Z M87.1 58 L92.6 58 L98.4 43 L92.8 43 Z M108.3 58 L113.8 58 L119.6 43 L114 43 Z M118.9 58 L124.4 58 L130.2 43 L124.6 43 Z" strokeOpacity="0.95" strokeWidth="1.6" fill="#fff" fillOpacity="0.26" />
      <ellipse cx="60" cy="28" rx="4.6" ry="3.3" transform="rotate(-18 60 28)" strokeOpacity="0.6" strokeWidth="1.6" fill="#fff" fillOpacity="0.22" />
      <ellipse cx="78" cy="24" rx="4.6" ry="3.3" transform="rotate(-18 78 24)" strokeOpacity="0.6" strokeWidth="1.6" fill="#fff" fillOpacity="0.22" />
      <ellipse cx="108" cy="22" rx="4.6" ry="3.3" transform="rotate(-18 108 22)" strokeOpacity="0.6" strokeWidth="1.6" fill="#fff" fillOpacity="0.22" />
      <path d="M64.3 26.9 L64.3 15 M82.3 22.9 L82.3 11 M112.3 20.9 L112.3 9" strokeOpacity="0.6" strokeWidth="1.6" />
      <path d="M63.6 15.2 L83 10.9" strokeOpacity="0.6" strokeWidth="3.6" />
      <path d="M112.3 9 C119 11.5 120 17 116 20.5" strokeOpacity="0.6" strokeWidth="1.6" />
    </>
  ),

  // The wall answering.
  squash: (
    <>
      <line x1="6" y1="74" x2="154" y2="74" strokeWidth="1.6" strokeOpacity="0.3" />
      <rect x="8" y="12" width="90" height="62" rx="1" strokeOpacity="0.55" />
      <rect x="8" y="67" width="90" height="7" fill="#fff" fillOpacity="0.2" stroke="none" />
      <line x1="8" y1="67" x2="98" y2="67" strokeOpacity="0.55" />
      <line x1="8" y1="40" x2="98" y2="40" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M110 52Q78 58 46 60" strokeWidth="1.6" strokeOpacity="0.55" />
      <path d="M46 52C66 39 90 25 114 21C130 18 144 19 154 24" strokeOpacity="0.95" />
      <circle cx="41" cy="57" r="5" fill="#fff" fillOpacity="0.26" strokeOpacity="0.95" />
      <ellipse cx="123" cy="45" rx="12.5" ry="16.5" transform="rotate(-38 123 45)" strokeOpacity="0.95" />
      <line x1="132.5" y1="57" x2="144" y2="71" strokeOpacity="0.95" />
      <line x1="136.7" y1="66.9" x2="141.3" y2="63.1" strokeWidth="1.6" strokeOpacity="0.95" />
      <line x1="140.7" y1="71.9" x2="145.3" y2="68.1" strokeWidth="1.6" strokeOpacity="0.95" />
      <line x1="128.5" y1="33.1" x2="110.1" y2="47.5" strokeWidth="1.6" strokeOpacity="0.4" />
      <line x1="135.5" y1="41.6" x2="116.7" y2="56.2" strokeWidth="1.6" strokeOpacity="0.4" />
      <line x1="128.4" y1="60" x2="109.8" y2="36.2" strokeWidth="1.6" strokeOpacity="0.4" />
      <line x1="136.2" y1="53.8" x2="117.6" y2="30" strokeWidth="1.6" strokeOpacity="0.4" />
    </>
  ),
};

export default function CardArt({ id }: { id: string }) {
  const scene = SCENES[id];
  if (!scene) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 106"
      preserveAspectRatio="xMidYMid slice"
      className="card-scene"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {scene}
    </svg>
  );
}
