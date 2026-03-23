# LLM Enhancement Plan for Personal Website

**Created:** February 25, 2026

## Overview

Transform the personal website into an LLM-friendly platform that allows AI systems to deeply understand Skyler Chan's work, expertise, projects, and personal interests through structured data, semantic markup, and comprehensive context.

## Goals

1. **Machine-Readable Context**: Provide structured data that LLMs can easily parse and understand
2. **Rich Biographical Information**: Include detailed context about skills, experiences, and achievements
3. **Project Deep-Dives**: Expand project descriptions with technical details, methodologies, and outcomes
4. **Semantic HTML & Metadata**: Use proper schema.org markup and meta tags
5. **Queryable Data Layer**: Create JSON-LD structured data for all major content areas

## Implementation Strategy

### Phase 1: Structured Data Foundation

#### 1.1 Create Comprehensive Profile Schema
**Location:** `src/data/profile.json`

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Skyler Chan",
  "jobTitle": "Founding Engineer & AI Researcher",
  "description": "...",
  "alumniOf": {...},
  "knowsAbout": [...],
  "hasOccupation": [...],
  "sameAs": [...social links...]
}
```

**Content to include:**
- Full biographical information
- Educational background (Princeton University)
- Current role at WithAI Research (YC W26)
- Areas of expertise (AI/ML, robotics, climate science, quantitative finance)
- Skills and technologies
- Research interests
- Professional philosophy ("Always building. Always thinking.")

#### 1.2 Enhanced Project Metadata
**Location:** `src/data/projects-enhanced.json`

Expand each project with:
- **Detailed description** (3-5 paragraphs instead of 1-2 sentences)
- **Problem statement**: What challenge was being addressed?
- **Approach**: Technical methodology and architecture
- **Key innovations**: Unique solutions or breakthroughs
- **Results & impact**: Quantitative outcomes where applicable
- **Learnings**: Insights gained from the project
- **Timeline**: When the project was conducted
- **Collaborators**: Team composition (if applicable)
- **Technologies deep-dive**: Specific frameworks, tools, libraries used
- **Related publications**: Papers, presentations, blog posts

Example enhanced structure:
```json
{
  "slug": "hoverloon",
  "title": "Hoverloon - Hybrid Blimp-Drone Platform",
  "shortDescription": "Current brief description",
  "detailedDescription": {
    "overview": "Multi-paragraph detailed description",
    "problemStatement": "...",
    "technicalApproach": "...",
    "innovations": [...],
    "outcomes": {...},
    "timeline": "2024"
  },
  "techStack": {
    "computerVision": ["OpenCV", "specific libraries"],
    "hardware": ["CAD tools", "components used"],
    "embedded": ["microcontrollers", "communication protocols"]
  },
  "metrics": {
    "payloadIncrease": "19x",
    "energySavings": "percentage or description"
  }
}
```

#### 1.3 Work Experience Schema
**Location:** `src/data/work-experience.json`

```json
[
  {
    "organization": "WithAI Research",
    "role": "Founding Engineer",
    "startDate": "2026-01",
    "current": true,
    "description": "...",
    "responsibilities": [...],
    "technologies": [...],
    "achievements": [...],
    "context": "YC W26 startup building LLMs for AI-native hedge funds"
  },
  {
    "organization": "Princeton HMEI",
    "role": "Research Assistant",
    "description": "...",
    "findings": "...",
    "publications": [...]
  }
]
```

### Phase 2: Enhanced Content Pages

#### 2.1 Create Detailed About/Bio Section
**Location:** `src/data/biography.json` or `src/content/about.md`

Include:
- **Educational Journey**: Princeton University details, relevant coursework
- **Professional Narrative**: Career trajectory and motivations
- **Research Philosophy**: Approach to problem-solving and innovation
- **Interests & Motivations**: What drives the work in AI, robotics, climate tech
- **Future Vision**: Long-term goals and aspirations
- **Technical Expertise Areas**:
  - Large Language Models & AI Systems
  - Robotics & Computer Vision
  - Climate Science & Modeling
  - Quantitative Finance & Crypto Markets
  - Edge AI & Real-time Systems
  - Full-stack Development (Next.js, React, TypeScript)

#### 2.2 Skills & Expertise Taxonomy
**Location:** `src/data/skills.json`

```json
{
  "technicalSkills": {
    "ai_ml": {
      "proficiency": "expert",
      "technologies": ["LLMs", "Computer Vision", "Edge AI"],
      "applications": ["Research", "Production Systems"]
    },
    "programming": {
      "languages": ["Python", "TypeScript", "C++"],
      "frameworks": ["Next.js", "React", "ROS"],
      "experience": "5+ years"
    }
  },
  "domainExpertise": [...],
  "researchAreas": [...]
}
```

#### 2.3 Hobbies & Personal Interests Deep-Dive
**Location:** `src/data/hobbies-extended.json`

Expand piano and travel sections with:
- **Piano Background**: Years of experience, training, performance history
- **Repertoire**: Composers and pieces mastered
- **Musical Philosophy**: What piano performance means personally
- **Travel Philosophy**: What drives exploration
- **Notable Experiences**: Memorable locations and experiences
- **Food & Culture**: Approach to experiencing new cuisines and places

### Phase 3: Meta Tags & Semantic Markup

#### 3.1 Add Schema.org JSON-LD to Every Page
**Location:** Update `src/app/layout.tsx` and page components

```typescript
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://skyler-chan.com/#person",
  // ... full schema
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": { "@id": "https://skyler-chan.com/#person" }
};
```

#### 3.2 Enhanced Meta Tags
Add to `<head>`:
- Open Graph tags for social sharing
- Twitter Card metadata
- Rich site descriptions
- Keyword tags for main expertise areas

#### 3.3 Microdata in Components
Add semantic HTML attributes:
```html
<article itemscope itemtype="https://schema.org/CreativeWork">
  <h2 itemprop="name">Project Name</h2>
  <div itemprop="description">...</div>
  <meta itemprop="keywords" content="AI, robotics, ...">
