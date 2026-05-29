const { getUserAccessToken, sendJson } = require("../_lark");

module.exports = async function handler(req, res) {
  sendJson(res, 200, {
    ok: true,
    connected: Boolean(getUserAccessToken(req)),
  });
};
