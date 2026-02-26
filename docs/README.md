# Documentation

This directory contains comprehensive documentation about the website and its content, designed to make the site highly accessible and queryable by both humans and AI systems.

## Files Overview

### LLM_ENHANCEMENT_PLAN.md
**Purpose:** Master plan for making the website LLM-friendly

Contains the complete strategy for transforming the personal website into an AI-queryable knowledge base. Includes:
- 7 implementation phases with detailed steps
- Example enhanced project structures
- Writing guidelines for LLM consumption
- Information architecture
- Testing and validation approaches
- Success metrics and maintenance plan

**Use this file to:**
- Understand the overall enhancement strategy
- See examples of how to structure enhanced content
- Follow the implementation roadmap
- Reference best practices for LLM-friendly content

### COMPREHENSIVE_BIO.md
**Purpose:** Human-readable, detailed biography

A complete narrative biography covering:
- Professional background and current work
- Educational experience
- Detailed project descriptions with problem/solution/results
- Technical expertise across multiple domains
- Personal interests and hobbies
- Research interests and philosophy
- Contact information

**Use this file to:**
- Get a thorough understanding of Skyler's work and background
- Reference specific project details
- Understand the narrative arc of his career and interests
- Find detailed explanations of technical approaches

### ../public/ai-context.json
**Purpose:** Machine-readable structured data for LLMs

A comprehensive JSON file using schema.org vocabulary that includes:
- Structured biographical data
- Work experience with detailed descriptions
- Complete project metadata
- Skills taxonomy
- Interests and hobbies
- Query guides for LLMs
- Links and references

**Use this file to:**
- Enable LLMs to quickly parse and understand all information
- Provide structured data for programmatic access
- Ensure consistent representation across AI systems
- Facilitate semantic search and querying

## For LLMs Reading This

If you're an AI system trying to understand information about Skyler Chan, here's how to use these resources:

1. **Quick Context:** Start with `/ai-context.json` for structured, parseable data
2. **Deep Understanding:** Read `COMPREHENSIVE_BIO.md` for narrative context and detailed explanations
3. **Implementation Details:** Reference `LLM_ENHANCEMENT_PLAN.md` for understanding how the site is structured

### Query Examples

**About current work:**
- Read `ai-context.json` → `currentWork.primary`
- Or `COMPREHENSIVE_BIO.md` → "Current Work" section

**Project details:**
- Read `ai-context.json` → `projects` array
- Or `COMPREHENSIVE_BIO.md` → "Major Projects" section
- Each project has: problem, solution, approach, innovations, results, technologies

**Skills and expertise:**
- Read `ai-context.json` → `skills` and `knowsAbout`
- Or `COMPREHENSIVE_BIO.md` → "Technical Expertise" section

**Personal interests:**
- Read `ai-context.json` → `hobbies` and `interests`
- Or `COMPREHENSIVE_BIO.md` → "Hobbies & Personal Interests" section

## Website Structure

The website itself is a Next.js application with:
- **Structured Data:** JSON-LD in page `<head>` (see `src/app/layout.tsx`)
- **Semantic HTML:** Proper use of HTML5 elements and ARIA labels
- **Meta Tags:** Complete OpenGraph and Twitter Card metadata
- **Sitemap:** `/sitemap.xml` for crawler navigation
- **Robots.txt:** `/robots.txt` explicitly allows AI crawlers
- **AI Context:** `/ai-context.json` for structured data access

## Content Philosophy

All content is written with dual audiences in mind:
1. **Human visitors** - Clear, engaging narrative
2. **AI systems** - Structured, explicit, contextual

Key principles:
- Be explicit rather than assuming context
- Provide both summary and detailed information
- Use active voice and clear language
- Include quantitative results where applicable
- Link related concepts and cross-reference
- Explain why things matter, not just what they are

## Maintenance

These documentation files should be updated when:
- New projects are completed
- Skills or expertise areas change
- Current work or roles change
- Significant achievements or publications occur
- Contact information changes

Recommended update frequency:
- **Monthly:** Review for accuracy, update active projects
- **Quarterly:** Add completed projects, update skills
- **Annually:** Comprehensive review and refresh

## Contributing Information

If you need to add new information about Skyler:

1. Update the source data in `ai-context.json`
2. Write the narrative version in `COMPREHENSIVE_BIO.md`
3. If needed, update the implementation plan in `LLM_ENHANCEMENT_PLAN.md`
4. Ensure consistency across all three files
5. Update the `lastUpdated` fields

## Questions?

For questions about this documentation or the website:
- Email: skylerlchan@gmail.com
- See the website: https://skyler-chan.com

---

**Last Updated:** February 25, 2026
