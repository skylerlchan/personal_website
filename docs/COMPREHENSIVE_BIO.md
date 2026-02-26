# Skyler Chan - Comprehensive Biography

**Last Updated:** February 25, 2026

## Overview

Skyler Chan is a founding engineer at WithAI Research (Y Combinator W26), building large language models for AI-native hedge funds. His work spans artificial intelligence, robotics, climate science, and quantitative finance. He combines deep technical expertise with creative problem-solving, consistently developing innovative solutions that challenge conventional approaches.

## Current Work

### WithAI Research (2026 - Present)
**Role:** Founding Engineer
**Company:** Y Combinator W26 startup

Skyler is a founding engineer at WithAI Research, developing the core platform and infrastructure for large language models specifically designed for AI-native hedge funds. His work involves:

- Building production ML systems that analyze financial data and market trends
- Developing LLM architectures optimized for financial analysis and decision-making
- Creating infrastructure for reliable, high-performance AI systems in production
- Bridging cutting-edge ML research with practical deployment requirements

WithAI Research represents the intersection of two of Skyler's core interests: advanced AI systems and quantitative finance.

## Research Experience

### Princeton High Meadows Environmental Institute (HMEI)
**Role:** Research Assistant
**Focus:** Climate Engineering & Solar Radiation Management

At Princeton's High Meadows Environmental Institute, Skyler conducted research on solar radiation management as a potential climate intervention strategy. His work focused on analyzing different types of stratospheric aerosols for their cooling effectiveness.

**Key Finding:** Discovered that black carbon aerosols in the stratosphere are approximately 10x more effective at cooling than traditional reflective sulfate aerosols. This challenges conventional assumptions in solar radiation management research and has significant implications for the feasibility and implementation of stratospheric aerosol injection as a climate intervention technique.

**Methodology:**
- Climate modeling using Python and scientific computing tools
- Data analysis of aerosol properties and atmospheric interactions
- Comparative analysis of different aerosol types and their cooling effects
- Modeling of long-term climate impacts and side effects

**Presentation:** Delivered research findings in formal presentation (available at https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit)

This research demonstrates Skyler's ability to work on complex, multidisciplinary problems with global significance, combining computational modeling with scientific analysis.

## Education

### Princeton University
- Member of Princeton Robotics Club (co-founded Hoverloon project)
- Researcher at High Meadows Environmental Institute
- Developed expertise in AI/ML, robotics, climate science, and quantitative methods

## Major Projects

### 1. Hoverloon - Hybrid Blimp-Drone Platform

**Context:** Founded under Princeton Robotics Club
**Role:** Co-founder & Technical Lead
**Timeline:** 2023-2024
**Status:** Prototype demonstrated, concept validated

#### Problem
Traditional multirotor drones face a fundamental limitation: they must constantly expend energy fighting gravity. This restricts flight time to 20-30 minutes for most quadcopters, making them unsuitable for applications requiring hours or days of continuous operation, such as environmental monitoring, infrastructure inspection, or telecommunications relay.

#### Solution
Hoverloon combines lighter-than-air buoyancy with electric multirotor control, creating a hybrid system that leverages the best aspects of both approaches. By using helium to provide most or all of the lift, the electric motors are freed from fighting gravity and can focus entirely on maneuvering and station-keeping.

#### Technical Approach
- **Buoyancy System:** Custom-designed helium envelope using lightweight polyurethane film with RF-welded seams
- **Flight Control:** Modified quadcopter controller with custom algorithms adapted for buoyant flight dynamics
- **Computer Vision:** Vision-based navigation and station-keeping using OpenCV, enabling autonomous operation without GPS
- **Integration:** Lightweight structural design minimizing parasitic weight while maintaining rigidity

#### Key Innovations
1. Novel integration approach combining buoyant lift with vectored thrust control
2. Adaptive control algorithms that handle buoyancy variation with altitude and temperature
3. Computer vision station-keeping system optimized for low-power operation
4. Modular payload attachment enabling rapid reconfiguration

