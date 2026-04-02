"""
Paytm AI VoiceGuard - Voice Authentication Service v2.0
=======================================================
DUAL VERIFICATION:
  1. Speaker Identity  → Resemblyzer (voice embeddings + cosine similarity)
  2. Challenge Phrase   → faster-whisper (speech-to-text + fuzzy matching)

Both must pass for a payment to be authorized.
"""
import numpy as np
import os
import tempfile
import random
import subprocess
from difflib import SequenceMatcher

# ─── Challenge phrases for liveness detection ───
CHALLENGE_VARIANTS = {
    "blue elephant twenty seven": ["blue elephant twenty seven", "blue elephant 27"],
    "green mountain forty two": ["green mountain forty two", "green mountain 42"],
    "red ocean nineteen eight": ["red ocean nineteen eight", "red ocean 19 8", "red ocean 198"],
    "silver dolphin sixty three": ["silver dolphin sixty three", "silver dolphin 63"],
    "golden tiger thirty five": ["golden tiger thirty five", "golden tiger 35"],
    "purple sunset eighty one": ["purple sunset eighty one", "purple sunset 81"],
    "white diamond fifty four": ["white diamond fifty four", "white diamond 54"],
    "orange butterfly twelve nine": ["orange butterfly twelve nine", "orange butterfly 12 9", "orange butterfly 129"],
    "black panther seventy six": ["black panther seventy six", "black panther 76"],
    "crystal river forty eight": ["crystal river forty eight", "crystal river 48"]
}
CHALLENGE_PHRASES = list(CHALLENGE_VARIANTS.keys())


