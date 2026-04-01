import { useState } from 'react';
import ScamShield from './components/ScamShield';
import TrustBadge from './components/TrustBadge';
import QRScanner from './components/QRScanner';
import VoicePayment from './components/VoicePayment';
import MerchantDashboard from './components/MerchantDashboard';
import './App.css';

const TABS = [
  { id: 'scam', label: '🔴 Scam Shield', component: ScamShield },
  { id: 'trust', label: '🟢 Trust Badge', component: TrustBadge },
  { id: 'qr', label: '📱 QR Scanner', component: QRScanner },
  { id: 'voice', label: '🎙️ Voice Pay', component: VoicePayment },
  { id: 'merchant', label: '📊 Merchant', component: MerchantDashboard },
];

function App() {
  const [activeTab, setActiveTab] = useState('scam');
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component;

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🛡️</span>
          <div>
            <h1>PaySafe AI</h1>
            <p className="tagline">India's Intelligent Payment Guardian</p>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {ActiveComponent && <ActiveComponent />}
      </main>

      <footer className="app-footer">
        <p>Built for Fin-O-Hack — Paytm × ASSETS DTU 2026</p>
      </footer>
    </div>
  );
}

export default App;
