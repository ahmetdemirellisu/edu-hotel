// backend/utils/sanitize.js

const BLOCKED_CHARS = /[<>"'\`;&|$(){}\[\]]/g;

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function stripPassword(data) {
  if (Array.isArray(data)) {
    return data.map(item => {
      const { password, ...rest } = item;
      return rest;
    });
  }
  if (data && typeof data === 'object') {
    const { password, ...rest } = data;
    return rest;
  }
  return data;
}

function parsePagination(query, maxLimit = 50) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function validateEnum(value, allowed) {
  return allowed.includes(value);
}

function validateEmail(email) {
  if (typeof email !== 'string') return { valid: false, email: '' };
  const trimmed = email.trim().toLowerCase();
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(trimmed)) return { valid: false, email: trimmed };
  return { valid: true, email: trimmed };
}

/**
 * Validates password policy. `lang` ('tr' | 'en', default 'en') selects the
 * language of the returned message — callers pass reqLang(req).
 */
function validatePassword(password, lang = 'en') {
  const t = (en, tr) => (lang === 'tr' ? tr : en);
  if (typeof password !== 'string') return { valid: false, message: t('Password is required.', 'Şifre gereklidir.') };
  if (password.length < 8) return { valid: false, message: t('Password must be at least 8 characters.', 'Şifre en az 8 karakter olmalıdır.') };
  if (password.length > 128) return { valid: false, message: t('Password too long.', 'Şifre çok uzun.') };
  if (!/[A-Z]/.test(password)) return { valid: false, message: t('Password must contain an uppercase letter.', 'Şifre en az bir büyük harf içermelidir.') };
  if (!/[a-z]/.test(password)) return { valid: false, message: t('Password must contain a lowercase letter.', 'Şifre en az bir küçük harf içermelidir.') };
  if (!/[0-9]/.test(password)) return { valid: false, message: t('Password must contain a digit.', 'Şifre en az bir rakam içermelidir.') };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: t('Password must contain a special character.', 'Şifre en az bir özel karakter içermelidir.') };
  return { valid: true, message: '' };
}

module.exports = { escapeHtml, stripPassword, parsePagination, validateEnum, validateEmail, validatePassword, BLOCKED_CHARS };