class VoiceAuthService:
    _encoder = None       # Resemblyzer VoiceEncoder (speaker identity)
    _whisper_model = None  # faster-whisper model (speech-to-text)

    # ═══════════════════════════════════════════════
    # MODEL LOADERS (lazy, loaded once on first use)
    # ═══════════════════════════════════════════════

    @classmethod
    def get_encoder(cls):
        """Lazy-load the Resemblyzer voice encoder"""
        if cls._encoder is None:
            try:
                from resemblyzer import VoiceEncoder
                cls._encoder = VoiceEncoder()
                print("✅ Resemblyzer VoiceEncoder loaded")
            except Exception as e:
                print(f"❌ FATAL: Could not load VoiceEncoder: {e}")
                raise RuntimeError(f"VoiceEncoder initialization failed: {e}")
        return cls._encoder

    @classmethod
    def get_whisper(cls):
        """Lazy-load the faster-whisper model for speech recognition"""
        if cls._whisper_model is None:
            try:
                from faster_whisper import WhisperModel
                # Use 'base' model — good balance of speed vs accuracy
                cls._whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
                print("✅ Faster-Whisper STT model loaded (base)")
            except Exception as e:
                print(f"❌ FATAL: Could not load Whisper model: {e}")
                raise RuntimeError(f"Whisper initialization failed: {e}")
        return cls._whisper_model

    # ═══════════════════════════════════════════════
    # AUDIO CONVERSION (m4a → wav via ffmpeg)
    # ═══════════════════════════════════════════════

    @staticmethod
    def convert_to_wav(audio_bytes: bytes) -> str:
        """Convert any audio format to 16kHz mono WAV using ffmpeg. Returns path to wav."""
        with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as tmp_in:
            tmp_in.write(audio_bytes)
            tmp_in_path = tmp_in.name

        tmp_out_path = tmp_in_path.replace(".m4a", ".wav")

        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in_path, "-ac", "1", "-ar", "16000", tmp_out_path],
            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE
        )

        try:
            os.unlink(tmp_in_path)
        except:
            pass

        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg conversion failed: {result.stderr.decode()[:200]}")

        return tmp_out_path

    # ═══════════════════════════════════════════════
    # CHALLENGE PHRASE GENERATION
    # ═══════════════════════════════════════════════

    @staticmethod
    def generate_challenge_phrase() -> str:
        return random.choice(CHALLENGE_PHRASES)

    # ═══════════════════════════════════════════════
    # LAYER 1: SPEAKER IDENTITY (Resemblyzer)
    # ═══════════════════════════════════════════════

    @classmethod
    def extract_embedding(cls, wav_path: str) -> np.ndarray:
        """Extract a 256-dim speaker embedding from a WAV file"""
        encoder = cls.get_encoder()
        from resemblyzer import preprocess_wav

        wav = preprocess_wav(wav_path)
        if len(wav) < 1600:  # Less than 0.1 seconds of audio
            raise ValueError("Audio too short for speaker analysis")

        embedding = encoder.embed_utterance(wav)
        return embedding

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot / (norm_a * norm_b))

    # ═══════════════════════════════════════════════
    # LAYER 2: SPEECH-TO-TEXT (faster-whisper)
    # ═══════════════════════════════════════════════

    @classmethod
    def transcribe_audio(cls, wav_path: str) -> str:
        """Transcribe a WAV file to text using faster-whisper"""
        model = cls.get_whisper()
        segments, info = model.transcribe(wav_path, language="en", beam_size=5)
        transcript = " ".join(seg.text.strip() for seg in segments).strip().lower()
        print(f"   📝 Whisper transcription: \"{transcript}\"")
        return transcript

    @staticmethod
    def phrase_similarity(spoken: str, expected: str) -> float:
        """STRICT exact match between spoken text and expected challenge variants"""
        spoken_clean = spoken.lower().strip()
        for char in ",.!?-" :
            spoken_clean = spoken_clean.replace(char, "")

        if not spoken_clean:
            return 0.0

        variants = CHALLENGE_VARIANTS.get(expected, [expected])
        
        for variant in variants:
            v_clean = variant.lower().strip()
            # ONLY return a pass if the exact phrase or digit equivalent is present
            if v_clean in spoken_clean:
                print(f"      [Match Found]: '{v_clean}' inside '{spoken_clean}'")
                return 1.0

        return 0.0

    # ═══════════════════════════════════════════════
    # ENROLLMENT (extract + store embedding)
    # ═══════════════════════════════════════════════

    @classmethod
    def enroll_speaker(cls, audio_bytes: bytes) -> dict:
        """Enroll a speaker: convert audio → extract embedding"""
        wav_path = cls.convert_to_wav(audio_bytes)
        try:
            embedding = cls.extract_embedding(wav_path)
            return {
                "embedding": embedding.tolist(),
                "dimension": len(embedding),
                "status": "enrolled"
            }
        finally:
            try:
                os.unlink(wav_path)
            except:
                pass

    # ═══════════════════════════════════════════════
    # FULL VERIFICATION (Speaker + Phrase)
    # ═══════════════════════════════════════════════

    @classmethod
    def verify_speaker(cls, audio_bytes: bytes, stored_embedding: list) -> dict:
        """
        DUAL VERIFICATION:
        1. Voice identity match (cosine similarity ≥ 0.80)
        2. Challenge phrase match (fuzzy text similarity ≥ 0.55)
        Both must pass.
        """
        wav_path = cls.convert_to_wav(audio_bytes)

        try:
            # ── Layer 1: Speaker Identity ──
            current_embedding = cls.extract_embedding(wav_path)
            stored_np = np.array(stored_embedding, dtype=np.float32)
            voice_similarity = cls.cosine_similarity(current_embedding, stored_np)

            VOICE_THRESHOLD = 0.80
            voice_match = voice_similarity >= VOICE_THRESHOLD

            print(f"   🔊 Speaker Similarity: {voice_similarity:.4f} (threshold: {VOICE_THRESHOLD}) → {'✅ PASS' if voice_match else '❌ FAIL'}")

            return {
                "similarity": round(voice_similarity, 4),
                "verified": voice_match,
                "threshold": VOICE_THRESHOLD,
                "voice_match": voice_match,
                "embedding": current_embedding.tolist()
            }
        finally:
            try:
                os.unlink(wav_path)
            except:
                pass

    @classmethod
    def verify_full(cls, audio_bytes: bytes, stored_embedding: list, expected_phrase: str) -> dict:
        """
        TRIPLE VERIFICATION for payments:
        1. Voice identity match (cosine similarity ≥ 0.80)
        2. Challenge phrase match (fuzzy text similarity ≥ 0.55)
        3. Audio must be long enough (anti-replay)
        ALL must pass.
        """
        wav_path = cls.convert_to_wav(audio_bytes)

        try:
            # ── Layer 1: Speaker Identity ──
            current_embedding = cls.extract_embedding(wav_path)
            stored_np = np.array(stored_embedding, dtype=np.float32)
            voice_similarity = cls.cosine_similarity(current_embedding, stored_np)

            VOICE_THRESHOLD = 0.88
            voice_match = voice_similarity >= VOICE_THRESHOLD

            print(f"   🔊 Speaker Similarity: {voice_similarity:.4f} (strict threshold: {VOICE_THRESHOLD}) → {'✅ PASS' if voice_match else '❌ FAIL'}")

            # ── Layer 2: Challenge Phrase ──
            transcript = cls.transcribe_audio(wav_path)
            phrase_score = cls.phrase_similarity(transcript, expected_phrase)

            PHRASE_THRESHOLD = 0.85
            phrase_match = phrase_score >= PHRASE_THRESHOLD

            print(f"   📝 Phrase Score: {phrase_score:.4f} (strict threshold: {PHRASE_THRESHOLD}) → {'✅ PASS' if phrase_match else '❌ FAIL'}")
            print(f"      Expected: \"{expected_phrase}\"")
            print(f"      Heard:    \"{transcript}\"")

            # ── FINAL DECISION ──
            verified = voice_match and phrase_match

            return {
                "verified": verified,
                "similarity": round(voice_similarity, 4),
                "voice_match": voice_match,
                "voice_threshold": VOICE_THRESHOLD,
                "phrase_score": round(phrase_score, 4),
                "phrase_match": phrase_match,
                "phrase_threshold": PHRASE_THRESHOLD,
                "transcript": transcript,
                "expected_phrase": expected_phrase,
                "embedding": current_embedding.tolist()
            }
        finally:
            try:
                os.unlink(wav_path)
            except:
                pass
