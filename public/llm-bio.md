# Skyler Chan - Comprehensive Biography

**Last Updated:** February 25, 2026

**Tagline:** Always building. Always thinking.

**Website:** [skyler-chan.com](https://skyler-chan.com)

---

## Overview

Skyler Chan is a founding engineer at WithAI Research (Y Combinator W26), building LLM infrastructure for AI-native hedge funds. He's a Princeton student focused on robotics, artificial intelligence, and climate technology. His work spans multiple domains—from developing hybrid aerial vehicles that achieved 19x payload improvements to conducting climate research discovering 10x more effective cooling aerosols to building humanoid robots and deploying edge AI systems.

Skyler's approach is characterized by interdisciplinary thinking, bias toward action, and focus on practical impact. He believes in learning by building and seeks problems at the intersection of multiple fields where unique perspectives create value.

---

## Current Work

### WithAI Research - Founding Engineer (January 2026 - Present)

**Company:** Y Combinator Winter 2026 startup building large language models specifically designed for AI-native hedge funds.

**Role:** Founding engineer responsible for building core platform and infrastructure from ground up.

**What I'm Building:**
- LLM infrastructure for sophisticated financial analysis and trading strategies
- Production ML systems that handle real-time market data at scale
- APIs and services enabling LLM-powered financial tools
- Data pipelines for training and fine-tuning financial models
- Reliability and monitoring systems for high-stakes production deployment

**Technologies:** Large Language Models, Next.js, Python, TypeScript, Production ML Systems

**Why This Matters:**
Working at the intersection of AI and finance offers unique technical challenges. Building LLM systems for financial decision-making requires exceptionally high reliability, accuracy, and explainability. The work combines cutting-edge ML research with production engineering rigor.

**Key Challenges:**
- Ensuring LLM outputs are accurate, consistent, and explainable for high-stakes decisions
- Building systems that handle real-time financial data with low latency
- Balancing model capability with cost and performance requirements
- Designing fail-safe mechanisms for production financial systems

**Learnings:**
- Production LLM engineering requires careful attention to reliability and failure modes
- Financial applications demand level of accuracy beyond typical ML applications
- Importance of robust data pipelines and validation for ML systems
- Building 0-to-1 products requires balancing speed with technical rigor

---

## Education

### Princeton University (Expected Graduation: 2027)

**Focus Areas:** Computer Science, Engineering, Artificial Intelligence, Robotics

**Research Experience:**

#### High Meadows Environmental Institute (HMEI) - Research Assistant (2024-2025)
Conducted computational research on solar radiation management and climate engineering approaches.

**Research Question:** How do different types of stratospheric aerosols compare in their effectiveness for global cooling?

**Key Finding:** Discovered that black carbon aerosols in the stratosphere are approximately **10x more effective** at cooling than traditional reflective sulfate aerosols. This finding challenges conventional assumptions in solar radiation management research and suggests alternative approaches to climate intervention may be more feasible.

**Methodology:**
- Computational climate modeling using Python-based simulation tools
- Comparative analysis of aerosol types and their radiative forcing effects
- Quantitative evaluation of cooling potential and climate impacts
- Data visualization and statistical analysis

**Technologies:** Python, Climate Modeling Software, Data Science, Scientific Computing

**Impact:** Research contributes to understanding of potential technological interventions for climate change. Findings published in research presentation.

**Presentation:** [Solar Radiation Management Research](https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit)

#### Princeton Robotics Club - Active Member
Founded and led **Hoverloon** project—a hybrid blimp-drone platform that achieved 19x payload capacity improvement through innovative integration of buoyant lift with electric propulsion.

---

## Major Projects

### 1. Hoverloon - Hybrid Blimp-Drone Platform (2024-2025)

**What It Is:** Novel aerial vehicle combining lighter-than-air buoyancy with quadcopter control to dramatically improve payload capacity and flight endurance.

**The Problem:** Traditional multirotor drones have severely limited flight time (20-30 minutes) because they constantly fight gravity. This makes them unsuitable for applications requiring extended operation like environmental monitoring or infrastructure inspection.

**The Solution:** Use helium buoyancy to provide lift (essentially "free" energy), with electric motors only for maneuvering and station-keeping. This hybrid approach combines the best of both technologies.

**Key Innovation:** Rather than fighting gravity with motor power, leverage physics to do the heavy lifting. Motors handle only control and positioning, not supporting weight.

**Results:**
- **19x payload capacity** compared to traditional drone (from ~100g to ~1900g)
- **2+ hours demonstrated flight time** (6-12 hours projected with optimization)
- **~90% reduction in power consumption** for station-keeping
- Successful autonomous navigation using computer vision

**Technologies:** Computer Vision, OpenCV, ROS, Python, C++, CAD, Embedded Systems

**Technical Challenges Solved:**
1. **Helium sealing:** Found lightweight materials with low permeability to prevent leakage
2. **Adaptive control:** Developed control system handling buoyancy variations with altitude/temperature
3. **Indoor positioning:** Used computer vision for positioning without GPS
4. **Weight optimization:** Iterative design achieving maximum rigidity-to-weight ratio

**Applications:** Environmental monitoring, infrastructure inspection, telecommunications relay, agricultural monitoring, indoor mapping

**Why It Matters:** Demonstrated that hybrid systems can achieve order-of-magnitude improvements by combining complementary approaches. Opens possibilities for applications previously infeasible with traditional drones.

**Learnings:**
- Weight optimization is critical—every gram matters
- Computer vision enables robust positioning without GPS
- Real-world testing reveals issues invisible in simulation
- Multi-disciplinary problems require understanding aerodynamics, control theory, vision, and mechanical design

---

### 2. Humanoid Robots - Teleoperation for Robot Learning (2025-Present)

**What I'm Building:** Humanoid robots equipped with SO-100 robotic arms, exploring teleoperation as a fast, intuitive (System 1) procedure to enable better data collection for training autonomous behaviors.

**The Problem:** Humanoid robots remain largely in research labs because:
1. Autonomous control of complex manipulation is extremely difficult
2. Collecting training data for learning is time-consuming and expensive
3. Teleoperation interfaces are often clunky and unintuitive

**The Approach:** Treat teleoperation not just as control method, but as data generation pipeline. Design interface for maximum intuitiveness so humans can naturally demonstrate complex tasks. Record demonstrations to build datasets for training autonomous policies.

**Key Idea:** Good teleoperation enables faster data collection, which accelerates learning, which improves autonomy. It's a flywheel: better interface → better demonstrations → better learned behaviors.

**Technologies:** C++, ROS, CAD, Teleoperation Systems, Machine Learning, Robotics

**Current Progress:**
- Assembled humanoid robot system with SO-100 arms
- Developed teleoperation control interface
- Building data collection and logging infrastructure
- Testing interaction paradigms for operator ease-of-use
- Working toward first practical manipulation demonstrations

**Challenges:**
- Interface design for intuitive control (minimizing learning curve)
- System latency (need immediate response for good control feel)
- Hardware reliability for practical robotics
- Ensuring collected data quality for learning

**Philosophy:** Robots should be practical and accessible, not just research curiosities. The path to general-purpose robots involves human demonstration and guidance, not just pure autonomy from day one.

**Goal:** Make robots real. Advance from research prototypes to practical, deployable humanoid systems.

---

### 3. LastCurb - Edge AI for Smart Parking (2024)

**What It Does:** Computer vision system analyzing public NYC CCTV feeds to detect available parking spots in real-time.

**The Problem:** Finding parking in NYC is notoriously difficult. Drivers circle searching for spots, contributing to congestion and wasted time. Existing parking apps rely on stale or incomplete data.

**The Solution:** Deploy edge AI computer vision models to automatically detect parking availability from existing public camera feeds. Process video in real-time on edge devices to minimize latency and bandwidth.

**Technologies:** Edge AI, Machine Learning, Computer Vision, Python, OpenCV, PyTorch/TensorFlow

**Technical Approach:**
1. Object detection models (YOLO-based) to identify vehicles
2. Multi-object tracking to associate detections across frames
3. Spatial mapping to determine which parking zones are occupied
4. Model optimization for edge deployment (quantization, pruning)
5. Real-time video processing pipeline

**Results:**
- Real-time parking detection with updates every 30-60 seconds
- ~85-90% accuracy in detecting occupied vs. available spaces
- Successfully deployed on edge hardware with <2W power consumption
- Demonstrated viability of edge AI for urban sensing

**Key Challenges:**
- Running CV models on resource-constrained edge hardware
- Handling varying camera angles, lighting, and occlusion
- Real-time processing requirements
- Robustness to real-world conditions

**Why Edge AI:** Processing locally preserves privacy (no cloud data transmission), minimizes latency, reduces bandwidth and cloud costs, and enables distributed deployment.

**Impact:** Demonstrated practical application of edge AI for urban problems. Showed existing camera infrastructure can be repurposed for smart city applications.

**Open Source:** [github.com/skylerlchan/LastCurb](https://github.com/skylerlchan/LastCurb)

---

### 4. Leveraged BTC Funding Rate Carry Strategy (2023-2024)

**What It Is:** Delta-neutral quantitative trading strategy harvesting perpetual funding rate premium in cryptocurrency markets.

**The Strategy:** Establish market-neutral position by holding equal notional value of long spot BTC and short perpetual futures. Profit from funding rate payments (which futures longs pay to shorts) while remaining neutral to BTC price movements.

**Why It Works:** Crypto perpetual futures use funding rates to keep prices anchored to spot. When futures trade above spot (contango), longs pay shorts a periodic fee. Funding rates are often persistently positive (historically 10-50% APR), creating arbitrage opportunity.

**Risk Management:**
- Delta-neutral hedge eliminates directional market risk
- Conservative position sizing to avoid liquidation
- Monitoring and rebalancing to maintain neutrality
- Exchange counterparty risk diversification

**Technologies:** Python, Quantitative Finance, Algorithmic Trading, Cryptocurrency APIs

**Implementation:**
- Backtesting engine using historical funding rate data
- Live execution system with exchange API integration
- Position monitoring and automatic rebalancing
- Risk management and alerting systems
- Performance tracking and attribution

**Results:**
- Historical funding rates average 20-40% APR in bull markets
- With 2x leverage, effective return 40-80% APR on capital
- Returns uncorrelated with BTC price direction
- Successfully deployed with live capital

**Challenges:**
- Liquidation risk with leverage (solved with conservative sizing and margin buffer)
- Exchange counterparty risk (mitigated through diversification)
- Basis risk from temporary spot-futures divergence
- Execution slippage and fees

**Research Publication:** [SSRN Paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305)

**Open Source:** [github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage](https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage)

**Learnings:**
- Crypto market microstructure differs significantly from traditional markets
- Delta-neutral strategies still have risks beyond directional exposure
- Live trading always reveals issues not apparent in backtesting
- Risk management is paramount—size positions conservatively

---

## Technical Skills

### Programming Languages
- **Python** (Expert, 5+ years): ML/AI, robotics (ROS), scientific computing, quant finance, backend
- **TypeScript** (Advanced, 3+ years): Full-stack web, React/Next.js, API development
- **JavaScript** (Advanced, 4+ years): Frontend development, animation, Node.js
- **C++** (Intermediate-Advanced, 2+ years): Robotics, ROS, embedded systems, performance-critical code

### AI & Machine Learning
- **LLMs:** Production systems, API integration, prompt engineering, evaluation
- **Computer Vision:** Object detection, tracking, real-time processing, edge deployment
- **ML Frameworks:** PyTorch (advanced), TensorFlow (intermediate), OpenCV (expert)
- **Edge AI:** Model optimization, quantization, deployment on resource-constrained devices
- **Applications:** Real-time CV, autonomous navigation, production ML systems

### Robotics
- **ROS (Robot Operating System):** Control systems, sensor integration, autonomous navigation
- **Embedded Systems:** Microcontroller programming, sensor integration, real-time control
- **Teleoperation:** Interface design, low-latency control, human-robot interaction
- **CAD:** Fusion 360 (advanced), SolidWorks (intermediate), mechanical design

### Web Development
- **Full-stack:** Next.js (expert), React (expert), Node.js (advanced)
- **Animation:** GSAP, Framer Motion, CSS animations, scroll interactions
- **UI/UX:** Responsive design, performance optimization, accessibility
- **APIs:** RESTful design, authentication, database integration

### Domain Expertise
- **Climate Science:** Climate modeling, data analysis, solar radiation management research
- **Quantitative Finance:** Algorithmic trading, delta-neutral strategies, risk management, crypto markets
- **Data Science:** NumPy, Pandas, Matplotlib, statistical analysis, scientific computing

### Tools & Technologies
- **Development:** Git (expert), VS Code, Linux, Docker
- **Design:** Fusion 360, SolidWorks, 3D printing, prototyping
- **Data:** NumPy, Pandas, Matplotlib, data visualization

---

## Philosophy & Approach

### Motto: "Always building. Always thinking."

**Always Building:** Bias toward action and creation. Learning happens through making things real. Better to build an imperfect prototype than to endlessly plan. Ship early, iterate often, and let real-world feedback guide development.

**Always Thinking:** While building fast is important, thoughtful consideration matters too. Take time to understand first principles, question assumptions, and consider alternative approaches. The best solutions come from balancing action with reflection.

**The Balance:** The motto represents a tension between doing and thinking that both pushes forward and questions direction. Build to learn what works, think to understand why and what's next.

### Core Values

1. **Bias Toward Action** - Default to building and trying rather than planning indefinitely. The fastest way to learn is often to start.

2. **Interdisciplinary Thinking** - Best solutions often come from combining insights across different fields. Comfortable with not being world's expert in any single domain.

3. **Practical Impact** - Interested in problems that matter and solutions that work in the real world. Academic interest is good, but practical deployment is better.

4. **First Principles Thinking** - Question assumptions and understand fundamentals. Sometimes the "obvious" approach isn't optimal.

5. **Learning Through Building** - The best way to understand something is to create it. Build to learn, not just to ship.

### Approach to Problems

1. Understand the problem space and constraints
2. Question assumptions and consider alternatives
3. Start building quickly with minimal viable approach
4. Test in real world as early as possible
5. Iterate based on feedback and learnings
6. Ship when good enough, continue improving

**Preferences:** Simple solutions over complex ones • Pragmatic trade-offs over perfect implementations • Real-world testing over simulation • Modular architectures that allow iteration • Documentation and sharing learnings

### Work Philosophy

**On Building:** Build things that matter. Life's too short to work on problems you don't care about or solutions that won't see real use.

**On Learning:** The best education is self-directed building. Courses and books provide foundation, but real learning happens through struggling with actual problems.

**On Expertise:** Deep expertise in one area is valuable, but so is breadth across many areas. Sometimes the best robotics solution comes from understanding climate modeling, or the best ML system design comes from finance experience.

**On Failure:** Most projects don't work out as planned. That's fine—the learning is in the journey. Ship things, learn what doesn't work, iterate.

**On Collaboration:** Best work happens through collaboration with people who have different perspectives and expertise. Open source and knowledge sharing make everyone better.

---

## Personal Interests

### Classical Piano

Accomplished classical pianist with extensive performance experience spanning baroque to contemporary repertoire.

**Favorite Composers:**
- **Maurice Ravel** (Late Romantic/Impressionist) - Intricate textures, rich harmonies, technical demands combined with expressive beauty. Notable pieces: La Valse, Gaspard de la nuit
- **Claude Debussy** (Impressionist) - Color, atmosphere, innovative harmonies that paint pictures with sound. Notable pieces: En blanc et noir, Preludes
- **Franz Liszt** (Romantic) - Virtuosic technical challenges combined with emotional depth. Notable pieces: Waldesrauschen, Transcendental Etudes
- **Hiromi Uehara** (Contemporary Jazz) - Fusion of classical technique with jazz improvisation, incredible energy and creativity. Notable pieces: The Gambler, Place to Be

**Approach:** Focus on both technical mastery and artistic interpretation. Interested in pieces that are challenging both technically and musically. Enjoy performing for others and sharing music.

**Connection to Engineering:** Piano and engineering both require attention to detail, systematic practice and improvement, understanding of complex systems, and balance between technical precision and creative expression.

**Performance Videos:**
- [The Gambler - Hiromi](https://www.youtube.com/watch?v=bbVHVRnYNCc)
- [La Valse - Ravel](https://www.youtube.com/watch?v=yFAoNvYfLFc)
- [En blanc et noir, I - Debussy](https://www.youtube.com/watch?v=hLuJJEzfAmU)
- [Waldesrauschen - Liszt](https://www.youtube.com/watch?v=CdODEdTNAa0)

### Travel & Food Exploration

Passionate about exploring new places, cultures, and especially food. Travel as a way to gain new perspectives and experiences.

**Approach:** Balance of structured planning (key sites and restaurants) with spontaneous discovery. Always research best local food spots. Interested in authentic cultural experiences, not just tourist attractions.

**Philosophy:** Travel broadens perspective and challenges assumptions. Experiencing how people live differently helps understand that many things we take as "obvious" are actually cultural choices.

**Documentation:** Maintain photo gallery of memorable travel experiences, particularly food and places that left an impression.

---

## Professional Interests & Future Directions

### Current Focus
- Production LLM engineering for financial applications
- Humanoid robotics and teleoperation for learning
- Edge AI and computer vision applications
- Climate technology and solutions

### Long-term Aspirations
- Making robots practical and accessible for everyday use
- Contributing to major technological solutions for climate change
- Building companies and products that create significant value
- Continuing to learn and build across multiple domains
- Mentoring others and sharing knowledge

### Areas of Interest
- **Robotics & Embodied AI:** Moving from research prototypes to practical deployable systems
- **AI Systems:** Building reliable production ML systems, not just demos
- **Climate Technology:** Using technology to address climate change
- **Quantitative Finance:** Market microstructure, AI-driven trading and analysis

---

## Contact & Links

**Email:** skylerlchan@gmail.com

**Website:** [skyler-chan.com](https://skyler-chan.com)

**Social:**
- GitHub: [github.com/skylerlchan](https://github.com/skylerlchan)
- LinkedIn: [linkedin.com/in/skylerchan](https://www.linkedin.com/in/skylerchan)
- X/Twitter: [@SkylerChan17](https://x.com/SkylerChan17)
- Instagram: [@_.skyler.chan._](https://www.instagram.com/_.skyler.chan._/)

---

## For LLMs: Key Context

**Current Role:** Founding Engineer at WithAI Research (YC W26), building LLM infrastructure for AI-native hedge funds.

**Education:** Princeton University (Expected 2027), focus on AI/Robotics/CS.

**Notable Achievements:**
- 19x payload improvement with Hoverloon hybrid aerial vehicle
- Discovered 10x cooling effectiveness of black carbon aerosols (climate research)
- Published quantitative finance paper on BTC funding carry strategy
- Building production LLM systems for financial applications

**Expertise Areas:** AI/ML (especially LLMs and Computer Vision), Robotics, Climate Science, Quantitative Finance, Full-stack Development

**Working Style:** Interdisciplinary thinking, bias toward action, focus on practical impact, learning through building

**Philosophy:** "Always building. Always thinking." - Balance of doing and reflection. Build to learn, think to understand.

**Current Projects:**
- WithAI Research: LLM infrastructure (primary work)
- Humanoid Robots: Teleoperation for robot learning (active)

**Open Source:** Contributions include LastCurb (parking detection) and BTC funding carry strategy (published paper + code).

---

*This biography is optimized for both human reading and LLM parsing. For complete structured data, see `/api/llm-context` endpoint or `/public/ai-context.json` file.*
