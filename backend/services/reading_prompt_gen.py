"""
Generate a reading passage and 10 questions for IELTS or CELPIP practice.
Supports question types: MCQ, True/False/Not Given, Matching Headings, Fill-in-the-blank.
Correct answers are included in the returned data (stripped before sending to frontend).
"""
import json
from google.genai import types
from services.llm import get_client

SYSTEM_INSTRUCTION = """
You are an expert IELTS and CELPIP reading passage author and question setter.
Generate a reading passage with exactly 10 questions of the specified types.

Return ONLY valid JSON with this exact structure (no markdown, no extra keys):
{
  "passage_title": "string — a descriptive title for the passage",
  "passage_body": "string — the full passage text with clear paragraph structure. Use \\n\\n between paragraphs.",
  "time_limit_minutes": integer,
  "questions": [
    {
      "question_id": "q1",
      "question_type": "mcq",
      "question_text": "string",
      "options": ["A. option text", "B. option text", "C. option text", "D. option text"],
      "correct_answer": "A",
      "explanation": "string — brief reason why this is correct, referencing the passage",
      "accepted_answers": null
    },
    {
      "question_id": "q2",
      "question_type": "tfng",
      "question_text": "string — a factual statement about the passage",
      "options": ["True", "False", "Not Given"],
      "correct_answer": "True",
      "explanation": "string",
      "accepted_answers": null
    },
    {
      "question_id": "q3",
      "question_type": "matching",
      "question_text": "string — e.g. Which heading best matches Section B?",
      "options": ["A. heading text", "B. heading text", "C. heading text", "D. heading text", "E. heading text"],
      "correct_answer": "B",
      "explanation": "string",
      "accepted_answers": null
    },
    {
      "question_id": "q4",
      "question_type": "fill_in",
      "question_text": "string — sentence with _____ (5 underscores) for the gap",
      "options": null,
      "correct_answer": "the exact word or phrase from the passage",
      "explanation": "string",
      "accepted_answers": ["answer1", "alternative2"]
    }
  ]
}

RULES:
- question_ids must be q1 through q10.
- For MCQ: correct_answer is exactly "A", "B", "C", or "D".
- For TFNG: correct_answer is exactly "True", "False", or "Not Given".
  Use "Not Given" when the passage neither confirms nor contradicts the statement.
- For Matching: provide 5-6 heading options; correct_answer is the letter only (e.g. "C").
- For Fill-in: use _____ (5 underscores) as the gap. correct_answer is the exact word(s)
  from the passage. accepted_answers lists all valid synonyms/paraphrases.
- All questions must be answerable from the passage text alone.
- accepted_answers for non-fill_in types must be null.
"""

# Question type mixes by passage type
QUESTION_MIX = {
    "Academic":  {"mcq": 3, "tfng": 3, "matching": 2, "fill_in": 2},
    "General":   {"mcq": 4, "tfng": 3, "matching": 0, "fill_in": 3},
    "Part 1":    {"mcq": 5, "tfng": 5, "matching": 0, "fill_in": 0},
    "Part 2":    {"mcq": 5, "tfng": 0, "matching": 0, "fill_in": 5},
    "Part 3":    {"mcq": 4, "tfng": 0, "matching": 3, "fill_in": 3},
    "Part 4":    {"mcq": 4, "tfng": 3, "matching": 3, "fill_in": 0},
}

PASSAGE_DESCRIPTIONS = {
    "Academic": (
        "an academic / scholarly passage (~550-700 words) on a topic such as science, "
        "technology, history, environment, or social science. Use formal register with "
        "clear paragraph structure (at least 4 paragraphs, labelled A, B, C, D if using matching)."
    ),
    "General": (
        "a general-interest passage (~450-550 words) such as a workplace notice, guide, "
        "advertisement, or informational leaflet. Plain register, practical content."
    ),
    "Part 1": (
        "a short correspondence passage (~350-450 words) — an email, letter, or memo. "
        "Include a clear sender/recipient header. Focus on everyday or workplace communication."
    ),
    "Part 2": (
        "an informational passage (~400-500 words) that could accompany a diagram, chart, "
        "or process (describe the diagram IN TEXT since no image is shown). "
        "Describe steps, components, or data trends clearly."
    ),
    "Part 3": (
        "an information-dense passage (~450-550 words) — could be a news article, "
        "report, or factual guide. Include multiple clearly labelled sections or paragraphs."
    ),
    "Part 4": (
        "an opinion / viewpoint passage (~450-550 words) — could be an editorial, opinion piece, "
        "or discussion of a controversial topic. Present at least two perspectives."
    ),
}

DIFFICULTY_HINTS = {
    "Beginner":     "Use simple vocabulary and short sentences. Questions should be straightforward with obvious answers.",
    "Intermediate": "Use standard academic/professional vocabulary. Questions require careful reading.",
    "Advanced":     "Use sophisticated vocabulary and complex sentence structures. Questions require inference and critical thinking.",
}


def _build_mix_instruction(passage_type: str) -> str:
    mix = QUESTION_MIX.get(passage_type, QUESTION_MIX["Academic"])
    parts = []
    if mix["mcq"]:
        parts.append(f"{mix['mcq']} MCQ questions (question_type: 'mcq')")
    if mix["tfng"]:
        parts.append(f"{mix['tfng']} True/False/Not Given questions (question_type: 'tfng')")
    if mix["matching"]:
        parts.append(f"{mix['matching']} Matching Headings questions (question_type: 'matching')")
    if mix["fill_in"]:
        parts.append(f"{mix['fill_in']} Fill-in-the-blank questions (question_type: 'fill_in')")
    return "Exactly 10 questions in this order: " + ", ".join(parts) + "."


def generate_reading_passage(exam_type: str, passage_type: str, difficulty: str) -> dict:
    """
    Returns a dict with:
      passage_title, passage_body, time_limit_minutes,
      questions (list of dicts WITH correct_answer and explanation)
    """
    client = get_client()

    passage_desc = PASSAGE_DESCRIPTIONS.get(passage_type, PASSAGE_DESCRIPTIONS["Academic"])
    diff_hint = DIFFICULTY_HINTS.get(difficulty, DIFFICULTY_HINTS["Intermediate"])
    mix_instruction = _build_mix_instruction(passage_type)

    user_prompt = (
        f"Exam: {exam_type}\n"
        f"Passage type: {passage_type}\n"
        f"Difficulty: {difficulty}\n\n"
        f"Write {passage_desc}\n\n"
        f"Difficulty guidance: {diff_hint}\n\n"
        f"{mix_instruction}\n\n"
        "Set time_limit_minutes to 20 for Academic/General, 15 for CELPIP parts."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )

    raw = (response.text or "{}").strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
