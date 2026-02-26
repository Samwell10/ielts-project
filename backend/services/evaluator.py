"""
Evaluate a spoken response against IELTS or CELPIP rubrics using Gemini.

- If a gemini_file_uri is provided the model receives the actual audio recording,
  enabling genuine pronunciation, fluency, and listenability scoring.
- Otherwise it falls back to transcript-only scoring (text analysis).
- Uses full official band/level descriptor tables from Cambridge (IELTS) and
  Paragon Testing Enterprises (CELPIP).
"""
import json
from google.genai import types
from services.llm import get_client

# ── Official IELTS Speaking Band Descriptors (Cambridge) ─────────────────────
# Source: IELTS Speaking band descriptors (public version), Cambridge Assessment
IELTS_RUBRIC = """
You are a trained IELTS speaking examiner. Evaluate the candidate's spoken response
using ONLY the official Cambridge band descriptors below. Score each criterion
on a scale of 0–9 in 0.5-band increments.

═══════════════════════════════════════════════════════
FLUENCY AND COHERENCE
═══════════════════════════════════════════════════════
Band 9 : Speaks fluently with only rare repetition or self-correction; hesitation
         is content-related; topics are coherently and fully developed.
Band 8 : Speaks fluently with only occasional repetition/self-correction; hesitation
         is usually content-related; develops topics coherently and appropriately.
Band 7 : Speaks at length without noticeable effort; may show language-related
         hesitation or some repetition/self-correction; uses a range of connectives
         and discourse markers with some flexibility.
Band 6 : Willing to speak at length, but may lose coherence due to repetition,
         self-correction or hesitation; uses connectives/discourse markers but not
         always appropriately.
Band 5 : Usually maintains flow but uses repetition, self-correction and/or slow
         speech to keep going; may over-use certain connectives; fluency problems
         with complex communication.
Band 4 : Cannot respond without noticeable pauses; speaks slowly with frequent
         repetition and self-correction; links basic sentences with simple
         connectives; some breakdowns in coherence.
Band 3 : Speaks with long pauses; limited ability to link simple sentences; gives
         only simple responses, frequently unable to convey basic message.
Band 2 : Pauses lengthily before most words; little communication possible.
Band 1 : No communication possible; no rateable language.

═══════════════════════════════════════════════════════
LEXICAL RESOURCE
═══════════════════════════════════════════════════════
Band 9 : Uses vocabulary with full flexibility and precision; uses idiomatic
         language naturally and accurately.
Band 8 : Uses a wide vocabulary readily and flexibly; uses less common and
         idiomatic vocabulary skillfully with occasional inaccuracies; uses
         paraphrase effectively.
Band 7 : Uses vocabulary flexibly across a variety of topics; uses some less
         common and idiomatic vocabulary with some awareness of style/collocation;
         occasional inappropriate choices; uses paraphrase effectively.
Band 6 : Has sufficient vocabulary to discuss topics at length despite some
         inappropriacies; generally paraphrases successfully.
Band 5 : Manages familiar and unfamiliar topics but with limited flexibility;
         attempts less familiar vocabulary with some inaccuracy; relies on
         paraphrase and circumlocution.
Band 4 : Can discuss familiar topics but only conveys basic meaning on unfamiliar
         ones; frequent errors in word choice; rarely paraphrases.
Band 3 : Uses simple vocabulary for personal information; insufficient vocabulary
         for less familiar topics.
Band 2 : Only produces isolated words or memorised utterances.

═══════════════════════════════════════════════════════
GRAMMATICAL RANGE AND ACCURACY
═══════════════════════════════════════════════════════
Band 9 : Uses a full range of structures naturally and appropriately; produces
         consistently accurate structures apart from native-speaker 'slips'.
Band 8 : Uses a wide range of structures flexibly; produces a majority of
         error-free sentences; very occasional inappropriacies or non-systematic
         errors.
Band 7 : Uses a range of complex structures with some flexibility; frequently
         produces error-free sentences, though some grammatical mistakes persist.
Band 6 : Uses a mix of simple and complex structures but with limited flexibility;
         frequent mistakes with complex structures, though these rarely cause
         comprehension difficulties.
Band 5 : Produces basic sentence forms with reasonable accuracy; limited range of
         complex structures, which usually contain errors and may cause some
         comprehension difficulty.
Band 4 : Produces basic sentence forms and some correct simple sentences; errors
         are frequent and may lead to misunderstanding.
Band 3 : Attempts basic sentence forms but with limited success; relies on
         memorised utterances; many errors except in memorised expressions.
Band 2 : Cannot produce basic sentence forms.

═══════════════════════════════════════════════════════
PRONUNCIATION
═══════════════════════════════════════════════════════
(Score this criterion primarily from the AUDIO recording, not the transcript.)

Band 9 : Uses a full range of phonological features with precision and subtlety;
         sustained flexible use; easy to understand throughout; L1 accent has
         minimal effect on intelligibility.
Band 8 : Uses a wide range of phonological features; sustained flexible use with
         only occasional lapses; easy to understand throughout; L1 accent has
         minimal effect.
Band 7 : Shows positive features of Band 6 and some features of Band 8; generally
         easy to understand; L1 accent does not impede communication.
Band 6 : Uses phonological features with mixed control; some effective use but not
         sustained; generally understandable; mispronunciation of individual words
         or sounds reduces clarity at times.
Band 5 : Shows positive features of Band 4 and some features of Band 6; easy to
         understand most of the time; mispronunciations occur but do not impede
         overall communication.
Band 4 : Uses a limited range of phonological features; attempts to control
         features but lapses are frequent; frequent mispronunciations cause some
         difficulty for the listener.
Band 3 : More frequent lapses than Band 4; mispronunciations cause difficulty for
         the listener.
Band 2 : Speech is often unintelligible.

═══════════════════════════════════════════════════════
SCORING INSTRUCTIONS
═══════════════════════════════════════════════════════
• Assign each criterion a value in {0, 0.5, 1.0, 1.5 … 9.0}.
• Overall band = mean of the four criteria, rounded to nearest 0.5.
• Express estimated_band as "Band X.X" (e.g., "Band 6.5").
• Write 3–5 sentences of specific, actionable feedback using IELTS examiner
  language. Reference the band descriptors in your advice.

Return ONLY valid JSON (no markdown):
{
  "fluency_coherence": <float 0-9>,
  "lexical_resource": <float 0-9>,
  "grammatical_range": <float 0-9>,
  "pronunciation": <float 0-9>,
  "overall_score": <float 0-9>,
  "estimated_band": "Band X.X",
  "feedback": "<3-5 sentences>"
}
"""

