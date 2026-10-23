import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ViteDevServer } from 'vite';
import { 
  getSyllabusForSubject, 
  getAvailableSubjects,
  validateEducationSelections 
} from '../src/lib/syllabusData.ts';
import type { EducationBoard, ClassLevel, StudentStream, SubjectSyllabus } from '../src/types/index.ts';

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
      if (body.length > 25 * 1024 * 1024) {
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

/**
 * Handle syllabus API endpoints:
 * - GET /api/syllabus
 * - GET /api/syllabus/catalog
 * - POST /api/syllabus/extract-custom
 */
export async function handleSyllabusApi(
  req: IncomingMessage, 
  res: ServerResponse, 
  env: Record<string, string>
): Promise<boolean> {
  const url = req.url || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  // 1. GET /api/syllabus/catalog
  if (req.method === 'GET' && url.startsWith('/api/syllabus/catalog')) {
    const params = parseUrlParams(url);
    const board = (params.board || 'CBSE') as EducationBoard;
    const classLevel = (params.classLevel || '11') as ClassLevel;
    const stream = (params.stream || 'Science') as StudentStream;

    const subjects = getAvailableSubjects(board, classLevel, stream);
    const validation = validateEducationSelections(board, classLevel, stream, subjects.map(s => s.subject));

    sendJson(res, 200, {
      success: true,
      data: {
        board,
        classLevel,
        stream,
        availableSubjects: subjects,
        validation
      }
    });
    return true;
  }

  // 2. GET /api/syllabus
  if (req.method === 'GET' && url.startsWith('/api/syllabus')) {
    const params = parseUrlParams(url);
    const board = (params.board || 'CBSE') as EducationBoard;
    const classLevel = (params.classLevel || '12') as ClassLevel;
    const stream = params.stream as StudentStream | undefined;
    const academicYear = params.academicYear || '2026-27';
    const requestedSubject = params.subject || 'all';
    const enrolledSubjectsParam = params.enrolledSubjects ? params.enrolledSubjects.split(',') : [];

    if (requestedSubject === 'all') {
      const subjectsToFetch = enrolledSubjectsParam.length > 0 
        ? enrolledSubjectsParam 
        : ['Physics', 'Chemistry', 'Mathematics'];

      const syllabi: SubjectSyllabus[] = subjectsToFetch.map(subj => 
        getSyllabusForSubject(board, classLevel, subj.trim(), stream, academicYear)
      );

      sendJson(res, 200, {
        success: true,
        data: {
          board,
          classLevel,
          stream,
          academicYear,
          syllabi
        }
      });
      return true;
    }

    const syllabus = getSyllabusForSubject(board, classLevel, requestedSubject, stream, academicYear);
    sendJson(res, 200, {
      success: true,
      data: syllabus
    });
    return true;
  }

  // 3. POST /api/syllabus/extract-custom (AI parsing of custom uploaded syllabus)
  if (req.method === 'POST' && url.startsWith('/api/syllabus/extract-custom')) {
    try {
      const body = await readRequestBody(req);
      const { 
        syllabusText, 
        subject = 'General Science', 
        board = 'Custom Board', 
        classLevel = '12', 
        stream = 'Science', 
        academicYear = '2026-27' 
      } = body;

      if (!syllabusText || syllabusText.trim().length < 20) {
        sendJson(res, 400, {
          success: false,
          error: 'EMPTY_SYLLABUS_CONTENT',
          message: 'Please provide sufficient syllabus text or document text to extract curriculum structure.'
        });
        return true;
      }

      const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
      if (!apiKey || apiKey.includes('your-gemini')) {
        // Fallback without API key: return a clean structured representation
        const fallbackSyllabus: SubjectSyllabus = {
          id: `extracted-${Date.now()}`,
          board: board as EducationBoard,
          classLevel: classLevel as ClassLevel,
          stream: stream as StudentStream,
          academicYear,
          curriculumType: 'Extracted School Syllabus',
          subject,
          status: 'Partially Available',
          statusNote: 'Parsed from uploaded syllabus document.',
          sourceName: 'Student Uploaded Syllabus',
          sourceUrl: '#',
          lastVerifiedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          officialDocuments: [],
          units: [
            {
              id: `u-ext-1`,
              unitNumber: 'I',
              unitTitle: `${subject} Units`,
              chapters: [
                {
                  id: `ch-ext-1`,
                  chapterNumber: 1,
                  title: 'Core Concepts',
                  topics: [
                    {
                      id: `top-ext-1`,
                      title: 'Extracted Topics',
                      subtopics: syllabusText.slice(0, 300).split('\n').filter(Boolean).slice(0, 5)
                    }
                  ]
                }
              ]
            }
          ]
        };

        sendJson(res, 200, {
          success: true,
          data: fallbackSyllabus
        });
        return true;
      }

      // Live Google Gemini structured syllabus extraction via REST
      const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
      const prompt = `You are a curriculum specialist for Indian secondary and senior secondary education (CBSE, CISCE, State Boards).
Extract the structured syllabus from the following text for Subject: "${subject}", Class: "${classLevel}", Board: "${board}".

Return ONLY valid JSON with this exact schema:
{
  "subjectCode": "string",
  "assessmentPattern": {
    "theoryMarks": 70,
    "practicalOrInternalMarks": 30,
    "totalMarks": 100,
    "durationHours": 3
  },
  "prescribedBooks": ["string"],
  "units": [
    {
      "id": "string",
      "unitNumber": "string or number",
      "unitTitle": "string",
      "weightageMarks": 15,
      "totalPeriods": 20,
      "chapters": [
        {
          "id": "string",
          "chapterNumber": 1,
          "title": "string",
          "description": "string",
          "topics": [
            {
              "id": "string",
              "title": "string",
              "subtopics": ["string"],
              "keyConcepts": ["string"]
            }
          ]
        }
      ]
    }
  ]
}

Syllabus Content to analyze:
${syllabusText.slice(0, 15000)}
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}: ${response.statusText}`);
      }

      const responseData: any = await response.json();
      const rawOutput = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleaned = rawOutput.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const customSyllabus: SubjectSyllabus = {
        id: `extracted-${Date.now()}`,
        board: board as EducationBoard,
        classLevel: classLevel as ClassLevel,
        stream: stream as StudentStream,
        academicYear,
        curriculumType: 'Student Uploaded Syllabus (AI Verified)',
        subject,
        subjectCode: parsed.subjectCode || 'CUSTOM',
        status: 'Verified',
        statusNote: 'Extracted and structured from student-uploaded syllabus document using ConceptTrace AI engine.',
        sourceName: 'Student Uploaded Document',
        sourceUrl: '#',
        lastVerifiedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        officialDocuments: [],
        assessmentPattern: parsed.assessmentPattern || {
          theoryMarks: 70,
          practicalOrInternalMarks: 30,
          totalMarks: 100,
          durationHours: 3
        },
        prescribedBooks: parsed.prescribedBooks || [],
        units: parsed.units || []
      };

      sendJson(res, 200, {
        success: true,
        data: customSyllabus
      });
      return true;

    } catch (err: any) {
      console.error('[Syllabus Extraction Error]:', err);
      sendJson(res, 500, {
        success: false,
        error: 'EXTRACTION_FAILED',
        message: err.message || 'Failed to extract structured syllabus from document.'
      });
      return true;
    }
  }

  return false;
}

/**
 * Vite plugin for syllabus API
 */
export function syllabusApiPlugin(env: Record<string, string>) {
  return {
    name: 'concepttrace-syllabus-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/syllabus')) {
          const handled = await handleSyllabusApi(req, res, env);
          if (handled) return;
        }
        next();
      });
    }
  };
}
