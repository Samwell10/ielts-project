"""
Generate a listening script + 10 questions for IELTS or CELPIP practice.
Question types: MCQ (6) + Fill-in-the-blank (4).
The script is formatted with speaker labels for multi-speaker TTS.
Correct answers are included and stripped before sending to the frontend.
"""
import json
from google.genai import types
from services.llm import get_client

SYSTEM_INSTRUCTION = """
You are an expert IELTS and CELPIP listening passage author and question setter.
Generate a realistic listening script and exactly 10 questions.

Return ONLY valid JSON with this exact structure (no markdown, no extra keys):
{
  "section_title": "string — a short descriptive title (e.g. 'Library Book Return Inquiry')",
  "script_text": "string — the full listening script. For multi-speaker passages use the format:\\nSpeaker 1: [line]\\nSpeaker 2: [line]\\n... For single-speaker, plain paragraphs.",
  "num_speakers": integer,
  "time_limit_minutes": integer,
  "questions": [
    {
      "question_id": "q1",
      "question_type": "mcq",
      "question_text": "string",
      "options": ["A. option text", "B. option text", "C. option text", "D. option text"],
      "correct_answer": "A",
      "explanation": "string — brief reason referencing the script",
      "accepted_answers": null
    },
    {
      "question_id": "q7",
      "question_type": "fill_in",
      "question_text": "string — sentence with _____ (5 underscores) for the gap",
      "options": null,
      "correct_answer": "the exact word or phrase from the script",
      "explanation": "string",
      "accepted_answers": ["answer1", "alternative2"]
    }
  ]
}

RULES:
- question_ids: q1 through q10.
- Exactly 6 MCQ questions (q1-q6) then 4 fill_in questions (q7-q10).
- MCQ: correct_answer is exactly "A", "B", "C", or "D".
- fill_in: use _____ (5 underscores). correct_answer is exact word(s) from the script.
  accepted_answers lists all valid synonyms/paraphrases.
- All questions must be answerable from the script alone.
- accepted_answers for MCQ must be null.
- script_text must be complete and realistic — not a summary.
- time_limit_minutes: set to 15 for IELTS sections, 12 for CELPIP parts.
- For multi-speaker: use exactly "Speaker 1:", "Speaker 2:", "Speaker 3:" prefixes.
"""

SECTION_PROFILES = {
    # IELTS
    "Section 1": {
        "num_speakers": 2,
        "desc": "a realistic everyday social or transactional conversation between TWO speakers (e.g. booking a hotel room, registering for a course, making an appointment, enquiring about a service). ~300-400 words.",
        "context": "IELTS Section 1 — everyday social context, straightforward vocabulary, clear pronunciation implied.",
    },
    "Section 2": {
        "num_speakers": 1,
        "desc": "a monologue delivered by ONE speaker on a social or semi-formal topic (e.g. a tour guide, a radio announcement, a talk about local facilities). ~350-450 words.",
        "context": "IELTS Section 2 — one-way information talk, practical information focus.",
    },
    "Section 3": {
        "num_speakers": 3,
        "desc": "an academic discussion between TWO OR THREE speakers (students discussing an assignment, or students with a tutor/supervisor). ~350-450 words.",
        "context": "IELTS Section 3 — academic context, some technical vocabulary, mixed opinions.",
    },
    "Section 4": {
        "num_speakers": 1,
        "desc": "an academic lecture or talk delivered by ONE speaker on a scholarly topic (science, history, environment, technology). ~400-500 words.",
        "context": "IELTS Section 4 — formal academic register, specialist vocabulary, complex information.",
    },
    # CELPIP
    "Part 1": {
        "num_speakers": 2,
        "desc": "an everyday Canadian conversation between TWO speakers (e.g. friends discussing plans, neighbours chatting, coworkers talking). ~280-380 words.",
        "context": "CELPIP Listening Part 1 — casual daily conversation, Canadian English, everyday topics.",
    },
    "Part 2": {
        "num_speakers": 2,
        "desc": "a problem-solving dialogue between TWO speakers (e.g. resolving a billing issue, planning an event, discussing a complaint). ~300-400 words.",
        "context": "CELPIP Listening Part 2 — practical problem solving, negotiation language.",
    },
    "Part 3": {
        "num_speakers": 1,
        "desc": "a news item or factual report delivered by ONE speaker (newsreader or reporter). ~280-360 words.",
        "context": "CELPIP Listening Part 3 — formal news register, factual information, clear structure.",
    },
    "Part 4": {
        "num_speakers": 1,
        "desc": "an opinion or viewpoint monologue by ONE speaker (opinion piece, podcast excerpt, or interview answer). ~300-400 words.",
        "context": "CELPIP Listening Part 4 — opinions, reasons, persuasion, mixed register.",
    },
}

DIFFICULTY_HINTS = {
    "Beginner":     "Use simple vocabulary and short sentences. Questions should be straightforward.",
    "Intermediate": "Use standard vocabulary. Questions require careful listening.",
    "Advanced":     "Use sophisticated vocabulary. Questions require inference and detail retention.",
}


def generate_listening_script(exam_type: str, section_type: str, difficulty: str) -> dict:
    """
    Returns a dict with:
      section_title, script_text, num_speakers, time_limit_minutes,
      questions (WITH correct_answer and explanation — strip before sending to frontend)
    """
    client = get_client()

    profile = SECTION_PROFILES.get(section_type, SECTION_PROFILES["Section 1"])
    diff_hint = DIFFICULTY_HINTS.get(difficulty, DIFFICULTY_HINTS["Intermediate"])

    user_prompt = (
        f"Exam: {exam_type}\n"
        f"Section/Part: {section_type}\n"
        f"Difficulty: {difficulty}\n\n"
        f"Context: {profile['context']}\n\n"
        f"Write {profile['desc']}\n\n"
        f"Difficulty guidance: {diff_hint}\n\n"
        "Generate exactly 6 MCQ questions (q1-q6) then 4 fill-in-the-blank questions (q7-q10).\n"
        "All answers must be directly supported by the script text."
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
    result = json.loads(raw)

    # Ensure num_speakers matches profile (fallback)
    if "num_speakers" not in result:
        result["num_speakers"] = profile["num_speakers"]

    return result