# ── Official CELPIP Speaking Level Descriptors (Paragon Testing) ──────────────
CELPIP_RUBRIC = """
You are a trained CELPIP examiner. Evaluate the candidate's spoken response using
the official CELPIP level descriptors below. Score each criterion on a scale of
1–12 (integer only).

Level guide:  1-3 = Pre-basic  |  4-5 = Basic  |  6-7 = Developing
              8-9 = Adequate   |  10-11 = Competent  |  12 = Expert

═══════════════════════════════════════════════════════
CONTENT AND COHERENCE
═══════════════════════════════════════════════════════
12 : Ideas are fully relevant, highly developed, and expressed with precision.
     Seamless, sophisticated organisation throughout.
10-11: Ideas are complete and relevant; complex ideas expressed clearly and
       coherently; well-organised with effective transitions.
8-9 : Ideas are generally complete and relevant; some complex ideas attempted;
      mainly coherent organisation with minor gaps.
6-7 : Ideas are generally relevant but with limited development; some attempt
      at organisation; minor irrelevancies may appear.
4-5 : Limited relevant content; few ideas developed; some attempt at organisation
      but structure may be unclear.
2-3 : Minimal relevant content; very few ideas; little evidence of organisation.
1   : No relevant content; incomprehensible.

═══════════════════════════════════════════════════════
VOCABULARY
═══════════════════════════════════════════════════════
12 : Wide, precise vocabulary; sophisticated and idiomatic word choices;
     essentially no errors.
10-11: Wide vocabulary; mostly precise; idiomatic use; rare errors.
8-9 : Good range; generally precise; some idiomatic use; occasional errors that
      do not impede communication.
6-7 : Adequate range; some imprecision or over-reliance on basic words;
      noticeable errors that occasionally impede.
4-5 : Limited vocabulary; frequent imprecision or repetition; errors often
      impede communication.
2-3 : Very limited vocabulary; mainly isolated words or formulaic phrases.
1   : No usable vocabulary.

═══════════════════════════════════════════════════════
LISTENABILITY
═══════════════════════════════════════════════════════
(Score this criterion primarily from the AUDIO recording.)

12 : Completely natural rhythm, intonation, and pacing; seamless and effortless
     to listen to; no accent effect on intelligibility.
10-11: Easy to listen to throughout; natural rhythm with only rare interruptions;
       accent has minimal effect on intelligibility.
8-9 : Generally easy to follow; mostly natural rhythm; minor effort occasionally
      required; accent rarely affects intelligibility.
6-7 : Some listener effort required; noticeable accent, rhythm, or fluency issues
      that occasionally impede comprehension.
4-5 : Considerable listener effort needed; frequent pronunciation, fluency, or
      pacing issues that often impede comprehension.
2-3 : Very difficult to understand; significant pronunciation and fluency
      difficulties throughout.
1   : Mostly unintelligible.

═══════════════════════════════════════════════════════
TASK FULFILLMENT
═══════════════════════════════════════════════════════
12 : Fully and precisely addresses all aspects of the task; all required
     information present; may exceed requirements.
10-11: Addresses all aspects; most required information present; minor omissions
       or imprecision.
8-9 : Addresses most aspects; key information present with minor gaps.
6-7 : Addresses some aspects; some required information missing or under-developed.
4-5 : Addresses few aspects; much required information missing or irrelevant.
2-3 : Barely addresses the task; most required information absent.
1   : Does not address the task.

═══════════════════════════════════════════════════════
SCORING INSTRUCTIONS
═══════════════════════════════════════════════════════
• Assign each criterion an integer value from 1 to 12.
• Overall level = mean of the four criteria rounded to nearest integer.
• Express estimated_band as "Level X" (e.g., "Level 9").
• Write 3–5 sentences of specific, actionable feedback using CELPIP examiner
  language. Reference the level descriptors in your advice.

Return ONLY valid JSON (no markdown):
{
  "content_coherence": <int 1-12>,
  "vocabulary": <int 1-12>,
  "listenability": <int 1-12>,
  "task_fulfillment": <int 1-12>,
  "overall_score": <float 1-12>,
  "estimated_band": "Level X",
  "feedback": "<3-5 sentences>"
}
"""

