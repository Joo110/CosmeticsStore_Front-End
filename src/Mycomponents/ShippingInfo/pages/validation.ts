// shared validation helpers (moved out for reuse)
export const isValidName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  const re = /^[\p{L}\s\-.'\u0640]{2,}$/u;
  return re.test(trimmed);
};

export const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export const isValidPostalCode = (code: string) => {
  const trimmed = code.trim();
  return /^\d{3,10}$/.test(trimmed);
};

export const isValidAddress = (addr: string) => addr.trim().length >= 5;
export const isValidCity = (city: string) => city.trim().length >= 2;

export const luhnCheck = (cardNumber: string) => {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0 && digits.length >= 13 && digits.length <= 19;
};

export const isValidExpiry = (mmYY: string) => {
  const cleaned = mmYY.replace(/\s/g, '');
  const m = cleaned.match(/^(\d{2})(?:\/|-)?(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiry = new Date(year, month - 1, 1);
  expiry.setMonth(expiry.getMonth() + 1);
  expiry.setDate(0);
  return expiry >= new Date(now.getFullYear(), now.getMonth(), 1);
};

export const isValidCVV = (cvv: string) => /^\d{3,4}$/.test(cvv.trim());
