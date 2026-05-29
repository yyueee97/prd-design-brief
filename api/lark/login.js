const { getEnv, getRedirectUri } = require("../_lark");

module.exports = async function handler(req, res) {
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    app_id: getEnv("LARK_APP_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    state: "prd-design-brief",
  });

  res.statusCode = 302;
  res.setHeader("Location", `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`);
  res.end();
};
