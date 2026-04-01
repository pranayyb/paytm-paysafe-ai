import { useState } from 'react';
import { checkScam } from '../api/client';

const DEMO_MESSAGES = [
  "Bijli department se baat kar raha hoon. Aapka connection aaj raat band hoga. Abhi 1 rupee bhejo verify karne ke liye.",
  "Aapka Paytm KYC expire ho gaya hai. Abhi update karein warna account band ho jaega.",
  "Badhai ho! Aapne ₹25 lakh jeete hain. Processing fee ₹5000 bhejein.",
  "Aapke phone pe ek OTP aaya hoga, please mujhe bata dijiye verification ke liye.",
  "Aapke naam pe FIR darj hai. Settlement amount ₹25,000 bhejein.",
  "AnyDesk download karein, hum aapka phone fix kar denge remotely.",
];

export default function ScamShield() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const data = await checkScam(message);
      setResult(data);
    } catch (err) {
      setResult({ error: 'Server not reachable. Start the backend first.' });
    }
    setLoading(false);
  };

  const loadDemo = (msg) => {
    setMessage(msg);
    setResult(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🔴</span>
        <div>
          <h2>Scam Shield</h2>
          <p className="subtitle">Paste a suspicious message and let AI analyze it</p>
        </div>
      </div>

      <div className="demo-chips">
        {DEMO_MESSAGES.map((msg, i) => (
          <button key={i} className="chip" onClick={() => loadDemo(msg)}>
            {msg.slice(0, 40)}...
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Paste suspicious message here..."
        rows={4}
      />

      <button className="btn-primary" onClick={handleCheck} disabled={loading}>
        {loading ? '⏳ Analyzing...' : '🔍 Check for Scam'}
      </button>

      {result && !result.error && (
        <div className={`result-box ${result.is_scam ? 'danger' : 'safe'}`}>
          <div className="result-header">
            <span className="result-badge">
              {result.is_scam ? '🚨 SCAM DETECTED' : '✅ SAFE'}
            </span>
            <span className="confidence">
              {result.confidence}% confidence
            </span>
          </div>
          {result.scam_type && (
            <div className="result-type">Type: <strong>{result.scam_type}</strong></div>
          )}
          {result.warning_hindi && (
            <div className="result-warning">{result.warning_hindi}</div>
          )}
          <div className="result-meta">
            <span>Mode: {result.analysis_mode}</span>
            <span>Action: <strong>{result.recommendation}</strong></span>
          </div>
          {result.matched_patterns && result.matched_patterns.length > 1 && (
            <div className="matched-patterns">
              <strong>Other matches:</strong>
              {result.matched_patterns.slice(1).map((p, i) => (
                <span key={i} className="pattern-tag">{p.type} ({p.confidence}%)</span>
              ))}
            </div>
          )}
        </div>
      )}
      {result?.error && (
        <div className="result-box danger">{result.error}</div>
      )}
    </div>
  );
}
