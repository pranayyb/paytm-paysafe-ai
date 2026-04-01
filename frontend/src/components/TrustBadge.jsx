import { useState } from 'react';
import { getTrustBadge } from '../api/client';

const DEMO_IDS = [
  'rahul@paytm',
  'ramesh_med1@paytm',
  'suspicious_guy@paytm',
  'scammer123@paytm',
  'shady_shop@paytm',
  'sunita@paytm',
];

export default function TrustBadge() {
  const [upiId, setUpiId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!upiId.trim()) return;
    setLoading(true);
    try {
      const data = await getTrustBadge(upiId);
      setResult(data);
    } catch (err) {
      setResult({ error: 'Server not reachable. Start the backend first.' });
    }
    setLoading(false);
  };

  const loadDemo = (id) => {
    setUpiId(id);
    setResult(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🟢</span>
        <div>
          <h2>Trust Badge</h2>
          <p className="subtitle">Check the trust score of any UPI ID</p>
        </div>
      </div>

      <div className="demo-chips">
        {DEMO_IDS.map((id) => (
          <button key={id} className="chip" onClick={() => loadDemo(id)}>
            {id}
          </button>
        ))}
      </div>

      <div className="input-row">
        <input
          type="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="Enter UPI ID (e.g. rahul@paytm)"
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        />
        <button className="btn-primary" onClick={handleCheck} disabled={loading}>
          {loading ? '⏳' : '🔍'}
        </button>
      </div>

      {result && !result.error && (
        <div className="trust-result">
          <div className="trust-score-ring" style={{ '--score-color': getScoreColor(result.trust_score) }}>
            <div className="score-value">{result.trust_score}</div>
            <div className="score-label">/ 100</div>
          </div>

          <div className="trust-badge-display">{result.badge}</div>
          <div className="trust-explanation">{result.explanation}</div>

          <div className="trust-meta">
            <div className="meta-item">
              <span className="meta-label">Account Age</span>
              <span className="meta-value">{result.account_age_days} days</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">UPI ID</span>
              <span className="meta-value">{result.upi_id}</span>
            </div>
          </div>

          {result.flags && result.flags.length > 0 && (
            <div className="flags">
              {result.flags.map((flag, i) => (
                <span key={i} className="flag-tag">{flag.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}

          {result.factors && (
            <div className="factors">
              <h4>Score Breakdown</h4>
              {Object.entries(result.factors).map(([key, val]) => (
                <div key={key} className="factor-row">
                  <span className="factor-name">{key.replace(/_/g, ' ')}</span>
                  <div className="factor-bar">
                    <div
                      className="factor-fill"
                      style={{
                        width: `${(val.score / val.max) * 100}%`,
                        backgroundColor: val.score >= val.max * 0.7 ? '#22c55e' : val.score >= val.max * 0.4 ? '#eab308' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="factor-score">{val.score}/{val.max}</span>
                </div>
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
