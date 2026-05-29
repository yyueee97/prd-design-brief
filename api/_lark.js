const LARK_BASE = "https://open.feishu.cn";
const TOKEN_COOKIE = "lark_user_access_token";

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getRedirectUri(req) {
  if (process.env.LARK_REDIRECT_URI) return process.env.LARK_REDIRECT_URI;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}/api/lark/callback`;
}

function getCookie(req, name) {
  const raw = req.headers.cookie || "";
  const part = raw.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

function setTokenCookie(res, token, expiresIn = 7200) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  res.setHeader(
    "Set-Cookie",
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${expiresIn}; SameSite=Lax;${secure}`,
  );
}

function clearTokenCookie(res) {
  res.setHeader("Set-Cookie", `${TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;`);
}

function getUserAccessToken(req) {
  return getCookie(req, TOKEN_COOKIE);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code) {
    const message = data.msg || data.message || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function exchangeCodeForUserToken(req, code) {
  const data = await requestJson(`${LARK_BASE}/open-apis/authen/v1/oidc/access_token`, {
    method: "POST",
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: getEnv("LARK_APP_ID"),
      client_secret: getEnv("LARK_APP_SECRET"),
      redirect_uri: getRedirectUri(req),
    }),
  });
  return data.data || data;
}

async function larkFetch(path, token, options = {}) {
  return requestJson(`${LARK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

function parseLarkToken(urlOrToken) {
  const match = String(urlOrToken).match(/\/(?:docx|docs|wiki)\/([a-zA-Z0-9]+)/);
  return match?.[1] || String(urlOrToken).trim();
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function sendError(res, error) {
  sendJson(res, error.status || 500, {
    ok: false,
    error: error.message || "Internal server error",
    details: error.payload,
  });
}

module.exports = {
  LARK_BASE,
  TOKEN_COOKIE,
  clearTokenCookie,
  exchangeCodeForUserToken,
  getEnv,
  getRedirectUri,
  getUserAccessToken,
  larkFetch,
  parseLarkToken,
  sendError,
  sendJson,
  setTokenCookie,
};
