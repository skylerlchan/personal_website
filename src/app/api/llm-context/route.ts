import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const revalidate = 3600; // Revalidate every hour

/**
 * LLM Context API Endpoint
 *
 * This endpoint aggregates all structured data about Skyler Chan from various JSON files
 * and returns it in a unified format optimized for LLM consumption.
 *
 * Usage: GET /api/llm-context
 * Returns: Comprehensive JSON with profile, work, projects, education, skills, and interests
 */
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const publicDir = path.join(process.cwd(), 'public');

    // Read all data files
    const [
      aiContextRaw,
      educationRaw,
      workExperienceRaw,
      projectsDetailedRaw,
      skillsTaxonomyRaw,
      interestsPhilosophyRaw,
    ] = await Promise.all([
      fs.readFile(path.join(publicDir, 'ai-context.json'), 'utf-8'),
      fs.readFile(path.join(dataDir, 'education.json'), 'utf-8'),
      fs.readFile(path.join(dataDir, 'work-experience.json'), 'utf-8'),
      fs.readFile(path.join(dataDir, 'projects-detailed.json'), 'utf-8'),
      fs.readFile(path.join(dataDir, 'skills-taxonomy.json'), 'utf-8'),
      fs.readFile(path.join(dataDir, 'interests-philosophy.json'), 'utf-8'),
    ]);

    // Parse JSON files
    const aiContext = JSON.parse(aiContextRaw);
    const education = JSON.parse(educationRaw);
    const workExperience = JSON.parse(workExperienceRaw);
    const projectsDetailed = JSON.parse(projectsDetailedRaw);
    const skillsTaxonomy = JSON.parse(skillsTaxonomyRaw);
    const interestsPhilosophy = JSON.parse(interestsPhilosophyRaw);

    // Construct unified response
    const response = {
      // Metadata
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        source: 'https://skyler-chan.com',
        description: 'Comprehensive LLM-optimized context about Skyler Chan',
      },

      // Basic profile
      profile: {
        name: aiContext.name,
        givenName: aiContext.givenName,
        familyName: aiContext.familyName,
        email: aiContext.email,
        url: aiContext.url,
        tagline: 'Always building. Always thinking.',
        jobTitle: aiContext.jobTitle,
        currentWork: aiContext.worksFor,
        education: aiContext.alumniOf,
        location: 'Princeton, NJ',

        biography: aiContext.biography,

        social: {
          github: 'https://github.com/skylerlchan',
          linkedin: 'https://www.linkedin.com/in/skylerchan',
          twitter: 'https://x.com/SkylerChan17',
          instagram: 'https://www.instagram.com/_.skyler.chan._/',
          email: aiContext.email,
        },
      },

      // Education details
      education: {
        institution: education.institution,
        status: education.status,
        expectedGraduation: education.expectedGraduation,
        academicFocus: education.academicFocus,
        researchExperience: education.researchExperience,
        extracurriculars: education.extracurriculars,
        achievements: education.achievements,
        context: education.context,
      },

      // Work experience
      workExperience: {
        positions: workExperience.experiences,
        careerProgression: workExperience.careerProgression,
        workStyle: workExperience.workStyle,
      },

      // Projects with full detail
      projects: {
        detailed: projectsDetailed.projects,
        themes: projectsDetailed.projectThemes,

        // Quick summary for LLM reference
        summary: projectsDetailed.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          tagline: p.tagline,
          status: p.status,
          keyResult: p.results?.quantitative || p.results?.qualitative?.[0] || '',
        })),
      },

      // Skills and expertise
      skills: {
        technical: skillsTaxonomy.technicalSkills,
        soft: skillsTaxonomy.softSkills,
        learningApproach: skillsTaxonomy.learningApproach,
        strengths: skillsTaxonomy.strengthsAndGrowth,

        // Flat list for easy LLM parsing
        domains: [
          { domain: 'AI & Machine Learning', level: 'Expert', areas: ['LLMs', 'Computer Vision', 'Edge AI'] },
          { domain: 'Robotics', level: 'Advanced', areas: ['Autonomous Systems', 'Embedded Systems', 'Teleoperation'] },
          { domain: 'Climate Science', level: 'Intermediate-Advanced', areas: ['Climate Modeling', 'Data Science'] },
          { domain: 'Quantitative Finance', level: 'Intermediate-Advanced', areas: ['Algorithmic Trading', 'Risk Management'] },
          { domain: 'Web Development', level: 'Expert', areas: ['Full-stack', 'UI/UX', 'Animation'] },
        ],

        programmingLanguages: [
          { name: 'Python', level: 'Expert', years: '5+' },
          { name: 'TypeScript', level: 'Advanced', years: '3+' },
          { name: 'JavaScript', level: 'Advanced', years: '4+' },
          { name: 'C++', level: 'Intermediate-Advanced', years: '2+' },
        ],
      },

      // Interests and philosophy
      interests: {
        professional: interestsPhilosophy.professionalInterests,
        personal: interestsPhilosophy.personalInterests,
        creative: interestsPhilosophy.creativeOutlets,
        future: interestsPhilosophy.futureInterests,
      },

      // Philosophy and values
      philosophy: {
        motto: interestsPhilosophy.philosophy.motto,
        meaning: interestsPhilosophy.philosophy.meaningOfMotto,
        coreValues: interestsPhilosophy.philosophy.coreValues,
        approach: interestsPhilosophy.philosophy.approachToProblems,
        work: interestsPhilosophy.philosophy.workPhilosophy,
      },

      // Current focus (for LLM to understand what's happening now)
      currentFocus: {
        work: {
          organization: 'WithAI Research',
          role: 'Founding Engineer',
          focus: 'Building LLM infrastructure for AI-native hedge funds',
          technologies: ['LLMs', 'Next.js', 'Python', 'Production ML Systems'],
          since: '2026-01',
        },
        projects: [
          {
            name: 'Humanoid Robots',
            focus: 'Exploring teleoperation for robot learning',
            status: 'Active development',
          },
        ],
        learning: [
          'Production LLM engineering',
          'Financial AI applications',
          'Embodied AI and robot learning',
        ],
      },

      // Timeline for LLM to understand progression
      timeline: [
        { date: '2026-01', event: 'Joined WithAI Research as Founding Engineer', type: 'work' },
        { date: '2025', event: 'Started building humanoid robots', type: 'project' },
        { date: '2024-2025', event: 'Research at Princeton HMEI on climate science', type: 'research' },
        { date: '2024', event: 'Developed Hoverloon hybrid blimp-drone', type: 'project' },
        { date: '2024', event: 'Built LastCurb parking detection system', type: 'project' },
        { date: '2023-2024', event: 'Developed BTC funding carry trading strategy', type: 'project' },
      ],

      // Quick facts for LLM reference
      quickFacts: {
        currentRole: 'Founding Engineer at WithAI Research (YC W26)',
        education: 'Princeton University (Expected 2027)',
        location: 'Princeton, NJ',
        expertise: ['AI/ML', 'Robotics', 'Climate Science', 'Quantitative Finance', 'Full-stack Development'],
        notableAchievements: [
          '19x payload improvement with Hoverloon hybrid aerial vehicle',
          'Discovered 10x cooling effectiveness of black carbon aerosols (climate research)',
          'Published quant finance paper on BTC funding carry strategy',
          'Building LLM infrastructure for AI-native hedge funds',
        ],
        hobbies: ['Classical Piano', 'Travel', 'Food Exploration'],
        motto: 'Always building. Always thinking.',
      },

      // Query helpers for LLMs
      queryGuides: aiContext.queryGuides,
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error reading LLM context data:', error);
    return NextResponse.json(
      {
        error: 'Failed to load LLM context data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
