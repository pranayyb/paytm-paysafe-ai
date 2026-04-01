import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── User APIs ───

export const checkScam = async (message, paymentContext = null) => {
  const { data } = await client.post('/scam/check', {
    message,
    payment_context: paymentContext,
  });
  return data;
};

export const getScamPatterns = async () => {
  const { data } = await client.get('/scam/patterns');
  return data;
};

export const getTrustBadge = async (upiId) => {
  const { data } = await client.get(`/trust/${upiId}`);
  return data;
};

export const scanQR = async (qrData, userLocation = null) => {
  const { data } = await client.post('/qr/scan', {
    qr_data: qrData,
    user_location: userLocation,
  });
  return data;
};

export const voicePayment = async (audioFile) => {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  const { data } = await client.post('/voice/pay', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ─── Merchant APIs ───

export const getMerchantInsights = async (merchantId, period = 'week') => {
  const { data } = await client.get('/merchant/insights', {
    params: { merchant_id: merchantId, period },
  });
  return data;
};

export const getMerchantAnomalies = async (merchantId) => {
  const { data } = await client.get('/merchant/anomalies', {
    params: { merchant_id: merchantId },
  });
  return data;
};

export const sendWhatsAppReport = async (merchantId, phone) => {
  const { data } = await client.post('/merchant/send-report', {
    merchant_id: merchantId,
    phone,
  });
  return data;
};

export const listMerchants = async () => {
  const { data } = await client.get('/merchant/list');
  return data;
};

export default client;
