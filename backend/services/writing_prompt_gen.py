"""Generate realistic IELTS and CELPIP writing prompts via Gemini."""
import json
from google.genai import types
from services.llm import get_client

TASK_GUIDANCE = {
    "Task 1 Academic": {
        "instructions": (
            "Generate an IELTS Academic Task 1 prompt with real chart data.\n\n"
            "Choose one chart_type: 'bar', 'line', 'table', or 'pie'.\n\n"
            "Return these JSON fields:\n"
            "  prompt_title: short label e.g. 'Bar chart: Internet usage by age group 2010-2023'\n"
            "  prompt_body: the IELTS instruction only — "
            "'The [chart/graph/table] below shows [brief one-line description]. "
            "Summarise the information by selecting and reporting the main features, "
            "and make comparisons where relevant. Write at least 150 words.' "
            "(Do NOT include raw numbers in prompt_body — the data will be shown as a visual chart.)\n"
            "  chart_type: one of 'bar', 'line', 'table', 'pie'\n"
            "  chart_data: a JSON object — schema varies by chart_type:\n"
            "    bar or line: {\"title\": str, \"x_label\": str, \"y_label\": str, \"unit\": str, "
            "\"categories\": [str, ...], \"series\": [{\"name\": str, \"values\": [number, ...]}, ...]}\n"
            "    table: {\"title\": str, \"headers\": [str, ...], \"rows\": [[str, ...], ...]}\n"
            "    pie: {\"title\": str, \"unit\": \"%\", \"segments\": [{\"label\": str, \"value\": number}, ...]}\n\n"
            "Rules: 4-8 categories/rows, 1-3 series, realistic topic-relevant numbers. "
            "All values in series/segments must be plain numbers (not strings)."
        ),
        "word_limit": 150,
        "time_limit_minutes": 20,
    },
    "Task 1 General": {
        "instructions": (
            "Generate an IELTS General Training Task 1 letter-writing prompt. "
            "Create a realistic scenario requiring a formal, semi-formal, or informal letter. "
            "prompt_title: short label e.g. 'Letter of complaint to a landlord'. "
            "prompt_body: the full situation description ending with 3 bullet points of what "
            "to include in the letter. End with 'Write at least 150 words. You do NOT need to "
            "write any addresses.'"
        ),
        "word_limit": 150,
        "time_limit_minutes": 20,
    },
    "Task 2": {
        "instructions": (
            "Generate an IELTS Task 2 essay prompt on the given topic. "
            "Choose one of: Opinion (Do you agree or disagree?), Discussion (Discuss both views), "
            "Problem-Solution, or Advantage-Disadvantage. "
            "prompt_title: short label e.g. 'Opinion essay: Remote work and productivity'. "
            "prompt_body: 2-3 sentence context statement followed by the essay question. "
            "End with 'Write at least 250 words. Give reasons for your answer and include "
            "any relevant examples from your own knowledge or experience.'"
        ),
        "word_limit": 250,
        "time_limit_minutes": 40,
    },
    "Task 1 Email": {
        "instructions": (
            "Generate a CELPIP Task 1 email-writing prompt. Create a realistic everyday scenario "
            "where the candidate must write an email (e.g., to a neighbour, colleague, landlord, "
            "or company). prompt_title: short label e.g. 'Email to a neighbour about noise'. "
            "prompt_body: the situation description with 3-4 bullet points of what the email "
            "must include. End with 'Write 150-200 words.'"
        ),
        "word_limit": 150,
        "time_limit_minutes": 27,
    },
    "Task 2 Survey": {
        "instructions": (
            "Generate a CELPIP Task 2 survey-response prompt. Present a realistic survey on a "
            "topic where the candidate must give opinions with reasons. Include 2-3 survey "
            "questions to respond to. prompt_title: short label e.g. 'Community survey: Public transport'. "
            "prompt_body: the survey context followed by the questions. "
            "End with 'Write 150-200 words in total.'"
        ),
        "word_limit": 150,
        "time_limit_minutes": 27,
    },
}

DIFFICULTY_NOTE = {
    "Beginner":     "Use a simple, straightforward topic that does not require specialist knowledge.",
    "Intermediate": "Use a moderately complex topic with some nuance.",
    "Advanced":     "Use a nuanced, sophisticated topic that challenges critical thinking.",
}

# For Task 1 Academic we ask Gemini to include chart_type and chart_data
_ACADEMIC_RETURN_HINT = (
    'Return JSON: {"prompt_title": "...", "prompt_body": "...", '
    '"chart_type": "bar|line|table|pie", "chart_data": {...}}'
)
_DEFAULT_RETURN_HINT = 'Return JSON: {"prompt_title": "...", "prompt_body": "..."}'


def generate_writing_prompt(
    exam_type: str,
    task_type: str,
    difficulty: str,
    topic: str,
) -> dict:
    """Return {prompt_title, prompt_body, word_limit, time_limit_minutes, chart_type?, chart_data?}."""
    client = get_client()
    guidance = TASK_GUIDANCE.get(task_type, TASK_GUIDANCE["Task 2"])
    is_academic = task_type == "Task 1 Academic"

    system_instruction = (
        "You are an expert IELTS and CELPIP test designer. "
        "Return ONLY valid JSON. Required keys: prompt_title (string), prompt_body (string). "
        "For Task 1 Academic also include: chart_type (string), chart_data (object). "
        "No markdown, no code fences, no extra text."
    )

    return_hint = _ACADEMIC_RETURN_HINT if is_academic else _DEFAULT_RETURN_HINT

    user_prompt = (
        f"Exam: {exam_type}\n"
        f"Task: {task_type}\n"
        f"Topic area: {topic}\n"
        f"Difficulty: {difficulty} — {DIFFICULTY_NOTE.get(difficulty, '')}\n\n"
        f"Instructions: {guidance['instructions']}\n\n"
        f"{return_hint}"
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.9,
        ),
    )

    raw = (response.text or "{}").strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(raw)

    return {
        "prompt_title": data.get("prompt_title", f"{task_type} — {topic}"),
        "prompt_body": data.get("prompt_body", ""),
        "word_limit": guidance["word_limit"],
        "time_limit_minutes": guidance["time_limit_minutes"],
        "chart_type": data.get("chart_type") if is_academic else None,
        "chart_data": data.get("chart_data") if is_academic else None,
    }
