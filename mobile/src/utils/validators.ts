export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

export function isValidOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

export function isValidUpiId(upiId: string): boolean {
  return /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 100000;
}