</article>
```

### Phase 4: LLM-Specific Features

#### 4.1 Create AI Assistant Context File
**Location:** `public/ai-context.json`

A comprehensive, easily parseable file specifically designed for LLM consumption:
```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-25",
  "person": {
    "name": "Skyler Chan",
    "currentRole": "...",
    "summary": "Comprehensive multi-paragraph bio",
    "expertise": [...],
    "notableAchievements": [...]
  },
  "projects": [...full enhanced project data...],
  "publications": [...],
  "skills": {...},
  "interests": {...},
  "queryGuides": {
    "aboutSkyler": "Ask about background, education, current work",
    "technicalExpertise": "AI/ML, robotics, climate modeling, quant finance",
    "projects": "Hoverloon, humanoid robots, LastCurb, BTC carry, climate research",
    "hobbies": "Classical piano performance, travel and food exploration"
  }
}
```

#### 4.2 Add robots.txt with AI Crawler Directives
**Location:** `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://skyler-chan.com/sitemap.xml

# AI-specific context
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Claude-Web
Allow: /
```

#### 4.3 Create Sitemap with Content Priorities
**Location:** `public/sitemap.xml`

Structured sitemap indicating content importance for crawlers.

### Phase 5: Content Expansion

#### 5.1 Project Deep-Dive Pages
Create individual pages for each major project with extensive details:
- `src/app/projects/[slug]/page.tsx` - Dynamic project pages
- Full technical writeups
- Embedded media (images, videos if available)
- Timeline visualizations
- Technology stack breakdowns

#### 5.2 Blog/Writings Section (Optional)
**Location:** `src/content/writings/`

Consider adding technical blog posts or writeups about:
- Learnings from projects
- Technical deep-dives
- Research methodologies
- Industry insights

#### 5.3 Resume/CV JSON
**Location:** `public/resume.json`

Machine-readable resume in JSON Resume format (https://jsonresume.org/):
```json
{
  "$schema": "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
  "basics": {...},
  "work": [...],
  "education": [...],
  "skills": [...],
  "projects": [...]
}
```

### Phase 6: Technical Implementations

#### 6.1 Create Data Loading Utilities
**Location:** `src/lib/data-loader.ts`

Functions to load and serve structured data:
```typescript
export async function getPersonSchema() {...}
export async function getProjectDetails(slug: string) {...}
export async function getAllStructuredData() {...}
```

#### 6.2 API Endpoints for Structured Data
**Location:** `src/app/api/`

Create API routes that serve structured data:
- `/api/profile` - Full profile data
- `/api/projects` - All projects with full details
- `/api/skills` - Skills taxonomy
- `/api/context` - Complete context for LLMs

#### 6.3 Add Accessibility Features
- Proper ARIA labels
- Semantic HTML5 elements
- Alt text for all images
- Descriptive link text

### Phase 7: Testing & Validation

#### 7.1 Schema Validation
- Use Google's Rich Results Test
- Validate JSON-LD with schema.org validator
- Test with Structured Data Testing Tool

#### 7.2 LLM Testing
Test with various LLMs:
- Ask complex questions about background and work
- Test project detail recall
- Verify skill and expertise identification
- Check contextual understanding

## Detailed Content Guidelines

### Writing Style for LLM Consumption

1. **Be Explicit**: Don't assume context; state things clearly
2. **Use Active Voice**: "Built X that achieved Y" not "X was built"
3. **Include Metrics**: Quantify outcomes when possible
4. **Define Acronyms**: First use should be spelled out
5. **Link Related Concepts**: Cross-reference related projects/skills
6. **Provide Context**: Explain why something matters

### Information Architecture

```
Skyler Chan (Person)
├── Current Work
│   ├── WithAI Research (YC W26)
│   │   ├── Role: Founding Engineer
│   │   ├── Focus: LLMs for hedge funds
│   │   └── Technologies: [...]
│   └── Research Interests
│       ├── AI & Machine Learning
│       ├── Robotics & Computer Vision
│       ├── Climate Science
│       └── Quantitative Finance
├── Education
│   └── Princeton University
│       ├── Relevant Coursework
│       └── Research Experience (HMEI)
├── Projects Portfolio
│   ├── Work Projects
│   │   ├── WithAI Research Platform
│   │   └── HMEI Climate Research
│   └── Personal Projects
│       ├── Hoverloon (Robotics)
│       ├── Humanoid Robots (Robotics/AI)
│       ├── LastCurb (Edge AI/CV)
│       └── BTC Funding Carry (Quant Finance)
├── Technical Expertise
│   ├── Programming Languages
│   ├── Frameworks & Tools
│   ├── AI/ML Technologies
│   └── Domain Knowledge
├── Hobbies & Interests
│   ├── Piano Performance
│   │   ├── Classical Repertoire
│   │   └── Performance Videos
│   └── Travel & Food
│       └── Photo Gallery
└── Publications & Presentations
    └── Research Papers