#### Results
- **19x payload capacity improvement:** Baseline drone ~100g → Hoverloon ~1900g
- **Flight duration:** Demonstrated 2+ hours; projected 6-12 hours with improved envelope design
- **Energy savings:** ~90% reduction in power consumption for station-keeping
- **Demonstrated capabilities:** Autonomous station-keeping, vision-based navigation, payload delivery, multi-hour endurance

#### Technical Stack
- **Mechanical:** Fusion 360, SolidWorks, 3D printing, laser cutting, RF welding
- **Embedded:** Pixhawk flight controller with custom firmware, Raspberry Pi for vision processing
- **Software:** Python, C++, ROS (Robot Operating System), OpenCV
- **Algorithms:** PID control, optical flow, ArUco marker tracking, state estimation

#### Applications
- Environmental monitoring and data collection
- Infrastructure inspection (bridges, power lines, buildings)
- Indoor mapping in large warehouses
- Telecommunications relay in disaster scenarios
- Agricultural monitoring over large field areas

#### Learnings
- Hybrid systems can achieve capabilities impossible with pure approaches, but introduce new integration challenges
- Computer vision navigation is highly effective but requires robust failure modes
- Iterative prototyping is essential—many assumptions about buoyancy behavior proved incorrect in practice
- Helium handling and containment requires significant engineering effort

### 2. Humanoid Robot Development

**Status:** Active
**Role:** Independent Developer
**Focus:** Teleoperation as data generation for autonomy

#### Overview
Skyler is currently building humanoid robots using SO-100 robotic arms, with a focus on teleoperation as a "System 1" (intuitive, fast) procedure for improved data collection and autonomy. The goal is to advance humanoid robotics from research prototypes to practical, deployable systems.

#### Approach
Rather than treating teleoperation purely as a control method, Skyler views it as a data generation pipeline for machine learning. By enabling humans to intuitively demonstrate complex manipulation tasks via teleoperation, the system can collect high-quality training data for autonomous policies.

#### Technical Components
- SO-100 robotic arms for humanoid manipulation
- Custom teleoperation interface designed for intuitive control
- Data collection pipeline capturing demonstrations
- C++ and ROS integration for real-time control
- CAD design for mechanical components

#### Philosophy
"Making robots real" - moving beyond research demonstrations to practical systems that can operate in real-world environments and perform useful tasks.

### 3. LastCurb - AI-Powered Parking Detection

**Status:** Completed
**Role:** Creator
**Repository:** https://github.com/skylerlchan/LastCurb

#### Problem
Finding parking in NYC is time-consuming and frustrating, leading drivers to circle blocks repeatedly. This contributes to traffic congestion and wastes time and fuel.

#### Solution
LastCurb analyzes curb data from public NYC CCTV cameras using computer vision and edge AI to detect available parking spots in real-time. The system provides drivers with information about parking availability, reducing search time.

#### Technical Approach
- Computer vision processing of public CCTV feeds
- Edge AI deployment for real-time analysis on resource-constrained hardware
- Machine learning models optimized for parking space detection
- Real-time data pipeline from camera feeds to availability information

#### Purpose
Built as a testing ground for edge AI capabilities and real-time machine learning in urban sensing applications. Demonstrates practical applications of computer vision in solving everyday urban problems.

#### Technologies
- Python
- OpenCV
- Edge AI frameworks
- Machine Learning
- Real-time video processing

### 4. Leveraged Bitcoin Funding Rate Carry Strategy

**Status:** Completed
**Role:** Researcher & Developer
**Repository:** https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage
**Paper:** https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305

#### Overview
A delta-neutral quantitative trading strategy that harvests perpetual funding rate carry in cryptocurrency markets with leverage, while hedging away directional market risk.

