const TOKEN_KEY = 'chaek-admin-github-token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token.trim());
}
