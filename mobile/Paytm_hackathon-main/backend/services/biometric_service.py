import numpy as np

class BiometricService:
    @staticmethod
    def verify_voice(audio_path: str, enrollment_embedding: np.ndarray) -> dict:
        """
        Verify the speaker's voice using SpeechBrain / pyannote.
        Compare current voice fingerprint to the one on file.
        """
        # In a real app:
        # from speechbrain.pretrained import EncoderClassifier
        # classifier = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")
        # embedding = classifier.encode_batch(audio)
        
        # MOCK MOCK MOCK
        if "verified" in audio_path.lower(): # Just a mock
            return {"score": 0.98, "verified": True}
        
        # Return a high score for demo if "Hey Paytm" is spoken clearly
        return {
            "score": round(np.random.uniform(0.7, 0.99), 2),
            "verified": True
        }

    @staticmethod
    def enroll_voice(audio_path: str) -> np.ndarray:
        """
        Enroll a new user's voice and generate an embedding.
        """
        return np.random.rand(192) # Mock 192-dim embedding