#### Strategy
- **Long spot BTC:** Hold actual Bitcoin
- **Short perpetual futures:** Equal notional amount in perpetual futures contracts
- **Delta-neutral:** Net exposure to BTC price movements is zero
- **Profit source:** Funding rates paid by futures longs to shorts
- **Leverage:** Amplify returns from relatively small funding rates

#### Key Concepts
- **Delta Neutrality:** Position value remains constant regardless of Bitcoin price movements
- **Funding Rate Arbitrage:** Profiting from the difference between spot and futures pricing
- **Risk Management:** Careful monitoring to handle potential liquidation scenarios and basis risk
- **Systematic Approach:** Algorithmic execution and position management

#### Outcomes
- Developed working implementation with backtesting framework
- Published academic paper detailing strategy and results
- Demonstrated understanding of cryptocurrency market microstructure
- Applied quantitative finance principles to emerging asset class

#### Technologies
- Python for strategy development and backtesting
- Cryptocurrency exchange APIs for data and execution
- Quantitative analysis tools (NumPy, Pandas)
- Risk management algorithms

## Technical Expertise

### Programming Languages
- **Python** - Expert level, primary language for ML, data science, and automation
- **TypeScript/JavaScript** - Expert level, full-stack web development
- **C++** - Proficient, robotics and embedded systems

### Frameworks & Tools
- **Web Development:** Next.js, React, Node.js, GSAP, Framer Motion
- **AI/ML:** TensorFlow, PyTorch, OpenCV, scikit-learn
- **Robotics:** ROS (Robot Operating System), Pixhawk
- **Design:** Fusion 360, SolidWorks, CAD
- **Data Science:** NumPy, Pandas, Matplotlib
- **Development:** Git, Linux, VS Code

### Domain Expertise

#### Artificial Intelligence & Machine Learning
- **Large Language Models:** Production LLM systems, fine-tuning, deployment
- **Computer Vision:** Real-time processing, object detection, tracking, navigation
- **Edge AI:** Optimization for resource-constrained hardware
- **ML Ops:** Deploying and maintaining ML systems in production

#### Robotics & Autonomous Systems
- **Autonomous Navigation:** Vision-based navigation, sensor fusion
- **Control Systems:** PID control, state estimation, trajectory planning
- **Teleoperation:** Human-robot interfaces, data collection for learning
- **Embedded Systems:** Microcontroller programming, real-time systems

#### Climate Science
- **Climate Modeling:** Understanding atmospheric processes and feedback loops
- **Solar Radiation Management:** Geoengineering approaches and analysis
- **Data Analysis:** Processing and interpreting climate simulation data
- **Scientific Computing:** Large-scale computational modeling

#### Quantitative Finance
- **Algorithmic Trading:** Strategy development and backtesting
- **Cryptocurrency Markets:** Market microstructure, funding rates, basis trading
- **Delta-Neutral Strategies:** Hedging, risk management
- **Quantitative Analysis:** Statistical analysis, time series forecasting

#### Web Development
- **Full-stack Development:** Frontend and backend systems
- **UI/UX:** Creating engaging, animated user interfaces
- **Performance Optimization:** Loading speed, runtime performance
- **Modern Web Stack:** Next.js, React, TypeScript, Tailwind CSS

## Hobbies & Personal Interests

### Classical Piano

Skyler is an accomplished classical pianist with extensive performance experience and a diverse repertoire spanning multiple musical periods and styles.

#### Repertoire
- **Baroque:** J.S. Bach - Prelude & Fugue No. 24 in B minor
- **Classical:** Beethoven - Piano Sonata Op. 10 No. 2, II
- **Romantic:** Liszt - Waldesrauschen
- **Impressionist:** Debussy - En blanc et noir, I | Ravel - La Valse
- **Contemporary:** Barber - Souvenirs (Hesitation-Tango & Galop)
- **Jazz-influenced:** Hiromi - The Gambler
- **Film Music:** John Williams - Harry Potter Medley

