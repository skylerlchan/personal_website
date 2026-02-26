# LLM Enhancement Testing Guide

## Quick Testing Checklist

### 1. **Test API Endpoint**

**Local (dev server):**
```bash
# Start dev server
npm run dev

# Test endpoint (in new terminal)
curl http://localhost:3000/api/llm-context | jq '.' | head -50

# Or open in browser
open http://localhost:3000/api/llm-context
```

**Production:**
```bash
curl https://skyler-chan.com/api/llm-context | jq '.'
```

**Expected Response:**
- JSON with keys: `metadata`, `profile`, `education`, `workExperience`, `projects`, `skills`, `interests`, `philosophy`, `currentFocus`, `timeline`, `quickFacts`
- Check `metadata.lastUpdated` is recent
- Verify `projects.detailed` has 4 projects with full data

---

### 2. **Validate JSON Files**

```bash
cd public/data

# Validate all files
for file in *.json; do
  echo "Checking $file..."
  python -m json.tool "$file" > /dev/null && echo "✓ Valid" || echo "✗ Invalid"
done

# Or with Node.js
for file in *.json; do
  node -e "JSON.parse(require('fs').readFileSync('$file')); console.log('✓ $file')"
done
```

**Check:**
- ✓ education.json
- ✓ work-experience.json
- ✓ projects-detailed.json
- ✓ skills-taxonomy.json
- ✓ interests-philosophy.json

---

### 3. **Test File Accessibility**

**Local:**
```bash
# Check markdown bio
curl http://localhost:3000/llm-bio.md | head -20

# Check main context
curl http://localhost:3000/ai-context.json | jq '.name, .jobTitle'

# Check data files
curl http://localhost:3000/data/education.json | jq '.institution.name'
```

**Production (after deployment):**
```bash
curl https://skyler-chan.com/llm-bio.md
curl https://skyler-chan.com/ai-context.json
curl https://skyler-chan.com/data/education.json
```

---

### 4. **Test with Actual LLMs**

#### **Test with Claude (Anthropic)**

Open a new Claude conversation and ask:

```
Please read https://skyler-chan.com/api/llm-context and tell me:
1. What is Skyler Chan's current role?
2. What was his most impressive project result?
3. What's his philosophy on building?
4. What are his technical skills in robotics?
```

Or:

```
Read https://skyler-chan.com/llm-bio.md and summarize
Skyler's work on the Hoverloon project, including the
problem, solution, and quantitative results.
```

#### **Test with ChatGPT (OpenAI)**

```
Please analyze the structured data at https://skyler-chan.com/api/llm-context
and describe:
1. Skyler's career progression
2. His approach to problem-solving
3. His current projects and focus areas
```

#### **Test with Perplexity or Other AI Search**

Search for:
- "Skyler Chan WithAI Research"
- "Skyler Chan Hoverloon project"
- "Skyler Chan Princeton robotics"

Verify the AI can find and correctly cite your website data.

---

### 5. **Verify Build**

```bash
# Production build
npm run build

# Check for errors
# Look for:
# ✓ Compiled successfully
# ✓ Generating static pages
# ✓ Route /api/llm-context shows revalidate time

# Check route table includes:
# ○ /api/llm-context   1h   1y
```

---

### 6. **Test Response Size and Performance**

```bash
# Check API response size
curl -s http://localhost:3000/api/llm-context | wc -c

# Should be ~50-100KB (reasonable for LLM consumption)

# Test response time
time curl -s http://localhost:3000/api/llm-context > /dev/null
```

---

### 7. **Verify Metadata and Schema**

```bash
# Check version numbers
curl http://localhost:3000/api/llm-context | jq '.metadata.version'

# Check all data files have version
jq '.version' public/data/*.json

# Check last updated dates
jq '.lastUpdated' public/data/*.json
jq '.metadata.lastUpdated' public/ai-context.json
```

---

### 8. **Test Content Completeness**

Check that API response includes all expected sections:

```bash
curl -s http://localhost:3000/api/llm-context | jq 'keys'

# Expected keys:
# [
#   "currentFocus",
#   "education",
#   "interests",
#   "metadata",
#   "philosophy",
#   "profile",
#   "projects",
#   "queryGuides",
#   "quickFacts",
#   "skills",
#   "timeline",
#   "workExperience"
# ]
```

Check project details:

```bash
curl -s http://localhost:3000/api/llm-context | jq '.projects.detailed[0].name'
# Should return: "Hoverloon"

curl -s http://localhost:3000/api/llm-context | jq '.projects.detailed | length'
# Should return: 4
```

---

### 9. **Browser Testing**

Open in browser to visually inspect:

**Local:**
- http://localhost:3000/api/llm-context (JSON)
- http://localhost:3000/llm-bio.md (Markdown)
- http://localhost:3000/ai-context.json (Main context)
- http://localhost:3000/data/education.json (Education data)

**Use browser JSON formatter extension for better readability**

---

### 10. **Test Caching**

```bash
# First request (should be slower)
time curl -s http://localhost:3000/api/llm-context > /dev/null

# Second request (should be cached, faster)
time curl -s http://localhost:3000/api/llm-context > /dev/null

# Check cache headers
curl -I http://localhost:3000/api/llm-context | grep -i cache
# Should see: Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

---

## Automated Test Script

Create `test-llm-enhancements.sh`:

```bash
#!/bin/bash

