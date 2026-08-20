// Guest auth: this MVP has no login screen. On first load we silently
// register a random device-bound account and cache its credentials, so the
// backend's JWT-guarded endpoints work without ever showing a login UI.
const EMAIL_KEY = 'hfl_guest_email';
const PASSWORD_KEY = 'hfl_guest_password';
const TOKEN_KEY = 'hfl_token';

function randomToken(len: number) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getOrCreateCredentials() {
  let email = localStorage.getItem(EMAIL_KEY);
  let password = localStorage.getItem(PASSWORD_KEY);
  let isNew = false;
  if (!email || !password) {
    email = `guest-${randomToken(8)}@halfface.local`;
    password = randomToken(16);
    localStorage.setItem(EMAIL_KEY, email);
    localStorage.setItem(PASSWORD_KEY, password);
    isNew = true;
  }
  return { email, password, isNew };
}

async function requestToken(path: 'register' | 'login', body: Record<string, string>) {
  const res = await fetch(`/api/v1/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

let inflight: Promise<string> | null = null;

export function getCachedToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function ensureToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = getCachedToken();
    if (cached) return cached;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const { email, password, isNew } = getOrCreateCredentials();
    // Brand-new credentials have never been registered, so skip the
    // guaranteed-to-401 login attempt and go straight to register.
    let token = isNew ? null : await requestToken('login', { email, password });
    if (!token) {
      token = await requestToken('register', { email, password });
    }
    if (!token) {
      throw new Error('게스트 인증에 실패했습니다. 네트워크 연결을 확인해 주세요.');
    }
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
