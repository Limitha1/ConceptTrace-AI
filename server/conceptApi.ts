import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { CURATED_CONCEPTS, getCuratedConceptContent, generateStandardConceptContent } from '../src/lib/conceptLibraryData.ts';
import type { ConceptDetailContent, EducationBoard, ClassLevel, StudentStream } from '../src/types/index.ts';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseUrlParams(urlStr: string): Record<string, string> {
  try {
    const qIndex = urlStr.indexOf('?');
    if (qIndex === -1) return {};
    const search = urlStr.slice(qIndex + 1);
    const params = new URLSearchParams(search);
    const result: Record<string, string> = {};
    params.forEach((v, k) => {
      result[k] = v;
    });
    return result;
  } catch {
    return {};
  }
}

async function readRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body) resolve({});
        else resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getLiveEnv(initialEnv: Record<string, string>): Record<string, string> {
  const merged: Record<string, string> = { ...initialEnv, ...process.env as Record<string, string> };
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (val) {
            merged[key] = val;
          }
        }
      }
    }
  } catch {
    // fallback
  }
  return merged;
}

/**
 * Generates an in-depth, syllabus-grounded concept pack via Gemini REST API
 */
async function generateConceptViaGemini(params: {
  topicId: string;
  topicTitle: string;
  chapter: string;
  subject: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  stream?: StudentStream;
  academicYear?: string;
  subtopics?: string[];
  keyConcepts?: string[];
  apiKey: string;
  modelName: string;
}): Promise<ConceptDetailContent> {
  const {
    topicId,
    topicTitle,
    chapter,
    subject,
    board,
    classLevel,
    stream,
    academicYear = '2026-27',
    subtopics = [],
    keyConcepts = [],
    apiKey,
    modelName
  } = params;

  const prompt = `You are a distinguished master educator creating a comprehensive, rigorous, and student-friendly concept revision guide for ConceptTrace AI.
The student is studying:
- Education Board: ${board}
- Class Level: Class ${classLevel}
- Subject: ${subject}
- Chapter/Unit: ${chapter}
- Concept/Topic: ${topicTitle}
- Stream: ${stream || 'General'}
- Academic Year: ${academicYear}
${subtopics.length ? `- Subtopics: ${subtopics.join(', ')}` : ''}
${keyConcepts.length ? `- Key Concepts to address: ${keyConcepts.join(', ')}` : ''}

You MUST output ONLY a valid JSON object matching the exact structure below. No markdown backticks, no preamble.

{
  "id": "concept-${topicId}",
  "topicId": "${topicId}",
  "topicTitle": "${topicTitle}",
  "subject": "${subject}",
  "chapter": "${chapter}",
  "board": "${board}",
  "classLevel": "${classLevel}",
  "academicYear": "${academicYear}",
  "overview": {
    "simpleIntro": "A 2-3 sentence crystal-clear, student-friendly introduction explaining what this concept is and why it matters.",
    "learningObjectives": [
      "Objective 1 starting with an action verb",
      "Objective 2",
      "Objective 3"
    ],
    "prerequisites": [
      "Prerequisite concept 1",
      "Prerequisite concept 2"
    ],
    "estimatedReadingTimeMinutes": 7,
    "difficultyLevel": "Intermediate"
  },
  "sections": [
    {
      "heading": "1. Core Theoretical Foundations & Principles",
      "content": "Deep, structured explanation from first principles. Explain WHY it works, not just what it means. Avoid dense walls of text.",
      "formulaOrRule": "Primary mathematical equation, physical law, or standard rule",
      "keyTakeaway": "Single sentence high-impact takeaway"
    },
    {
      "heading": "2. Step-by-Step Mechanism & Mathematical Formulation",
      "content": "Clear derivation, variables definition, and conceptual links.",
      "formulaOrRule": "Secondary formula or transformation if applicable",
      "keyTakeaway": "Exam tip or golden rule"
    },
    {
      "heading": "3. Practical Applications & Real-World Context",
      "content": "Concrete applications, real-world examples, or laboratory observations.",
      "keyTakeaway": "Why this appears frequently in board exams"
    }
  ],
  "shortNotes": {
    "essentialDefinitions": [
      { "term": "Key Term 1", "definition": "Exact, exam-ready definition." },
      { "term": "Key Term 2", "definition": "Exact, exam-ready definition." }
    ],
    "keyFormulas": [
      {
        "name": "Formula Name",
        "formula": "F = ... or mathematical equation",
        "variables": [
          { "symbol": "x", "meaning": "Meaning of variable", "siUnit": "SI unit" }
        ],
        "notes": "Validity condition or constraint"
      }
    ],
    "coreLawsAndPrinciples": [
      {
        "name": "Governing Law / Principle",
        "statement": "Formal statement of the law.",
        "application": "Where it is applied."
      }
    ],
    "comparisonTables": [
      {
        "title": "Comparison / Distinction",
        "headers": ["Aspect", "Condition A", "Condition B"],
        "rows": [
          ["Row 1", "Value A1", "Value B1"],
          ["Row 2", "Value A2", "Value B2"]
        ]
      }
    ],
    "frequentlyConfusedPoints": [
      {
        "pointA": "Mistaken belief A",
        "pointB": "Accurate physical reality B",
        "clarification": "Why students mix these up and how to avoid it."
      }
    ],
    "vitalTakeaways": [
      "High-yield revision bullet 1",
      "High-yield revision bullet 2",
      "High-yield revision bullet 3"
    ]
  },
  "workedExamples": [
    {
      "id": "we-1",
      "question": "A typical, high-probability board exam numerical or analytical question.",
      "given": ["Parameter 1 = value", "Parameter 2 = value"],
      "methodOrFormula": "Formula to apply",
      "steps": [
        {
          "stepNumber": 1,
          "title": "Step 1 Title",
          "derivationOrCalc": "Calculation or mathematical substitution",
          "explanation": "Why we do this step"
        },
        {
          "stepNumber": 2,
          "title": "Step 2 Title",
          "derivationOrCalc": "Calculation or resolution",
          "explanation": "Result explanation"
        }
      ],
      "finalAnswer": "Explicit final answer with units.",
      "reasoningNotes": "Key mark-scoring advice for board exams."
    }
  ],
  "commonMistakes": [
    {
      "id": "cm-1",
      "misconception": "Common student misconception.",
      "whyIncorrect": "Physical/conceptual reason why this is incorrect.",
      "correctUnderstanding": "The correct scientific/mathematical understanding."
    },
    {
      "id": "cm-2",
      "misconception": "Common calculation or sign error.",
      "whyIncorrect": "Why it produces wrong results.",
      "correctUnderstanding": "What students should do instead."
    }
  ],
  "quickRevision": {
    "essentialTakeaways": [
      "Takeaway 1",
      "Takeaway 2",
      "Takeaway 3",
      "Takeaway 4",
      "Takeaway 5"
    ],
    "mustKnowFormulas": [
      "Formula 1",
      "Formula 2"
    ],
    "selfCheckQuestions": [
      "Self check question 1?",
      "Self check question 2?"
    ],
    "relatedConcepts": [
      { "name": "${chapter} Fundamentals", "linkTopicId": "${topicId}", "subject": "${subject}" }
    ]
  },
  "practiceQuestions": [
    {
      "id": "pq-1",
      "question": "Conceptual or numerical multiple-choice question.",
      "questionType": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "hint": "Helpful hint without giving away the answer.",
      "explanation": "Detailed explanation of why Option A is correct and others are incorrect.",
      "difficulty": "Foundational"
    },
    {
      "id": "pq-2",
      "question": "Application or higher-order question.",
      "questionType": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "hint": "Check the governing formula.",
      "explanation": "Detailed explanation.",
      "difficulty": "Medium"
    }
  ],
  "isAiGenerated": true,
  "isVerifiedContent": false,
  "sourceReferences": [
    "${board} Curriculum Standards Class ${classLevel} ${subject}",
    "NCERT / Board Prescribed Textbook for ${chapter}"
  ],
  "lastUpdated": "${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}"
}`;

  const candidateModels = Array.from(new Set([modelName, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'])).filter(Boolean);
  let lastError = '';

  for (const candidate of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`;
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 20000);

      const response = await fetch(endpoint, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Gemini (${candidate}) error: ${response.status} ${errText}`;
        console.warn(`[Concept API Warning]: ${lastError}`);
        continue;
      }

      const resJson = (await response.json()) as any;
      const textOutput = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        lastError = `Empty response from candidate ${candidate}`;
        continue;
      }

      // Parse JSON safely
      let cleaned = textOutput.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned) as ConceptDetailContent;
      // Ensure required properties exist
      if (parsed.overview && parsed.sections && parsed.shortNotes && parsed.practiceQuestions) {
        return parsed;
      }
    } catch (e: any) {
      lastError = e.message || String(e);
      console.warn(`[Concept API Exception with model ${candidate}]:`, e);
    }
  }

  throw new Error(`Failed to generate concept with AI: ${lastError}`);
}

