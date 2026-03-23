# LLM Optimization Plan for Skyler Chan's Personal Website

**Created:** February 25, 2026

## Overview

Transform the personal website to be highly queryable by LLMs with comprehensive structured data that accurately represents Skyler Chan's work, skills, interests, and background. This will enable AI assistants to understand and reference his profile with full context.

---

## Core Objectives

1. **Structured Data**: Create machine-readable JSON/JSON-LD files with complete professional and personal information
2. **Enhanced Metadata**: Add comprehensive meta tags and Open Graph data
3. **Dedicated LLM Endpoint**: Build an API route specifically for LLM consumption
4. **Rich Context Document**: Comprehensive markdown profile for AI agents
5. **Semantic HTML**: Proper schema.org markup throughout the site

---

## Implementation Plan

### Phase 1: Structured Data Files

Create a `/public/data/` directory with JSON files:

#### 1.1 Personal Profile (`profile.json`)
```json
{
  "name": "Skyler Chan",
  "title": "Engineer & Builder",
  "tagline": "Always building. Always thinking.",
  "bio": {
    "short": "Founding engineer at WithAI Research (YC W26), Princeton student focused on robotics, AI, and climate tech. Building systems that matter.",
    "long": "Skyler Chan is a founding engineer at WithAI Research, a Y Combinator W26 startup building LLMs for AI-native hedge funds. He's passionate about robotics, artificial intelligence, and climate technology. At Princeton, he conducted research at HMEI on solar radiation management, discovering that stratospheric black carbon aerosols are 10x more effective at cooling than reflective sulfate. He also founded Hoverloon under the Princeton Robotics Club, creating a blimp-drone hybrid that achieved 19x payload capacity through buoyant lift. Currently, he's building humanoid robots with SO-100 arms and exploring teleoperation as a pathway to better autonomy."
  },
  "education": {
    "institution": "Princeton University",
    "status": "Current Student",
    "focus": ["Robotics", "AI", "Climate Technology"]
  },
  "location": "Princeton, NJ",
  "website": "https://skyler-chan.com",
  "social": {
    "github": "skylerlchan",
    "linkedin": "skylerchan",
    "twitter": "SkylerChan17",
    "instagram": "_.skyler.chan._",
    "email": "skylerlchan@gmail.com"
  }
}
```

#### 1.2 Work Experience (`work.json`)
```json
{
  "positions": [
    {
      "id": "withai-research",
      "role": "Founding Engineer",
      "company": "WithAI Research",
      "companyInfo": "YC W26 startup building LLMs for AI-native hedge funds",
      "startDate": "2025",
      "current": true,
      "description": "Developing core platform and infrastructure for AI-driven financial systems. Building LLM-powered tools for quantitative analysis and trading strategies.",
      "technologies": ["LLMs", "Next.js", "Python", "Machine Learning"],
      "achievements": [
        "Built founding infrastructure for AI-native hedge fund platform",
        "Developed LLM integration for financial analysis"
      ],
      "learnings": "Working at the intersection of AI and finance, learning how to build reliable systems that handle high-stakes decisions.",
      "category": "Startup",
      "website": "https://withai.com"
    },
    {
      "id": "hmei-princeton",
      "role": "Research Assistant",
      "company": "Princeton High Meadows Environmental Institute (HMEI)",
      "startDate": "2024",
      "endDate": "2025",
      "current": false,
      "description": "Conducted climate research on solar radiation management strategies. Investigated the effectiveness of different aerosol types for climate intervention.",
      "technologies": ["Python", "Climate Modeling", "Data Science", "Scientific Computing"],
      "achievements": [
        "Discovered black carbon aerosols are 10x more effective at cooling than sulfate",
        "Analyzed stratospheric aerosol behavior and climate impacts",
        "Presented research findings to faculty and peers"
      ],
      "learnings": "Understanding the complexities of climate systems and the potential for technological interventions in addressing climate change.",
      "category": "Research",
      "presentation": "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit?usp=sharing&ouid=108230747896924390036&rtpof=true&sd=true"
    }
  ]
}
```

