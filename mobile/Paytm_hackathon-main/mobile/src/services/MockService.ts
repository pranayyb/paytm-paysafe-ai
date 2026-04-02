/**
 * Paytm AI VoiceGuard - Mock Service for Design Prototype
 * Provides high-fidelity static data to simulate a live backend experience.
 */

export const MOCK_PROFILE = {
  user_id: "demo_user_001",
  name: "Piyush",
  email: "demo@paytm.com",
  phone: "+91 98765 43210",
  voice_enrolled: true,
  security_score: 98,
  kyc_status: "Verified"
};

export const MOCK_BALANCE = {
  wallet: 14580.50,
  bank: 85200.00,
  pay_later: 5000.00
};

export const MOCK_TRANSACTIONS = [
  { id: "TX101", type: "sent", amount: 500.00, recipient: "Rahul Sharma", memo: "Voice Pay Success", category: "Transfer", timestamp: new Date(), status: "completed" },
  { id: "TX102", type: "received", amount: 1200.00, recipient: "Cashback", memo: "Paytm Rewards", category: "Cashback", timestamp: new Date(Date.now() - 86400000), status: "completed" },
  { id: "TX103", type: "sent", amount: 199.00, recipient: "Jio Prepaid", memo: "Mobile Recharge", category: "Recharge", timestamp: new Date(Date.now() - 172800000), status: "completed" },
  { id: "TX104", type: "received", amount: 4500.00, recipient: "Anjali Gupta", memo: "Rent Split", category: "Transfer", timestamp: new Date(Date.now() - 259200000), status: "completed" },
];

export const MOCK_NOTIFICATIONS = [
  { id: "N1", title: "Security Alert", body: "New login detected from Mumbai", time: "2h ago", read: false, type: "security" },
  { id: "N2", title: "Cashback Received", body: "₹50 credited to your wallet", time: "5h ago", read: true, type: "payment" },
  { id: "N3", title: "VoiceGuard Active", body: "Your voice biometrics are securing your payments", time: "1d ago", read: true, type: "security" },
];

export const MockService = {
  getProfile: () => Promise.resolve(MOCK_PROFILE),
  getBalance: () => Promise.resolve(MOCK_BALANCE),
  getTransactions: () => Promise.resolve(MOCK_TRANSACTIONS),
  getNotifications: () => Promise.resolve(MOCK_NOTIFICATIONS),
  
  // Simulated Auth
  login: (email: string) => Promise.resolve({ token: "mock_token_" + Date.now(), user: MOCK_PROFILE }),
  sendOtp: (email: string) => Promise.resolve({ message: "Mock OTP sent to " + email }),
  
  // Simulated Actions
  processVoicePay: (amount: number, recipient: string) => new Promise((resolve) => {
    setTimeout(() => resolve({ status: "success", amount, recipient, tx_id: "VOICE" + Date.now() }), 2000);
  }),
  
  processRecharge: (number: string, amount: number) => new Promise((resolve) => {
    setTimeout(() => resolve({ status: "success", number, amount, tx_id: "RCH" + Date.now() }), 1500);
  })
};
