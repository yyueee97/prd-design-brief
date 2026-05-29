const { getUserAccessToken, larkFetch, sendError, sendJson } = require("../_lark");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }

    const token = getUserAccessToken(req);
    if (!token) {
      sendJson(res, 401, { ok: false, needsAuth: true, error: "Feishu authorization required" });
      return;
    }

    const body = await readBody(req);
    const markdown = body.markdown || "";
    if (!markdown.trim()) {
      sendJson(res, 400, { ok: false, error: "Missing markdown" });
      return;
    }

    const title = extractTitle(markdown);
    const created = await createDocument(title, token);
    const documentId = created.data?.document?.document_id || created.data?.document_id || created.data?.document?.token;

    if (documentId) {
      await appendMarkdownAsBlocks(documentId, markdown, token);
    }

    sendJson(res, 200, {
      ok: true,
      url: created.data?.document?.url || created.data?.url,
      documentId,
      raw: created,
    });
  } catch (error) {
    sendError(res, error);
  }
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function extractTitle(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "UX 设计文档";
}

async function createDocument(title, token) {
  return larkFetch("/open-apis/docx/v1/documents", token, {
    method: "POST",
    body: JSON.stringify({
      title,
    }),
  });
}

async function appendMarkdownAsBlocks(documentId, markdown, token) {
  const blocks = markdownToBlocks(markdown);
  if (!blocks.length) return;

  await larkFetch(`/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children`, token, {
    method: "POST",
    body: JSON.stringify({
      children: blocks.slice(0, 50),
    }),
  });
}

function markdownToBlocks(markdown) {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map((line) => {
      if (line.startsWith("## ")) return textBlock(3, line.slice(3));
      if (line.startsWith("# ")) return textBlock(3, line.slice(2));
      if (line.startsWith("- ")) return textBlock(12, line.slice(2));
      if (/^\d+\.\s+/.test(line)) return textBlock(13, line.replace(/^\d+\.\s+/, ""));
      return textBlock(2, line);
    });
}

function textBlock(blockType, text) {
  return {
    block_type: blockType,
    [blockType === 12 || blockType === 13 ? "bullet" : blockType === 3 ? "heading1" : "text"]: {
      elements: [
        {
          text_run: {
            content: text,
            text_element_style: {},
          },
        },
      ],
    },
  };
}