#### 1.3 Projects (`projects.json`)
```json
{
  "projects": [
    {
      "id": "hoverloon",
      "name": "Hoverloon",
      "type": "Hardware/Robotics",
      "status": "Completed",
      "tagline": "Blimp-drone hybrid for extended flight endurance",
      "description": "Founded under Princeton Robotics Club, Hoverloon combines buoyant lift with drone propulsion to achieve unprecedented payload capacity and energy efficiency. The hybrid system achieved 19x payload capacity compared to the drone alone, enabling massive energy savings for extended flight operations.",
      "technologies": ["Computer Vision", "CAD", "Embedded Systems", "Aeronautics", "Control Systems"],
      "achievements": [
        "19x payload capacity increase through buoyant lift",
        "Significant energy savings for extended flight",
        "Founded and led project under Princeton Robotics Club"
      ],
      "learnings": "Combining different engineering domains to create innovative solutions. Understanding the physics of buoyancy and how it can augment traditional drone systems.",
      "startDate": "2024",
      "category": "Robotics",
      "featured": true
    },
    {
      "id": "humanoid-robots",
      "name": "Building Humanoid Robots",
      "type": "Robotics/AI",
      "status": "In Progress",
      "tagline": "Making robots real through teleoperation and embodied AI",
      "description": "Building humanoid robots equipped with SO-100 arms, exploring teleoperation as a System 1 procedure to enable better data collection and autonomy. The goal is to create intuitive human-robot interfaces that make embodied AI practical and accessible.",
      "technologies": ["C++", "ROS", "CAD", "Teleoperation", "Robotics", "Control Systems"],
      "achievements": [
        "Assembled and programmed humanoid robot systems",
        "Developed teleoperation interfaces for intuitive control",
        "Testing data collection methods for training autonomous behaviors"
      ],
      "learnings": "Teleoperation as a bridge between human intuition and robot autonomy. The importance of good data collection for training embodied AI systems.",
      "startDate": "2025",
      "category": "Robotics",
      "featured": true
    },
    {
      "id": "lastcurb",
      "name": "LastCurb",
      "type": "Computer Vision/ML",
      "status": "Completed",
      "tagline": "Edge AI for smart parking in NYC",
      "description": "Analyzes curb data from public NYC CCTV cameras to help find available parking spots. Built to test edge AI and machine learning for real-time urban sensing and to solve a practical problem in dense urban environments.",
      "technologies": ["Edge AI", "Machine Learning", "Computer Vision", "Python", "Real-time Processing"],
      "achievements": [
        "Real-time parking detection from CCTV feeds",
        "Edge AI deployment for low-latency processing",
        "Open-sourced for community use"
      ],
      "learnings": "Edge AI deployment challenges and the practicalities of computer vision in real-world urban environments.",
      "repository": "https://github.com/skylerlchan/LastCurb",
      "category": "Machine Learning",
      "featured": true
    },
    {
      "id": "btc-funding-carry",
      "name": "Leveraged BTC Funding Carry",
      "type": "Quantitative Finance",
      "status": "Completed",
      "tagline": "Delta-neutral crypto arbitrage strategy",
      "description": "Delta-neutral long-spot/short-futures strategy that harvests perpetual funding rate carry with leverage while hedging away directional market risk. The strategy exploits the funding rate premium in perpetual futures markets while remaining market-neutral.",
      "technologies": ["Python", "Quantitative Finance", "Crypto", "Risk Management", "Trading Systems"],
      "achievements": [
        "Developed market-neutral arbitrage strategy",
        "Published academic paper on SSRN",
        "Open-sourced implementation for research community"
      ],
      "learnings": "Understanding crypto market microstructure, funding rates, and the complexities of maintaining delta-neutral positions with leverage.",
      "repository": "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage",
      "paper": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305",
      "category": "Finance",
      "featured": true
    }
  ]
}
```

#### 1.4 Skills & Technologies (`skills.json`)
```json
{
  "technicalSkills": {
    "programming": {
      "primary": ["Python", "C++", "TypeScript", "JavaScript"],
      "frameworks": ["Next.js", "React", "ROS", "Node.js"],
      "expertise": ["Full-stack development", "Systems programming", "Web applications"]
    },
    "ai_ml": {
      "areas": ["Machine Learning", "Computer Vision", "LLMs", "Edge AI", "Data Science"],
      "tools": ["PyTorch", "TensorFlow", "OpenCV", "scikit-learn"],
      "applications": ["Real-time ML", "NLP", "Vision systems"]
    },
    "robotics": {
      "areas": ["Embedded Systems", "Control Systems", "Teleoperation", "CAD"],
      "tools": ["ROS", "Arduino", "SolidWorks", "Fusion 360"],
      "specialties": ["Humanoid robots", "Aerial systems", "Hardware integration"]
    },
    "finance": {
      "areas": ["Quantitative Finance", "Algorithmic Trading", "Risk Management"],
      "expertise": ["Market microstructure", "Delta-neutral strategies", "Crypto markets"]
    },
    "climate": {
      "areas": ["Climate Modeling", "Data Analysis", "Solar Radiation Management"],
      "tools": ["Python scientific stack", "Climate simulation tools"]
    }
  },
  "domainExpertise": [
    {
      "domain": "Robotics",
      "level": "Advanced",
      "experience": "Building humanoid robots, blimp-drone hybrids, embedded systems"
    },
    {
      "domain": "AI & Machine Learning",
      "level": "Advanced",
      "experience": "LLMs, computer vision, edge AI deployment, real-time ML systems"
    },
    {
      "domain": "Climate Technology",
      "level": "Intermediate",
      "experience": "Solar radiation management research, climate modeling"
    },
    {
      "domain": "Quantitative Finance",
      "level": "Intermediate",
      "experience": "Crypto arbitrage, market-neutral strategies, risk management"
    },
    {
      "domain": "Full-stack Development",
      "level": "Advanced",
      "experience": "Next.js, React, TypeScript, web applications, API design"
    }
  ],
  "softSkills": [
    "Problem-solving across multiple domains",
    "Building 0-to-1 products",
    "Research and technical writing",
    "Leadership in engineering projects",
    "Cross-disciplinary thinking"
  ]
}
```

