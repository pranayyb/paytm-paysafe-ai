import { useState } from 'react';
import { scanQR } from '../api/client';

const DEMO_QRS = [
  { label: '🟢 Safe Merchant', qr: 'upi://pay?pa=ramesh_med1@paytm&pn=Ramesh%20Medical%20Store&am=500' },
  { label: '🟡 New Restaurant', qr: 'upi://pay?pa=new_restaurant@paytm&pn=Tasty%20Bites&am=350' },
  { label: '🔴 Shady Shop', qr: 'upi://pay?pa=shady_shop@paytm&pn=Wrong%20Name&am=9999' },
  { label: '🔴 Unknown QR', qr: 'upi://pay?pa=unknown_scammer@paytm&pn=FreeRecharge&am=1' },
  { label: '❌ Invalid QR', qr: 'https://malicious-site.com/pay' },
];

export default function QRScanner() {
  const [qrData, setQrData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!qrData.trim()) return;
    setLoading(true);
    try {
      const data = await scanQR(qrData);
      setResult(data);
    } catch (err) {
      setResult({ error: 'Server not reachable.' });
    }
    setLoading(false);
  };

  const loadDemo = (qr) => {
    setQrData(qr);
    setResult(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">📱</span>
        <div>
          <h2>QR DNA Scanner</h2>
          <p className="subtitle">Deep-scan any QR code before paying</p>
        </div>
      </div>

      <div className="demo-chips">
        {DEMO_QRS.map((d, i) => (
          <button key={i} className="chip" onClick={() => loadDemo(d.qr)}>
            {d.label}
          </button>
        ))}
      </div>

      <textarea
        value={qrData}
        onChange={(e) => setQrData(e.target.value)}
        placeholder="Paste QR data (e.g. upi://pay?pa=shop@paytm&pn=ShopName&am=500)"
        rows={3}
      />

      <button className="btn-primary" onClick={handleScan} disabled={loading}>
        {loading ? '⏳ Scanning...' : '🔍 Scan QR DNA'}
      </button>

      {result && !result.error && (
        <div className={`result-box ${result.is_safe ? 'safe' : 'danger'}`}>
          <div className="result-header">
            <span className="result-badge">{result.badge}</span>
            <span className={`risk-level risk-${result.risk_level?.toLowerCase()}`}>
              {result.risk_level} RISK
            </span>
          </div>

          {result.qr_details && result.qr_details.upi_id && (
            <div className="qr-details">
              <div><strong>UPI:</strong> {result.qr_details.upi_id}</div>
              {result.qr_details.name && <div><strong>Name:</strong> {result.qr_details.name}</div>}
              {result.qr_details.amount && <div><strong>Amount:</strong> ₹{result.qr_details.amount}</div>}
            </div>
          )}

          {result.checks && (
            <div className="checks-grid">
              {Object.entries(result.checks).map(([key, val]) => (
                <div key={key} className={`check-item ${val.passed === true ? 'pass' : val.passed === false ? 'fail' : 'neutral'}`}>
                  <span className="check-icon">
                    {val.passed === true ? '✅' : val.passed === false ? '❌' : '➖'}
                  </span>
                  <span className="check-name">{key.replace(/_/g, ' ')}</span>
                  <span className="check-detail">{val.detail}</span>
                </div>
              ))}
            </div>
          )}

          {result.reasons && result.reasons.length > 0 && (
            <div className="reasons-list">
              <strong>⚠️ Reasons:</strong>
              <ul>
                {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          <div className="result-warning">{result.explanation_hindi}</div>
        </div>
      )}
      {result?.error && (
        <div className="result-box danger">{result.error}</div>
      )}
    </div>
  );
}
