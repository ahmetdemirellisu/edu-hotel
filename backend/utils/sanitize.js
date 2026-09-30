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

function validatePassword(password) {
  if (typeof password !== 'string') return { valid: false, message: 'Password is required.' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' };
  if (password.length > 128) return { valid: false, message: 'Password too long.' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter.' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter.' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a digit.' };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: 'Password must contain a special character.' };
  return { valid: true, message: '' };
}

module.exports = { escapeHtml, stripPassword, parsePagination, validateEnum, validateEmail, validatePassword, BLOCKED_CHARS };