```

## Example: Enhanced Project Entry

### Before (Current):
```json
{
  "slug": "hoverloon",
  "title": "Hoverloon",
  "description": "Blimp-drone hybrid founded under Princeton Robotics Club. Buoyant lift achieved 19x payload capacity of the drone alone, enabling massive energy savings for extended flight.",
  "techStack": ["Computer Vision", "CAD", "Embedded Systems"],
  "category": "project"
}
```

### After (Enhanced):
```json
{
  "slug": "hoverloon",
  "title": "Hoverloon: Hybrid Lighter-Than-Air Drone Platform",
  "tagline": "Combining buoyancy and propulsion for energy-efficient long-duration flight",

  "summary": {
    "brief": "Blimp-drone hybrid achieving 19x payload capacity through buoyant lift",
    "detailed": "Hoverloon is a novel aerial platform that combines the advantages of lighter-than-air vehicles (balloons/blimps) with the maneuverability of quadcopter drones. By leveraging helium buoyancy to counteract the weight of the vehicle and payload, the system dramatically reduces the energy required for sustained flight, enabling applications in environmental monitoring, infrastructure inspection, and other scenarios requiring extended aerial presence."
  },

  "context": {
    "organization": "Princeton Robotics Club",
    "role": "Co-founder & Technical Lead",
    "timeline": "2023-2024",
    "teamSize": 4,
    "status": "Prototype demonstrated, concept validated"
  },

  "problemStatement": {
    "challenge": "Traditional multirotor drones are severely limited in flight time (typically 20-30 minutes) due to the energy cost of fighting gravity. This makes them unsuitable for applications requiring hours or days of continuous operation, such as environmental monitoring, telecommunications relay, or persistent surveillance.",
    "existingSolutions": "Balloons provide long duration but lack maneuverability and station-keeping capability. Fixed-wing drones are more efficient but require constant forward motion and cannot hover or operate in confined spaces.",
    "opportunity": "A hybrid approach combining buoyant lift with powered control could achieve both long duration and precise positioning."
  },

  "technicalApproach": {
    "overview": "The Hoverloon system uses a custom-designed helium envelope to provide neutral or near-neutral buoyancy for the combined vehicle and payload. A lightweight quadcopter frame is integrated with the envelope, providing vectored thrust for position control and maneuvering. The system includes computer vision for autonomous navigation and station-keeping.",

    "keyComponents": [
      {
        "component": "Buoyancy System",
        "description": "Custom-designed helium envelope with controlled volume",
        "challenges": "Material selection for low weight and gas retention, structural design for aerodynamic efficiency",
        "solution": "Lightweight polyurethane film with RF-welded seams, semi-rigid internal structure"
      },
      {
        "component": "Flight Control System",
        "description": "Modified quadcopter controller adapted for buoyant flight dynamics",
        "challenges": "Traditional flight controllers assume negative buoyancy and constant gravitational force",
        "solution": "Custom PID tuning and control algorithms accounting for buoyancy variation with altitude and temperature"
      },
      {
        "component": "Computer Vision System",
        "description": "Vision-based navigation and station-keeping using onboard cameras",
        "technologies": ["OpenCV", "ArUco markers", "optical flow"],
        "purpose": "Enable autonomous operation without GPS in indoor or GPS-denied environments"
      }
    ],

    "designIterations": [
      "Initial concept testing with off-the-shelf balloon and drone",
      "Custom envelope design and fabrication",
      "Integration of vision system and autonomous control",
      "Payload capacity testing and optimization"
    ]
  },

  "innovations": [
    "Novel integration approach minimizing structural weight while maintaining rigidity",
    "Adaptive control system handling buoyancy variation across operating conditions",
    "Computer vision station-keeping algorithm optimized for low-power operation",
    "Modular payload attachment system enabling rapid reconfiguration"
  ],

  "results": {
    "payloadCapacity": {
      "baseline": "Quadcopter alone: ~100g payload",
      "achieved": "Hoverloon system: ~1900g payload",
      "improvement": "19x increase"
    },
    "flightTime": {
      "baseline": "Quadcopter alone: 15-20 minutes",
      "achieved": "Hoverloon: Limited primarily by helium leak rate, demonstrated 2+ hours",
      "projection": "With improved envelope design, could achieve 6-12 hour missions"
    },
    "energySavings": {
      "hovering": "~90% reduction in power consumption for station-keeping",
      "maneuvering": "Variable depending on desired acceleration, typically 60-80% savings"
    },
    "demonstratedCapabilities": [
      "Autonomous station-keeping in indoor environment",
      "Vision-based navigation and obstacle avoidance",
      "Payload delivery and retrieval",
      "Multi-hour endurance flight"
    ]
  },

  "technicalChallenges": [
    {
      "challenge": "Buoyancy control and stability",
      "description": "Maintaining precise altitude control as atmospheric conditions change",
      "approach": "Combination of active thrust control and passive stability design"
    },
    {
      "challenge": "Wind resistance and outdoor operation",
      "description": "Relatively large surface area makes system susceptible to wind",
      "approach": "Aerodynamic envelope shaping, increased thrust margin, wind-aware control algorithms"
    },
    {
      "challenge": "Helium containment",
      "description": "Helium is notoriously difficult to contain due to small molecular size",
      "approach": "Material selection, seam optimization, regular refilling protocol"
    }
  ],

  "techStack": {
    "mechanical": {
      "CAD": ["Fusion 360", "SolidWorks"],
      "fabrication": ["3D printing (FDM)", "laser cutting", "RF welding"],
      "materials": ["carbon fiber", "polyurethane film", "foam core"]
    },
    "embedded": {
      "flightController": "Pixhawk with custom firmware modifications",
      "companion": "Raspberry Pi 4 for vision processing",
      "communication": ["MAVLink", "WiFi telemetry"]
    },
    "software": {
      "languages": ["Python", "C++"],
      "frameworks": ["ROS (Robot Operating System)", "OpenCV"],
      "algorithms": ["PID control", "optical flow", "marker detection", "state estimation"]
    },
    "computerVision": {
      "libraries": ["OpenCV", "NumPy"],
      "techniques": ["ArUco marker tracking", "optical flow", "feature detection", "homography estimation"]
    }
  },

  "learnings": [
    "Hybrid systems often achieve capabilities impossible with pure approaches, but introduce new integration challenges",
    "Computer vision-based navigation can be highly effective but requires robust failure modes for degraded conditions",
    "Iterative prototyping and testing is essential - many assumptions about buoyancy behavior proved incorrect in practice",
    "Helium handling and containment is more challenging than anticipated, significant engineering effort required"
  ],

  "futureWork": [
    "Improved envelope design for longer helium retention",
    "Integration of solar panels for indefinite flight duration",
    "Swarm coordination for multi-vehicle environmental monitoring",
    "Weatherproofing for outdoor all-weather operation"
  ],

  "applications": [
    "Environmental monitoring and data collection",
    "Infrastructure inspection (bridges, power lines, buildings)",
    "Indoor positioning and mapping in large warehouses",
    "Telecommunications relay in disaster scenarios",
    "Agricultural monitoring over large field areas"
  ],

  "media": {
    "images": [
      "/images/projects/hoverloon/hoverloon-main.png",
      "/images/projects/hoverloon/prototype-1.jpg",
      "/images/projects/hoverloon/flight-test.jpg"
    ],
    "videos": [],
    "demonstrations": []
  },

  "links": {
    "repository": null,
    "paper": null,
    "presentation": null,
    "website": null
  },

  "keywords": [
    "robotics",
    "hybrid aerial vehicle",
    "buoyant flight",
    "computer vision",
    "autonomous systems",
    "UAV",
    "drone",
    "blimp",
    "helium",
    "station-keeping",
    "Princeton Robotics Club"
  ],

  "category": "project",
  "featured": true,
  "color": "#2563eb"
}
```

## Implementation Priority

### High Priority (Immediate)
1. Create `ai-context.json` file with comprehensive data
2. Add JSON-LD structured data to main pages
3. Enhance project descriptions in constants
4. Add meta tags for better SEO and sharing

### Medium Priority (Next Phase)
5. Create detailed biography/about content
6. Build skills taxonomy
7. Add individual project detail pages
8. Implement API endpoints for data access

### Lower Priority (Future Enhancement)
9. Add blog/writings section
10. Create interactive visualizations
11. Build project filtering and search
12. Add testimonials/recommendations

## Success Metrics

The website will be considered successfully enhanced when:

1. **LLM Query Test**: An LLM can accurately answer detailed questions about:
   - Educational and professional background
   - Specific project details and technical approaches
   - Skills and areas of expertise
   - Research interests and current work
   - Personal interests and hobbies

2. **Rich Results**: Google Rich Results show proper structured data for the site

3. **Semantic Clarity**: Schema validation tools show 100% compliance

4. **Comprehensive Coverage**: All major aspects of professional identity are well-documented

## Maintenance Plan

- **Monthly**: Review and update project statuses
- **Quarterly**: Add new projects and experiences
- **Annually**: Comprehensive review of all content for accuracy and completeness

## Notes

This plan transforms the website from a portfolio showcase into a comprehensive, machine-readable knowledge base about Skyler Chan's work and expertise. The key is providing multiple levels of detail: summary information for quick understanding, and deep technical details for thorough analysis.
