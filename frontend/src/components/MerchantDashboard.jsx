import { useState } from 'react';
import { getMerchantInsights, getMerchantAnomalies, sendWhatsAppReport } from '../api/client';

const DEMO_MERCHANTS = [
  { id: 'ramesh_med1@paytm', label: 'Ramesh Medical' },
  { id: 'demo_merchant_001@paytm', label: 'Sharma Kirana' },
  { id: 'shady_shop@paytm', label: 'Quick Cash Shop' },
  { id: 'new_restaurant@paytm', label: 'Tasty Bites' },
];

export default function MerchantDashboard() {
  const [merchantId, setMerchantId] = useState(DEMO_MERCHANTS[0].id);
  const [insights, setInsights] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState(null);

  const fetchData = async (id) => {
    const mid = id || merchantId;
    setMerchantId(mid);
    setLoading(true);
    try {
      const [insData, anomData] = await Promise.all([
        getMerchantInsights(mid, 'week'),
        getMerchantAnomalies(mid),
      ]);
      setInsights(insData);
      setAnomalies(anomData);
    } catch (err) {
      setInsights({ error: 'Server not reachable.' });
    }
    setLoading(false);
  };

  const handleSendReport = async () => {
    setWhatsappStatus('sending');
    try {
      await sendWhatsAppReport(merchantId);
      setWhatsappStatus('sent');
    } catch {
      setWhatsappStatus('error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">📊</span>
        <div>
          <h2>Merchant Dashboard</h2>
          <p className="subtitle">Business intelligence + anomaly alerts</p>
        </div>
      </div>

      <div className="demo-chips">
        {DEMO_MERCHANTS.map((m) => (
          <button
            key={m.id}
            className={`chip ${merchantId === m.id ? 'active' : ''}`}
            onClick={() => fetchData(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading">⏳ Loading insights...</div>}

      {insights && !insights.error && (
        <div className="dashboard-grid">
          {/* Revenue Cards */}
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-value">₹{insights.revenue?.today?.toLocaleString()}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">₹{insights.revenue?.yesterday?.toLocaleString()}</div>
              <div className="stat-label">Yesterday</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">₹{insights.revenue?.this_period?.toLocaleString()}</div>
              <div className="stat-label">This Week</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-value">
                {insights.revenue?.change_pct >= 0 ? '📈' : '📉'} {insights.revenue?.change_pct}%
              </div>
              <div className="stat-label">vs Last Week</div>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="section">
            <h3>👥 Customers</h3>
            <div className="customer-stats">
              <span>Total: <strong>{insights.customers?.total}</strong></span>
              <span>Repeat: <strong>{insights.customers?.repeat} ({insights.customers?.repeat_pct}%)</strong></span>
              <span>New: <strong>{insights.customers?.new}</strong></span>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="section">
            <h3>⏰ Peak Hours</h3>
            <div className="peak-hours">
              {insights.peak_hours?.map((h, i) => (
                <span key={i} className="peak-tag">{h}</span>
              ))}
            </div>
          </div>

          {/* Weekly Pattern */}
          {insights.weekly_pattern && (
            <div className="section">
              <h3>📅 Weekly Pattern</h3>
              <div className="weekly-bars">
                {insights.weekly_pattern.map((d) => {
                  const maxRev = Math.max(...insights.weekly_pattern.map(x => x.revenue));
                  const pct = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0;
                  return (
                    <div key={d.day} className="day-bar">
                      <div className="bar-fill" style={{ height: `${pct}%` }} />
                      <span className="day-label">{d.day}</span>
                      <span className="day-rev">₹{d.revenue.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Insight */}
          <div className="section insight-box">
            <h3>💡 AI Insight</h3>
            <p>{insights.llm_insight}</p>
            <div className="recommendations">
              {insights.recommendations?.map((r, i) => (
                <div key={i} className="rec-item">💡 {r}</div>
              ))}
            </div>
          </div>

          {/* Anomalies */}
          {anomalies && anomalies.has_anomalies && (
            <div className="section anomaly-section">
              <h3>🚨 Anomaly Alerts ({anomalies.alert_count})</h3>
              {anomalies.alerts.map((alert, i) => (
                <div key={i} className={`alert-card severity-${alert.severity}`}>
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-detail">{alert.detail_hindi}</div>
                </div>
              ))}
            </div>
          )}

          {/* WhatsApp Report */}
          <button className="btn-whatsapp" onClick={handleSendReport}>
            {whatsappStatus === 'sending' ? '📤 Sending...' :
             whatsappStatus === 'sent' ? '✅ Report Sent!' :
             '📱 Send WhatsApp Report'}
          </button>
        </div>
      )}
      {insights?.error && (
        <div className="result-box danger">{insights.error}</div>
      )}
    </div>
  );
}