#### 1.5 Interests & Philosophy (`interests.json`)
```json
{
  "professionalInterests": [
    {
      "area": "Robotics & Embodied AI",
      "description": "Making robots real through better teleoperation, data collection, and embodied intelligence. Interested in humanoid robots and practical applications.",
      "currentFocus": "Teleoperation as System 1 for robot learning"
    },
    {
      "area": "AI Systems",
      "description": "Building reliable AI systems that work in production. Interested in LLMs, computer vision, and edge AI deployment.",
      "currentFocus": "LLMs for financial analysis and decision-making"
    },
    {
      "area": "Climate Technology",
      "description": "Using technology to address climate change, from solar radiation management research to practical climate solutions.",
      "currentFocus": "Understanding intervention strategies and their effects"
    },
    {
      "area": "Quantitative Finance",
      "description": "Market microstructure, algorithmic trading, and the intersection of AI and finance.",
      "currentFocus": "AI-native approaches to financial analysis"
    }
  ],
  "personalInterests": {
    "piano": {
      "description": "Classically trained pianist with extensive performance experience",
      "repertoire": ["Classical", "Contemporary", "Jazz"],
      "favoriteComposers": ["Ravel", "Debussy", "Liszt", "Hiromi"],
      "performances": [
        "The Gambler - Hiromi",
        "La Valse - Ravel",
        "Waldesrauschen - Liszt",
        "Harry Potter Medley - John Williams"
      ]
    },
    "travel": {
      "description": "Exploring new places, food, and cultures",
      "passion": "Finding the best food spots and experiencing local culture"
    },
    "building": {
      "description": "Perpetually building things - software, hardware, ideas",
      "philosophy": "Learn by doing. Build to understand."
    }
  },
  "philosophy": {
    "approach": "Always building. Always thinking.",
    "values": [
      "Bias toward action and building",
      "Cross-disciplinary problem-solving",
      "Making complex things accessible",
      "Learning through creating"
    ],
    "motto": "The best way to understand something is to build it."
  }
}
```

### Phase 2: JSON-LD Structured Data

Add schema.org markup to the layout for:
- Person schema
- Organization (WithAI)
- CreativeWork (Projects)
- WebSite
- BreadcrumbList

### Phase 3: LLM-Specific API Endpoint

Create `/api/llm-context` route that returns:
- Complete profile summary
- All projects with full details
- Skills matrix
- Current focus areas
- Contact information

Format optimized for LLM consumption with clear sections and context.

### Phase 4: Enhanced Metadata

Update constants.ts with:
- Fuller site description
- Rich keywords
- Author information
- Structured contact data

### Phase 5: Semantic HTML Improvements

Add proper ARIA labels and semantic tags:
- `<article>` for projects
- `<section>` with meaningful labels
- Schema.org microdata attributes
- Enhanced alt text for images

### Phase 6: LLM Context Document

Create `public/llm-context.md` - a comprehensive markdown file specifically designed for LLM consumption:
- Complete biography
- Detailed project descriptions
- Technical expertise breakdown
- Philosophy and approach
- Current focus and future interests

---

## Success Metrics

1. **Completeness**: LLMs can accurately describe Skyler's work across all domains
2. **Context**: LLMs understand the "why" behind projects, not just the "what"
3. **Discoverability**: Structured data is easily accessible via web APIs
4. **Accuracy**: Information is detailed enough to avoid hallucination
5. **Maintainability**: Easy to update as new work is completed

---

## Technical Implementation Notes

- All JSON files served from `/public/data/` with proper CORS headers
- API endpoint returns JSON with comprehensive context
- Next.js metadata API for enhanced SEO
- TypeScript interfaces aligned with JSON schema
- Validation to ensure data consistency

---

## Future Enhancements

1. **Blog/Writing**: Add structured blog posts for deeper technical content
2. **Timeline**: Interactive timeline of work and education
3. **Skills Graph**: Visual representation of skill relationships
4. **Project Deep-Dives**: Detailed case studies with technical walkthroughs
5. **RSS Feed**: Machine-readable feed of updates and new work
