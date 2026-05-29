const { exchangeCodeForUserToken, sendError, setTokenCookie } = require("../_lark");

module.exports = async function handler(req, res) {
  try {
    const { code } = req.query || {};
    if (!code) {
      res.statusCode = 400;
      res.end("Missing code");
      return;
    }

    const tokenData = await exchangeCodeForUserToken(req, code);
    const token = tokenData.access_token || tokenData.user_access_token;
    if (!token) throw new Error("No user access token returned by Feishu");

    setTokenCookie(res, token, tokenData.expires_in || 7200);
    res.statusCode = 302;
    res.setHeader("Location", "/?lark=connected");
    res.end();
  } catch (error) {
    sendError(res, error);
  }
};
