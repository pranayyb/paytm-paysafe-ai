import { useState } from 'react';

export default function VoicePayment() {
  const [status, setStatus] = useState('idle'); // idle, recording, processing, done
  const [result, setResult] = useState(null);

  const handleDemoVoice = async () => {
    setStatus('recording');
    setResult(null);

    // Simulate recording delay
    await new Promise(r => setTimeout(r, 1500));
    setStatus('processing');

    try {
      // Create a tiny audio blob for the demo
      const blob = new Blob(['demo-audio'], { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio_file', blob, 'voice.wav');

      const res = await fetch('http://localhost:8000/voice/pay', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      setStatus('done');
    } catch (err) {
      setResult({ error: 'Server not reachable. Start the backend first.' });
      setStatus('done');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🎙️</span>
        <div>
          <h2>Voice Payment</h2>
          <p className="subtitle">Say a payment command in Hindi — AI parses, checks trust, and confirms</p>
        </div>
      </div>

      <div className="voice-demo-info">
        <p>💡 Try saying things like:</p>
        <ul>
          <li>"Rahul ko 500 bhejo vegetables ke liye"</li>
          <li>"Ramesh medical store ko 1200 bhejo dawai ke liye"</li>
          <li>"Naye dukan wale ko 2000 bhejo"</li>
        </ul>
      </div>

      <button
        className={`btn-voice ${status === 'recording' ? 'recording' : ''}`}
        onClick={handleDemoVoice}
        disabled={status === 'recording' || status === 'processing'}
      >
        {status === 'idle' && '🎤 Tap to Speak (Demo)'}
        {status === 'recording' && '🔴 Listening...'}
        {status === 'processing' && '⏳ Processing...'}
        {status === 'done' && '🎤 Tap Again'}
      </button>

      {result && !result.error && (
        <div className="voice-result">
          <div className="voice-step">
            <span className="step-num">1</span>
            <div>
              <strong>Transcribed:</strong>
              <p>"{result.transcribed}"</p>
            </div>
          </div>

          <div className="voice-step">
            <span className="step-num">2</span>
            <div>
              <strong>Parsed Intent:</strong>
              <div className="intent-grid">
                <span>👤 Receiver: <strong>{result.parsed_intent?.receiver || 'N/A'}</strong></span>
                <span>💰 Amount: <strong>₹{result.parsed_intent?.amount || 'N/A'}</strong></span>
                {result.parsed_intent?.purpose && (
                  <span>📝 Purpose: <strong>{result.parsed_intent.purpose}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="voice-step">
            <span className="step-num">3</span>
            <div>
              <strong>Trust Check:</strong>
              <div className={`trust-inline ${result.trust_check?.warning ? 'warning' : 'ok'}`}>
                {result.trust_check?.badge}
                {result.trust_check?.trust_score !== undefined && (
                  <span> (Score: {result.trust_check.trust_score})</span>
                )}
              </div>
            </div>
          </div>

          <div className="voice-step">
            <span className="step-num">4</span>
            <div>
              <strong>AI Response:</strong>
              <p className="ai-response">🗣️ "{result.response_text}"</p>
            </div>
          </div>
        </div>
      )}
      {result?.error && (
        <div className="result-box danger">{result.error}</div>
      )}
    </div>
  );
}
