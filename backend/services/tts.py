"""
Text-to-speech using Gemini 2.0 Flash audio generation.
Converts a listening script to a WAV audio file saved on disk.
Supports single-speaker and multi-speaker (up to 3) scripts.

Multi-speaker format expected in script_text:
    Speaker 1: Hello, I'd like to make a reservation.
    Speaker 2: Of course! What date were you thinking?
"""
import io
import os
import uuid
import wave

from google.genai import types
from services.llm import get_client
from config import AUDIO_STORAGE_PATH

# Voice assignments
_VOICE_SINGLE = "Kore"          # female, clear and natural
_VOICE_MAP = {
    "Speaker 1": "Aoede",       # female
    "Speaker 2": "Puck",        # male
    "Speaker 3": "Kore",        # female (secondary)
}


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2) -> bytes:
    """Wrap raw PCM bytes in a WAV container that browsers can play."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_data)
    return buf.getvalue()


def _build_speech_config(num_speakers: int) -> types.SpeechConfig:
    if num_speakers <= 1:
        return types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=_VOICE_SINGLE)
            )
        )

    speaker_configs = []
    for speaker_label, voice_name in _VOICE_MAP.items():
        speaker_num = int(speaker_label.split()[-1])
        if speaker_num <= num_speakers:
            speaker_configs.append(
                types.SpeakerVoiceConfig(
                    speaker=speaker_label,
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                    ),
                )
            )

    return types.SpeechConfig(
        multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
            speaker_voice_configs=speaker_configs
        )
    )


def text_to_speech(script_text: str, num_speakers: int) -> str:
    """
    Generate a WAV audio file from the script text using Gemini TTS.

    Args:
        script_text: The full listening script (may contain "Speaker N:" labels).
        num_speakers: Number of distinct speakers (1 = single voice, 2-3 = multi-speaker).

    Returns:
        The audio_url path (e.g. "/api/audio/files/uuid.wav") for the saved WAV file.

    Raises:
        RuntimeError if Gemini TTS generation fails.
    """
    client = get_client()
    speech_config = _build_speech_config(num_speakers)

    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=script_text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=speech_config,
        ),
    )

    try:
        pcm_data: bytes = response.candidates[0].content.parts[0].inline_data.data
    except (AttributeError, IndexError) as exc:
        raise RuntimeError(f"Gemini TTS returned no audio data: {exc}") from exc

    wav_bytes = _pcm_to_wav(pcm_data)

    filename = f"{uuid.uuid4()}.wav"
    dest_path = os.path.join(AUDIO_STORAGE_PATH, filename)
    os.makedirs(AUDIO_STORAGE_PATH, exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(wav_bytes)

    return f"/api/audio/files/{filename}"