/**
 * Handle Concept Library API endpoints:
 * - GET /api/concept/status
 * - POST /api/concept/detail
 * - GET /api/concept/detail
 */
export async function handleConceptApi(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>
): Promise<boolean> {
  const liveEnv = getLiveEnv(env);
  const url = req.url || '';

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return true;
  }

  // 1. GET /api/concept/status
  if (req.method === 'GET' && url.startsWith('/api/concept/status')) {
    const rawKey = liveEnv.GEMINI_API_KEY || liveEnv.VITE_GEMINI_API_KEY || '';
    const isConfigured = Boolean(rawKey && rawKey.trim().length > 10 && !rawKey.includes('your-gemini'));

    sendJson(res, 200, {
      status: 'online',
      aiConfigured: isConfigured,
      curatedConceptsCount: CURATED_CONCEPTS.length,
      activeModel: liveEnv.GEMINI_MODEL || 'gemini-3.8-flash',
      serverTime: new Date().toISOString()
    });
    return true;
  }

  // 2. GET or POST /api/concept/detail
  if ((req.method === 'GET' || req.method === 'POST') && url.startsWith('/api/concept/detail')) {
    try {
      let params: any = {};
      if (req.method === 'GET') {
        params = parseUrlParams(url);
      } else {
        params = await readRequestBody(req);
      }

      const { topicId, topicTitle, chapter, subject, board, classLevel, stream, academicYear, subtopics, keyConcepts } = params;

      if (!topicId && !topicTitle) {
        sendJson(res, 400, {
          success: false,
          error: 'MISSING_PARAMS',
          message: 'topicId or topicTitle is required.'
        });
        return true;
      }

      // Check if curated verified content exists
      const curated = getCuratedConceptContent(topicId || '');
      if (curated) {
        sendJson(res, 200, {
          success: true,
          data: curated,
          source: 'curated-official',
          isVerified: true
        });
        return true;
      }

      // If not curated, check if AI is available
      const rawKey = liveEnv.GEMINI_API_KEY || liveEnv.VITE_GEMINI_API_KEY || '';
      const isConfigured = Boolean(rawKey && rawKey.trim().length > 10 && !rawKey.includes('your-gemini'));

      if (isConfigured) {
        try {
          const aiGenerated = await generateConceptViaGemini({
            topicId: topicId || `top-${Date.now()}`,
            topicTitle: topicTitle || 'Concept Revision',
            chapter: chapter || 'Unit Overview',
            subject: subject || 'General',
            board: board || 'CBSE',
            classLevel: classLevel || '12',
            stream,
            academicYear,
            subtopics: Array.isArray(subtopics) ? subtopics : [],
            keyConcepts: Array.isArray(keyConcepts) ? keyConcepts : [],
            apiKey: rawKey,
            modelName: liveEnv.GEMINI_MODEL || 'gemini-3.8-flash'
          });

          sendJson(res, 200, {
            success: true,
            data: aiGenerated,
            source: 'gemini-ai',
            isVerified: false
          });
          return true;
        } catch (aiErr: any) {
          console.warn('[Concept API AI Fallback to Curriculum Template]:', aiErr.message);
        }
      }

      // Fallback: Curriculum-grounded template
      const fallbackContent = generateStandardConceptContent({
        topicId: topicId || 'concept-fallback',
        topicTitle: topicTitle || 'Concept Revision',
        chapter: chapter || 'Core Chapter',
        subject: subject || 'Subject',
        board,
        classLevel,
        stream,
        academicYear,
        subtopics: Array.isArray(subtopics) ? subtopics : [],
        keyConcepts: Array.isArray(keyConcepts) ? keyConcepts : []
      });

      sendJson(res, 200, {
        success: true,
        data: fallbackContent,
        source: 'curriculum-template',
        aiConfigured: isConfigured,
        isVerified: true,
        message: isConfigured 
          ? 'Generated structured curriculum template as AI fallback.' 
          : 'Google Gemini API key not configured. Displaying authentic curriculum-grounded template.'
      });
      return true;

    } catch (err: any) {
      console.error('[Concept Detail Error]:', err);
      sendJson(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: err.message || 'An error occurred while retrieving concept details.'
      });
      return true;
    }
  }

  return false;
}

/**
 * Vite plugin for Concept Library API
 */
export function conceptApiPlugin(env: Record<string, string>) {
  return {
    name: 'concepttrace-concept-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/concept')) {
          const handled = await handleConceptApi(req, res, env);
          if (handled) return;
        }
        next();
      });
    }
  };
}
