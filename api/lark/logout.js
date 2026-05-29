const { clearTokenCookie, sendJson } = require("../_lark");

module.exports = async function handler(req, res) {
  clearTokenCookie(res);
  sendJson(res, 200, { ok: true });
};