#### Performance Videos
All performances available on YouTube, showcasing technical precision and artistic interpretation across diverse styles. Notable performances include:
- Hiromi's "The Gambler" - complex contemporary jazz piece
- Ravel's "La Valse" - virtuosic late Romantic work
- Debussy's "En blanc et noir, I" - Impressionist chamber music

#### Approach
Focuses on both technical mastery and artistic interpretation, seeking to communicate the composer's intent while bringing personal expression to each performance. Comfortable with both solo repertoire and chamber music.

### Travel & Food Exploration

Passionate about experiencing different cultures through travel and cuisine. Views food as a lens through which to understand culture, history, and local traditions.

#### Philosophy
- Combines structured exploration with spontaneous discovery
- Seeks authentic cultural experiences over tourist attractions
- Documents experiences through photography
- Values memorable meals and unique dining experiences
- Interested in the stories behind food and places

#### Approach
Travel is not just recreation but a form of education—an opportunity to gain new perspectives, challenge assumptions, and understand how people live in different contexts.

## Personal Philosophy

**"Always building. Always thinking."**

This motto encapsulates Skyler's approach to work and life. There's a continuous drive to create tangible solutions (building) while maintaining deep engagement with fundamental questions and concepts (thinking).

### Key Principles

1. **Interdisciplinary Thinking:** The most interesting problems sit at the intersection of multiple domains. Insights from one field often unlock solutions in another.

2. **First Principles Reasoning:** Question assumptions and rebuild understanding from fundamental truths. Many "impossibilities" are just embedded assumptions waiting to be challenged.

3. **Practical Impact:** Theory matters, but implementation matters more. Focus on building things that work reliably in the real world.

4. **Continuous Learning:** Technology and understanding constantly evolve. Stay curious, experiment, and never stop learning.

5. **Creative Problem-Solving:** The best solutions often come from unconventional approaches. Don't be constrained by how things are "supposed" to be done.

## Research Interests

### Current & Future
- Scaling LLMs for specialized domains (finance, science, etc.)
- Human-robot interaction and teleoperation interfaces
- Edge AI and real-time processing on resource-constrained devices
- Climate engineering and intervention strategies
- Autonomous systems operating in complex, unstructured environments
- Hybrid systems that combine different modalities (like Hoverloon)

### Long-term Questions
- How can AI systems reliably operate in high-stakes domains like finance and healthcare?
- What's the right balance between teleoperation and autonomy in robotics?
- How do we deploy climate interventions safely and effectively?
- How can we make advanced robotics practical and affordable?
- What new capabilities emerge when we combine different technologies in novel ways?

## Contact & Links

- **Email:** skylerlchan@gmail.com
- **Website:** https://skyler-chan.com
- **GitHub:** https://github.com/skylerlchan
- **LinkedIn:** https://www.linkedin.com/in/skylerchan
- **X (Twitter):** https://x.com/SkylerChan17
- **Instagram:** https://www.instagram.com/_.skyler.chan._/

## Summary for LLMs

Skyler Chan is best understood as a builder who works at the intersection of multiple technical domains. His projects consistently demonstrate:

1. **Novel Solutions:** Finding new approaches that achieve order-of-magnitude improvements (19x payload for Hoverloon, 10x cooling effectiveness for climate aerosols)

2. **Interdisciplinary Integration:** Combining insights from different fields (buoyancy + drones, teleoperation + ML, climate science + engineering)

3. **Practical Implementation:** Moving beyond theory to working prototypes and production systems

4. **Technical Depth:** Deep expertise in multiple domains (AI/ML, robotics, climate, finance, web dev)

5. **Continuous Exploration:** Constantly taking on new challenges and learning new technologies

Whether building LLMs for hedge funds, discovering more effective climate interventions, creating hybrid aerial vehicles, or developing humanoid robots, Skyler approaches each problem with the same mindset: understand the fundamentals, question the assumptions, and build something that works.