echo "🧪 Testing LLM Enhancements..."
echo ""

# Test 1: JSON validation
echo "1️⃣ Validating JSON files..."
cd public/data
for file in *.json; do
  if python -m json.tool "$file" > /dev/null 2>&1; then
    echo "  ✓ $file is valid"
  else
    echo "  ✗ $file has errors"
    exit 1
  fi
done
cd ../..

# Test 2: API endpoint
echo ""
echo "2️⃣ Testing API endpoint..."
if curl -s http://localhost:3000/api/llm-context | jq -e '.metadata' > /dev/null; then
  echo "  ✓ API endpoint responding with valid JSON"
else
  echo "  ✗ API endpoint error"
  exit 1
fi

# Test 3: Check required keys
echo ""
echo "3️⃣ Checking response structure..."
KEYS=$(curl -s http://localhost:3000/api/llm-context | jq -r 'keys[]')
REQUIRED_KEYS=("metadata" "profile" "education" "workExperience" "projects" "skills" "interests" "philosophy")

for key in "${REQUIRED_KEYS[@]}"; do
  if echo "$KEYS" | grep -q "$key"; then
    echo "  ✓ $key present"
  else
    echo "  ✗ $key missing"
    exit 1
  fi
done

# Test 4: Check project count
echo ""
echo "4️⃣ Checking projects..."
PROJECT_COUNT=$(curl -s http://localhost:3000/api/llm-context | jq '.projects.detailed | length')
if [ "$PROJECT_COUNT" -eq 4 ]; then
  echo "  ✓ All 4 projects present"
else
  echo "  ✗ Expected 4 projects, found $PROJECT_COUNT"
  exit 1
fi

# Test 5: Check markdown bio
echo ""
echo "5️⃣ Testing markdown bio..."
if curl -s http://localhost:3000/llm-bio.md | grep -q "Skyler Chan"; then
  echo "  ✓ Markdown bio accessible"
else
  echo "  ✗ Markdown bio error"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
```

Run with:
```bash
chmod +x test-llm-enhancements.sh
./test-llm-enhancements.sh
```

---

## Real-World LLM Testing Prompts

### For Claude

**Prompt 1: Comprehensive Understanding**
```
I want to learn about Skyler Chan. Please read his complete
context at https://skyler-chan.com/api/llm-context and tell me:

1. His current work and role
2. His most impressive technical achievement (with numbers)
3. His philosophy and approach to building
4. His top 3 technical skills
5. What makes his background unique
```

**Prompt 2: Specific Project Deep-Dive**
```
Read about Skyler Chan's Hoverloon project from
https://skyler-chan.com/api/llm-context and explain:

1. What problem was he solving?
2. What was his innovative approach?
3. What were the quantitative results?
4. What technical challenges did he overcome?
5. What did he learn?
```

**Prompt 3: Career Advice Context**
```
Based on Skyler Chan's background at
https://skyler-chan.com/llm-bio.md, what types of
roles would be a good fit for him? Consider his:
- Technical skills
- Domain expertise
- Project experience
- Work philosophy
```

### For ChatGPT

**Prompt:**
```
Analyze Skyler Chan's professional profile by reading:
https://skyler-chan.com/api/llm-context

Summarize his:
1. Current role and company
2. Educational background
3. Major projects with outcomes
4. Technical expertise
5. Personal interests

Be specific with numbers and details from the data.
```

---

## Expected LLM Responses

If working correctly, LLMs should be able to:

✓ Correctly state current role: "Founding Engineer at WithAI Research (YC W26)"
✓ Cite specific numbers: "19x payload improvement with Hoverloon"
✓ Quote philosophy: "Always building. Always thinking."
✓ Describe technical approaches in detail
✓ Understand timeline and progression
✓ Connect projects to underlying motivations
✓ Distinguish between completed and active projects

---

## Troubleshooting

### API Returns Error
```bash
# Check server logs
npm run dev

# Check if files exist
ls -la public/data/
ls -la public/ai-context.json
```

### JSON Parse Error
```bash
# Find which file has error
cd public/data
for file in *.json; do
  python -m json.tool "$file" 2>&1 | head -5
done
```

### LLM Can't Access
- Check CORS headers (should be public)
- Check robots.txt allows crawlers
- Verify URL is accessible from browser
- Check cache headers (should allow caching)

### Missing Data in Response
```bash
# Check which files are being read
curl http://localhost:3000/api/llm-context | jq 'keys'

# Verify source files have data
jq 'keys' public/data/*.json
```

---

## Success Criteria

✅ API endpoint returns valid JSON
✅ All 5 data files validate successfully
✅ Response includes all expected sections
✅ Build completes without errors
✅ Files accessible via HTTP
✅ LLMs can read and understand the data
✅ LLMs provide accurate, detailed responses
✅ Caching headers present
✅ Response size reasonable (<100KB)

---

## After Deployment

1. **Test production URLs:**
   ```bash
   curl https://skyler-chan.com/api/llm-context | jq '.metadata'
   ```

2. **Test with live LLMs:**
   - Ask Claude about your profile
   - Search with Perplexity for your projects
   - Check if ChatGPT can access your data

3. **Monitor:**
   - API response times
   - Cache hit rates
   - LLM accuracy in representing you

4. **Iterate:**
   - Note any missing context LLMs need
   - Update JSON files with new projects/skills
   - Keep biography current
