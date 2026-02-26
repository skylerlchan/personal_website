export default function WithAILogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 300"
      className={className}
    >
      <defs>
        <filter id="darkModeShadow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.3"/>
        </filter>
      </defs>
      <g transform="translate(90, 115)">
        {/* WithAI favicon (W/ geometric mark) */}
        <g transform="translate(10, 0) scale(0.467)" className="dark:[filter:url(#darkModeShadow)]">
          <rect x="0" y="25" width="18" height="100" className="fill-black dark:fill-white" />
          <polygon points="0 125 18 125 58 25 40 25" className="fill-black dark:fill-white" />
          <rect x="40" y="25" width="18" height="100" className="fill-black dark:fill-white" />
          <polygon points="40 125 58 125 98 25 80 25" className="fill-black dark:fill-white" />
          <polygon points="67 150 85 150 145 0 127 0" className="fill-black dark:fill-white" />
        </g>

        {/* x separator */}
        <text
          className="fill-[#666666] dark:fill-[#888888]"
          x="115"
          y="42"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'DM Sans', 'Inter', system-ui, sans-serif"
          fontWeight={300}
          fontSize={28}
        >
          x
        </text>

        {/* YC orange shield with Y */}
        <rect x="145" y="2" width="66" height="66" rx="10" fill="#FF6600" />
        <text
          fill="#ffffff"
          x="178"
          y="41"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'DM Sans', 'Inter', system-ui, sans-serif"
          fontWeight={700}
          fontSize={42}
        >
          Y
        </text>
      </g>
    </svg>
  );
}