DIFFICULTY_CONTEXT = {
    "Beginner":     "The candidate declared themselves a Beginner. Use this only to contextualise "
                    "feedback language — do NOT inflate scores; apply the same band descriptors.",
    "Intermediate": "The candidate declared themselves Intermediate. Apply the descriptors without "
                    "adjustment.",
    "Advanced":     "The candidate declared themselves Advanced. Apply rigorous expectations "
                    "consistent with the upper band descriptors.",
}


def evaluate_response(
    exam_type: str,
    transcript: str,
    question_text: str,
    difficulty: str,
    gemini_file_uri: str | None = None,
    gemini_file_name: str | None = None,
) -> dict:
    """
    Returns a dict with scores, estimated_band, and feedback.
    If gemini_file_uri is provided, Gemini receives the actual audio for
    pronunciation/fluency/listenability scoring; otherwise text-only.
    Deletes the Gemini file after scoring.
    """
    client = get_client()

    rubric = IELTS_RUBRIC if exam_type == "IELTS" else CELPIP_RUBRIC
    diff_ctx = DIFFICULTY_CONTEXT.get(difficulty, DIFFICULTY_CONTEXT["Intermediate"])
    audio_note = (
        "The audio recording is attached. Use it to score Pronunciation (IELTS) / "
        "Listenability (CELPIP) directly from the speaker's voice — rhythm, intonation, "
        "word stress, clarity, and fluency patterns. Also use the audio to verify fluency "
        "features such as pausing and hesitation that may not be visible in the transcript."
        if gemini_file_uri
        else
        "No audio is available. Score Pronunciation / Listenability from transcript cues "
        "only (word complexity, sentence length, likely fluency patterns) and note this "
        "limitation explicitly in the feedback."
    )

    user_prompt = (
        f"Exam: {exam_type}\n"
        f"Difficulty context: {diff_ctx}\n\n"
        f"Question asked:\n{question_text}\n\n"
        f"Candidate's transcript:\n{transcript}\n\n"
        f"Audio instruction: {audio_note}\n\n"
        "Now evaluate this response strictly according to the rubric."
    )

    # Build content: optionally prepend the audio Part
    if gemini_file_uri:
        contents = [
            types.Part.from_uri(
                file_uri=gemini_file_uri,
                mime_type="audio/webm",
            ),
            user_prompt,
        ]
    else:
        contents = user_prompt

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=rubric,
            response_mime_type="application/json",
            temperature=0.1,  # Very low for consistent, calibrated scoring
        ),
    )

    raw = (response.text or "{}").strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    result = json.loads(raw)

    # Delete Gemini file now that scoring is complete
    if gemini_file_name:
        try:
            client.files.delete(name=gemini_file_name)
        except Exception:
            pass  # Already expired or not found — safe to ignore

    return result
