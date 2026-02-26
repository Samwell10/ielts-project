"""Generate exam-style speaking questions via Gemini 2.0 Flash."""
import json
from google.genai import types
from services.llm import get_client

IELTS_PART_GUIDANCE = {
    "Part 1": (
        "IELTS Speaking Part 1: Short, personal questions about everyday topics. "
        "Questions should be simple, direct, and answerable in 2-3 sentences. "
        "Generate exactly {count} questions."
    ),
    "Part 2": (
        "IELTS Speaking Part 2: One cue-card style question where the candidate speaks "
        "for 1-2 minutes. The question must start with 'Describe...' and include 3-4 sub-points "
        "starting with 'You should say:'. Generate exactly 1 question regardless of count."
    ),
    "Part 3": (
        "IELTS Speaking Part 3: Abstract, opinion-based discussion questions linked to the "
        "Part 2 topic. Questions should invite extended analysis, comparison, or argument. "
        "Generate exactly {count} questions."
    ),
}

CELPIP_GUIDANCE = (
    "CELPIP Speaking Task: Practical, scenario-based questions that test real-life English use. "
    "Tasks may ask the candidate to give advice, describe a scene, compare options, express an "
    "opinion, or talk about a personal experience. Generate exactly {count} tasks."
)

DIFFICULTY_NOTE = {
    "Beginner":     "Use simple vocabulary and short sentence structures.",
    "Intermediate": "Use moderately complex vocabulary and mixed sentence structures.",
    "Advanced":     "Use sophisticated vocabulary, idiomatic language, and nuanced prompts.",
}


def generate_questions(
    exam_type: str,
    difficulty: str,
    topic: str,
    part: str | None,
    count: int,
) -> list[str]:
    client = get_client()

    if exam_type == "IELTS":
        part = part or "Part 1"
        guidance = IELTS_PART_GUIDANCE.get(part, IELTS_PART_GUIDANCE["Part 1"])
        effective_count = 1 if part == "Part 2" else count
        guidance = guidance.format(count=effective_count)
    else:
        guidance = CELPIP_GUIDANCE.format(count=count)
        effective_count = count

    diff_note = DIFFICULTY_NOTE.get(difficulty, DIFFICULTY_NOTE["Intermediate"])

    system_instruction = (
        "You are an expert IELTS and CELPIP speaking examiner. "
        "Return ONLY a valid JSON object with a single key 'questions' "
        "whose value is a list of question strings. No markdown, no extra text."
    )

    user_prompt = (
        f"Exam: {exam_type}\n"
        f"Topic: {topic}\n"
        f"Part/Task: {part or 'N/A'}\n"
        f"Difficulty: {difficulty} - {diff_note}\n\n"
        f"Instructions: {guidance}\n\n"
        f'Return JSON: {{"questions": ["...", ...]}}'
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.8,
        ),
    )

    raw = response.text or "{}"
    # Strip markdown fences if present
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(raw)
    questions: list[str] = data.get("questions", [])

    return questions[:effective_count] if questions else [
        f"Please tell me about {topic} in the context of your own experience."
    ]
