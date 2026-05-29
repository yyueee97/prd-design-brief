const { getUserAccessToken, larkFetch, parseLarkToken, sendError, sendJson } = require("./_lark");

module.exports = async function handler(req, res) {
  try {
    const token = getUserAccessToken(req);
    if (!token) {
      sendJson(res, 401, { ok: false, needsAuth: true, error: "Feishu authorization required" });
      return;
    }

    const doc = req.query.url || req.query.doc || "";
    const documentId = parseLarkToken(doc);
    if (!documentId) {
      sendJson(res, 400, { ok: false, error: "Missing Feishu document URL or token" });
      return;
    }

    const data = await fetchDocumentContent(documentId, token);
    sendJson(res, 200, {
      ok: true,
      token: documentId,
      markdown: data.markdown,
      text: data.text,
      raw: data.raw,
    });
  } catch (error) {
    sendError(res, error);
  }
};

async function fetchDocumentContent(documentId, token) {
  const attempts = [
    `/open-apis/docx/v1/documents/${documentId}/raw_content?lang=0`,
    `/open-apis/docx/v1/documents/${documentId}/raw_content`,
    `/open-apis/docx/v1/documents/${documentId}`,
  ];

  let lastError;
  for (const path of attempts) {
    try {
      const raw = await larkFetch(path, token);
      const content = raw.data?.content || raw.data?.document?.content || raw.data?.document?.title || "";
      const title = raw.data?.document?.title || raw.data?.title || "";
      const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
      return {
        markdown: title && !text.startsWith("#") ? `# ${title}\n\n${text}` : text,
        text,
        raw,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to fetch Feishu document");
}
