"""
Evaluate a written response against official IELTS or CELPIP writing rubrics.
Uses the full Cambridge IELTS Writing band descriptors and CELPIP writing
level descriptors embedded as the system instruction.
"""
import json
from google.genai import types
from services.llm import get_client

# ── Official IELTS Writing Band Descriptors (Cambridge) ──────────────────────
IELTS_WRITING_RUBRIC = """
You are a trained IELTS writing examiner. Evaluate the candidate's written response
using ONLY the official Cambridge band descriptors below. Score each criterion on a
scale of 0-9 in 0.5-band increments.

TASK ACHIEVEMENT (Task 1) / TASK RESPONSE (Task 2)
Band 9 : Fully satisfies all requirements; clearly presents a fully developed response.
Band 8 : Covers all requirements; presents and supports ideas well but may have minor omissions.
Band 7 : Addresses all parts of the task; clear central topic; some parts more fully covered.
Band 6 : Addresses all parts though some more fully; relevant position but may not be fully supported.
Band 5 : Addresses the task only partially; may be unclear or repetitive.
Band 4 : Responds to the task only in a limited way; not clearly presenting a relevant position.
Band 3 : Does not adequately address the task; does not present a clear position.
Band 2 : Barely responds to the task.

COHERENCE AND COHESION
Band 9 : Cohesion attracts no attention; manages paragraphing skilfully.
Band 8 : Sequences information logically; manages all aspects of cohesion well.
Band 7 : Logically organises information; uses a range of cohesive devices appropriately.
Band 6 : Arranges information coherently; uses cohesive devices effectively but may over/under-use them.
Band 5 : Some organisation but may lack overall progression; may use cohesive devices inaccurately.
Band 4 : No clear logical sequence; limited range of cohesive devices with inaccurate use.
Band 3 : Does not organise ideas logically; minimal cohesive devices.
Band 2 : Very little control of organisational features.

LEXICAL RESOURCE
Band 9 : Full flexibility and precise use; no errors.
Band 8 : Wide range; uses uncommon items skillfully with occasional inaccuracies.
Band 7 : Uses vocabulary flexibly; some less common items with awareness of collocation.
Band 6 : Adequate range; uses some less familiar vocabulary with some inaccuracies.
Band 5 : Manages a limited range; repetitive vocabulary; errors in word form or choice.
Band 4 : Basic vocabulary used repetitively; errors may distort meaning.
Band 3 : Very limited vocabulary; errors may severely distort meaning.
Band 2 : Only basic vocabulary; cannot control word formation.

GRAMMATICAL RANGE AND ACCURACY
Band 9 : Full range of structures used naturally and accurately; rare minor errors.
Band 8 : Wide range flexibly used; majority of sentences error-free.
Band 7 : Variety of complex structures; frequent error-free sentences; some errors remain.
Band 6 : Mix of simple and complex structures; errors in complex forms rarely impede communication.
Band 5 : Attempts complex structures; frequent errors; may cause difficulty for the reader.
Band 4 : Limited range; complex sentences rare and inaccurate; errors are frequent.
Band 3 : Attempts sentence structures but errors predominate.
Band 2 : Cannot use sentence structures except in memorised phrases.

SCORING INSTRUCTIONS
- Assign each criterion a value in 0, 0.5, 1.0 ... 9.0.
- overall_score = mean of the four criteria, rounded to nearest 0.5.
- estimated_band = "Band X.X" (e.g., "Band 6.5").
- feedback = 4-6 sentences of specific, actionable improvement advice using IELTS examiner language. Reference specific parts of the text.

Return ONLY valid JSON (no markdown):
{
  "task_achievement": <float 0-9>,
  "coherence_cohesion": <float 0-9>,
  "lexical_resource": <float 0-9>,
  "grammatical_range": <float 0-9>,
  "overall_score": <float 0-9>,
  "estimated_band": "Band X.X",
  "feedback": "<4-6 sentences>"
}
"""

