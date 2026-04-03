import { API_BASE_URL } from '@config/env';

// ─── Response Types ───────────────────────────────────────────────

export interface TrustScoreResponse {
  upi_id: string;
  trust_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  badge: string;
  account_age_days: number;
  total_transactions: number;
  complaint_count: number;
  dispute_count: number;
}

export interface QRScanResponse {
  is_safe: boolean;
  trust_score: number;
  risk_level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: string[];
  warning_hindi: string;
  upi_id: string;
  name: string;
  complaint_count: number;
  account_age_days: number;
}

export interface ScamCheckResponse {
  is_scam: boolean;
  confidence: number;
  scam_type: string | null;
  warning_hindi: string;
  matched_patterns: Array<{ type: string; confidence: number }>;
}

export interface ScamPattern {
  type: string;
  description: string;
  examples: string[];
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
}

export interface URLCheckResponse {
  is_fraud: boolean;
  confidence: number;
  risk_level: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
  risk_factors: string[];
  warning_hindi: string;
}

export interface VoicePayResponse {
  status: 'PENDING_CONFIRMATION' | 'ERROR';
  transaction_id: string;
  receiver: string;
  amount: number;
  message: string;
  audio_url?: string;
}

export interface VoiceConfirmResponse {
  status: string;
  message: string;
  audio_url?: string;
}

export interface VoiceVerifyPinResponse {
  status: 'SUCCESS' | 'FAILED';
  message: string;
  transaction_id: string;
  audio_url?: string;
}

export interface MerchantInsightsResponse {
  merchant: { name: string; category: string; upi_id: string } | null;
  revenue: {
    today: number;
    yesterday: number;
    this_period: number;
    previous_period: number;
    change_pct: number;
    total_transactions: number;
  };
  customers: { total: number; repeat: number; new: number; repeat_pct: number };
  peak_hours: string[];
  hourly_heatmap: Array<{ hour: string; transactions: number; revenue: number }>;
  weekly_pattern: Array<{ day: string; day_hindi: string; revenue: number; transactions: number }>;
  top_customers: Array<{ upi_id: string; name: string; visits: number; total_spent: number }>;
  llm_insight: string;
  recommendations: string[];
  fraud_analysis: any;
  anomalies: string[];
  velocity_alert: boolean;
  amount_alert: boolean;
  risk_assessment: any;
  velocity_metrics: any;
  security_alerts: string[];
}

export interface MerchantAnomalyResponse {
  merchant_id: string;
  has_anomalies: boolean;
  anomalies: Array<{
    type: string;
    description: string;
    severity: string;
    timestamp?: string;
  }>;
}

export interface MerchantVoiceQueryResponse {
  query_text: string;
  answer_text: string;
  voice_response_url: string;
  insights_summary?: any;
}

export interface Merchant {
  id: number;
  upi_id: string;
  name: string;
  category: string;
  phone: string;
}

// ─── HTTP helpers ─────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${res.status}] ${text}`);
  }
  return res.json() as Promise<T>;
}

async function multipart<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    },
    body: form
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${res.status}] ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── API surface ──────────────────────────────────────────────────

export const api = {
  trust: {
    getScore: (upiId: string) =>
      request<TrustScoreResponse>(`/trust/${encodeURIComponent(upiId)}`),
  },

  qr: {
    scan: async (qrData: string, location?: string) => {
      const res = await request<any>('/qr/scan', {
        method: 'POST',
        body: JSON.stringify({ qr_data: qrData, location }),
      });
      return {
        is_safe: res.is_safe ?? false,
        trust_score: res.trust_data?.trust_score ?? res.risk_score ?? 0,
        risk_level: res.risk_level ?? 'MEDIUM',
        risk_factors: res.reasons || [],
        warning_hindi: res.explanation_hindi || '',
        upi_id: res.qr_details?.upi_id || '',
        name: res.qr_details?.name || '',
        complaint_count: parseInt(res.checks?.complaints?.detail?.match(/\d+/)?.[0] || '0', 10),
        account_age_days: parseInt(res.checks?.account_age?.detail?.match(/\d+/)?.[0] || '0', 10),
      } as QRScanResponse;
    },
    scanImage: async (form: FormData) => {
      const outerRes = await multipart<any>('/qr/scan-image', form);
      const res = outerRes.analysis || {};
      return {
        is_safe: res.is_safe ?? false,
        trust_score: res.trust_data?.trust_score ?? res.risk_score ?? 0,
        risk_level: res.risk_level ?? 'MEDIUM',
        risk_factors: res.reasons || [],
        warning_hindi: res.explanation_hindi || '',
        upi_id: res.qr_details?.upi_id || '',
        name: res.qr_details?.name || '',
        complaint_count: parseInt(res.checks?.complaints?.detail?.match(/\d+/)?.[0] || '0', 10),
        account_age_days: parseInt(res.checks?.account_age?.detail?.match(/\d+/)?.[0] || '0', 10),
      } as QRScanResponse;
    },
  },

  scam: {
    checkMessage: (message: string, paymentContext?: string) =>
      request<ScamCheckResponse>('/scam/check', {
        method: 'POST',
        body: JSON.stringify({ message, payment_context: paymentContext }),
      }),
    getPatterns: () => request<ScamPattern[]>('/scam/patterns'),
  },

  url: {
    check: (url: string) =>
      request<URLCheckResponse>('/url/check', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
  },

  voice: {
    pay: async (form: FormData) => {
      const res = await multipart<any>('/voice/pay', form);
      // Flatten the backend's nested pending_payment object so UI binds correctly
      const status = (res.status === 'pending_confirmation' && res.transaction_id)
        ? 'PENDING_CONFIRMATION'
        : 'ERROR';
      return {
        status,
        transaction_id: res.transaction_id || '',
        receiver: res.pending_payment?.receiver_name || 'Unknown',
        amount: res.pending_payment?.amount || 0,
        message: res.pending_payment?.error || res.message || res.response || '',
        audio_url: res.voice_response_url,
      } as VoicePayResponse;
    },
    confirm: (transactionId: string, confirmationText: string, sender: string) =>
      request<VoiceConfirmResponse>('/voice/confirm', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: transactionId,
          confirmation_text: confirmationText,
          sender,
        }),
      }),
    verifyPin: (transactionId: string, pin: string) =>
      request<VoiceVerifyPinResponse>('/voice/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ transaction_id: transactionId, pin }),
      }),
  },

  feedback: {
    submit: (
      itemType: string,
      itemData: object,
      correctLabel: boolean,
      originalPrediction: boolean,
      userNote?: string,
    ) =>
      request<{ success: boolean }>('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          item_type: itemType,
          item_data: itemData,
          correct_label: correctLabel,
          original_prediction: originalPrediction,
          user_note: userNote,
        }),
      }),
  },

  merchant: {
    getInsights: (merchantId: string, period: 'day' | 'week' | 'month' = 'day') =>
      request<MerchantInsightsResponse>(
        `/merchant/insights?merchant_id=${encodeURIComponent(merchantId)}&period=${period}`,
      ),
    getAnomalies: (merchantId: string) =>
      request<MerchantAnomalyResponse>(
        `/merchant/anomalies?merchant_id=${encodeURIComponent(merchantId)}`,
      ),
    voiceQuery: (form: FormData) =>
      multipart<MerchantVoiceQueryResponse>('/merchant/voice-query', form),
    sendReport: (merchantId: string, phone: string) =>
      request<{ success: boolean }>('/merchant/send-report', {
        method: 'POST',
        body: JSON.stringify({ merchant_id: merchantId, phone }),
      }),
    list: () => request<Merchant[]>('/merchant/list'),
  },
};