# ── Official CELPIP Writing Level Descriptors (Paragon Testing) ───────────────
CELPIP_WRITING_RUBRIC = """
You are a trained CELPIP writing examiner. Evaluate the candidate's written response
using the official CELPIP level descriptors below. Score each criterion on a scale
of 1-12 (integer only).

Level guide:  1-3 = Pre-basic  |  4-5 = Basic  |  6-7 = Developing
              8-9 = Adequate   |  10-11 = Competent  |  12 = Expert

CONTENT
12 : Ideas are fully relevant, highly developed, and expressed with precision.
10-11: Complete, relevant ideas; complex reasoning expressed clearly.
8-9 : Generally relevant ideas; some complexity; minor gaps in development.
6-7 : Generally relevant but limited development; some irrelevancies.
4-5 : Limited relevant content; few ideas developed.
2-3 : Minimal relevant content; very few ideas.
1   : No relevant content.

ORGANIZATION
12 : Seamlessly logical structure; perfect paragraphing and transitions.
10-11: Well-organised; clear progression; effective transitions throughout.
8-9 : Generally logical; mostly effective paragraphing; minor structural gaps.
6-7 : Some organisation; adequate paragraphing; transitions not always effective.
4-5 : Limited organisation; paragraphing may be absent or inconsistent.
2-3 : Minimal organisation; ideas appear random.
1   : No discernible organisation.

VOCABULARY
12 : Wide, precise vocabulary; sophisticated word choices; essentially no errors.
10-11: Wide vocabulary; mostly precise; idiomatic use; rare errors.
8-9 : Good range; generally precise; occasional errors that do not impede.
6-7 : Adequate range; some imprecision; noticeable errors that occasionally impede.
4-5 : Limited vocabulary; frequent imprecision; errors often impede.
2-3 : Very limited vocabulary; mainly basic words or formulaic phrases.
1   : No usable vocabulary.

READABILITY
12 : Effortless to read; varied sentence structures; completely natural.
10-11: Easy to read throughout; natural rhythm; rare interruptions.
8-9 : Generally easy to follow; mostly varied structure; minor effort occasionally.
6-7 : Some effort needed; noticeable sentence structure or punctuation issues.
4-5 : Considerable effort needed; frequent issues that impede reading.
2-3 : Very difficult to read; significant punctuation or sentence errors.
1   : Essentially unreadable.

TASK FULFILLMENT
12 : Fully and precisely addresses all aspects; all required elements present.
10-11: Addresses all aspects; most required elements present; minor omissions.
8-9 : Addresses most aspects; key elements present with minor gaps.
6-7 : Addresses some aspects; some required elements missing.
4-5 : Addresses few aspects; much required information missing.
2-3 : Barely addresses the task; most required elements absent.
1   : Does not address the task.

SCORING INSTRUCTIONS
- Assign each criterion an integer value from 1 to 12.
- overall_score = mean of the five criteria rounded to nearest integer.
- estimated_band = "Level X" (e.g., "Level 9").
- feedback = 4-6 sentences of specific, actionable improvement advice using CELPIP examiner language.

Return ONLY valid JSON (no markdown):
{
  "content": <int 1-12>,
  "organization": <int 1-12>,
  "vocabulary": <int 1-12>,
  "readability": <int 1-12>,
  "task_fulfillment": <int 1-12>,
  "overall_score": <float 1-12>,
  "estimated_band": "Level X",
  "feedback": "<4-6 sentences>"
}
"""

DIFFICULTY_CONTEXT = {
    "Beginner":     "The candidate declared themselves a Beginner. Apply descriptors without inflation.",
    "Intermediate": "The candidate declared themselves Intermediate. Apply descriptors without adjustment.",
    "Advanced":     "The candidate declared themselves Advanced. Apply rigorous upper-band expectations.",
}


def evaluate_writing(
    exam_type: str,
    task_type: str,
    prompt_body: str,
    response_text: str,
    difficulty: str,
) -> dict:
    """
    Returns a dict with criterion scores, overall_score, estimated_band, and feedback.
    Keys vary by exam_type (IELTS vs CELPIP).
    """
    client = get_client()

    rubric = IELTS_WRITING_RUBRIC if exam_type == "IELTS" else CELPIP_WRITING_RUBRIC
    diff_ctx = DIFFICULTY_CONTEXT.get(difficulty, DIFFICULTY_CONTEXT["Intermediate"])
    word_count = len(response_text.split())

    user_prompt = (
        f"Exam: {exam_type}\n"
        f"Task type: {task_type}\n"
        f"Difficulty context: {diff_ctx}\n"
        f"Word count: {word_count}\n\n"
        f"Original prompt:\n{prompt_body}\n\n"
        f"Candidate's response:\n{response_text}\n\n"
        "Now evaluate this response strictly according to the rubric."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=rubric,
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )

    raw = (response.text or "{}").strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
