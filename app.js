const samplePrd = `# 智能会议纪要助手 PRD

## 背景
团队每天有大量线上会议，纪要分散在聊天和文档中，成员很难快速确认结论、待办和风险。

## 产品目标
- 帮助项目成员在会后 5 分钟内获得结构化纪要
- 降低 PM 手动整理会议结论的成本
- 让负责人可以追踪跨会议的待办进度

## 目标用户
- 项目 PM
- 设计师
- 研发负责人
- 业务 owner

## 核心需求
1. 用户可以上传会议录音或粘贴会议文本
2. 系统自动生成会议摘要、结论、待办和风险
3. 用户可以编辑纪要内容并分享给团队
4. 支持按项目查看历史会议和未完成待办

## 页面
- 首页工作台
- 上传会议页
- 纪要详情页
- 待办追踪页
- 分享设置弹窗

## 流程
进入首页 -> 上传会议材料 -> 生成纪要 -> 人工校对 -> 分享给团队 -> 跟踪待办

## 风险
- 录音转写不准确会影响纪要质量
- 会议内容涉及敏感信息，需要权限控制
- 长会议生成时间可能较长，需要加载状态

## 验收标准
- 上传后可以看到生成进度
- 纪要详情包含摘要、结论、待办、风险四类内容
- 分享链接可以设置查看权限
`;

const els = {
  prdFile: document.querySelector("#prdFile"),
  prdText: document.querySelector("#prdText"),
  larkDocUrl: document.querySelector("#larkDocUrl"),
  importLarkDoc: document.querySelector("#importLarkDoc"),
  larkStatus: document.querySelector("#larkStatus"),
  productType: document.querySelector("#productType"),
  platform: document.querySelector("#platform"),
  figmaFileUrl: document.querySelector("#figmaFileUrl"),
  figmaPageName: document.querySelector("#figmaPageName"),
  generate: document.querySelector("#generate"),
  loadSample: document.querySelector("#loadSample"),
  parseStatus: document.querySelector("#parseStatus"),
  goalCount: document.querySelector("#goalCount"),
  pageCount: document.querySelector("#pageCount"),
  riskCount: document.querySelector("#riskCount"),
  insights: document.querySelector("#insights"),
  docPreview: document.querySelector("#docPreview"),
  wireframes: document.querySelector("#wireframes"),
  copyDoc: document.querySelector("#copyDoc"),
  copyFigmaPayload: document.querySelector("#copyFigmaPayload"),
  createLarkDoc: document.querySelector("#createLarkDoc"),
  downloadDoc: document.querySelector("#downloadDoc"),
};

let currentMarkdown = "";
let currentFigmaPayload = {};

const sectionAliases = {
  background: ["背景", "项目背景", "业务背景", "现状"],
  goals: ["目标", "产品目标", "业务目标", "项目目标"],
  users: ["用户", "目标用户", "用户角色", "受众"],
  requirements: ["需求", "核心需求", "功能需求", "产品需求", "范围"],
  pages: ["页面", "页面清单", "功能页面", "模块", "功能模块"],
  flow: ["流程", "用户流程", "业务流程", "核心流程"],
  risks: ["风险", "问题", "待确认", "约束", "依赖"],
  acceptance: ["验收", "验收标准", "成功指标", "指标"],
};

function normalizeText(text) {
  return text.replace(/\r\n/g, "\n").replace(/\t/g, "  ").trim();
}

function getTitle(text) {
  const heading = text.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const firstLine = text.split("\n").find((line) => line.trim().length > 4);
  return firstLine ? firstLine.replace(/^#+\s*/, "").trim().slice(0, 36) : "未命名项目";
}

function splitSections(text) {
  const sections = {};
  const headingRegex = /^(#{1,4})\s*([^#\n]+)\s*$/gm;
  const matches = [...text.matchAll(headingRegex)];

  matches.forEach((match, index) => {
    const title = match[2].trim();
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    sections[title] = text.slice(start, end).trim();
  });

  return sections;
}

function findSection(sections, key) {
  const aliases = sectionAliases[key];
  const sectionName = Object.keys(sections).find((name) =>
    aliases.some((alias) => name.toLowerCase().includes(alias.toLowerCase())),
  );
  return sectionName ? sections[sectionName] : "";
}

function listify(content, fallback = []) {
  const lines = content
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter(Boolean)
    .filter((line) => !/^#+\s/.test(line));

  if (lines.length) return unique(lines.map((line) => line.slice(0, 80)));
  return fallback;
}

function unique(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function inferByKeywords(text, groups) {
  return groups.filter((item) => item.keywords.some((keyword) => text.includes(keyword))).map((item) => item.label);
}

function inferPages(text) {
  const pagePatterns = [
    { label: "首页 / 工作台", keywords: ["首页", "工作台", "看板", "dashboard"] },
    { label: "登录 / 权限页", keywords: ["登录", "注册", "权限", "SSO"] },
    { label: "列表页", keywords: ["列表", "历史", "记录", "搜索", "筛选"] },
    { label: "详情页", keywords: ["详情", "详情页", "查看"] },
    { label: "创建 / 编辑页", keywords: ["创建", "编辑", "新建", "填写", "表单"] },
    { label: "上传页", keywords: ["上传", "导入", "文件"] },
    { label: "设置页", keywords: ["设置", "配置", "偏好"] },
    { label: "分享弹窗", keywords: ["分享", "邀请", "协作"] },
  ];
  return inferByKeywords(text, pagePatterns);
}

function inferRisks(text) {
  const riskPatterns = [
    { label: "需要明确权限边界和信息可见范围", keywords: ["权限", "隐私", "敏感", "安全"] },
    { label: "需要覆盖加载、失败、空状态等边界体验", keywords: ["生成", "上传", "加载", "失败"] },
    { label: "关键流程较长，需要降低用户中断和迷失风险", keywords: ["流程", "步骤", "审批", "校对"] },
    { label: "内容质量依赖输入质量，需要提供校对和修正机制", keywords: ["识别", "转写", "AI", "自动"] },
  ];
  return inferByKeywords(text, riskPatterns);
}

function parsePrd(rawText) {
  const text = normalizeText(rawText);
  const sections = splitSections(text);
  const title = getTitle(text);
  const goals = listify(findSection(sections, "goals"), ["明确核心用户价值", "降低完成关键任务的操作成本"]);
  const users = listify(findSection(sections, "users"), ["主要使用者", "协作者", "管理员"]);
  const requirements = listify(findSection(sections, "requirements"), ["核心任务创建与处理", "结果查看与编辑", "协作分享"]);
  const pagesFromPrd = listify(findSection(sections, "pages"));
  const pages = unique([...pagesFromPrd, ...inferPages(text)]).slice(0, 8);
  const flowText = findSection(sections, "flow");
  const flow = flowText
    ? flowText
        .replace(/\n/g, " ")
        .split(/->|→|>|，|,|；|;/)
        .map((step) => step.trim())
        .filter(Boolean)
        .slice(0, 8)
    : ["进入入口", "完成核心输入", "系统处理", "查看结果", "确认并分享"];
  const risks = unique([...listify(findSection(sections, "risks")), ...inferRisks(text)]).slice(0, 8);
  const acceptance = listify(findSection(sections, "acceptance"), [
    "用户可以完成核心路径且无需额外解释",
    "关键状态具备清晰反馈",
    "设计稿覆盖主要页面、组件状态和异常分支",
  ]);
  const background = findSection(sections, "background") || "PRD 未明确描述背景，设计阶段需要补齐业务上下文、目标用户当前痛点和已有解决方式。";

  return {
    title,
    productType: els.productType.value,
    platform: els.platform.value,
    background,
    goals,
    users,
    requirements,
    pages: pages.length ? pages : ["首页 / 工作台", "核心任务页", "结果详情页", "设置 / 权限页"],
    flow,
    risks: risks.length ? risks : ["PRD 中仍有部分业务规则待明确", "需要补齐异常状态和权限边界"],
    acceptance,
  };
}

function buildMarkdown(data) {
  const pageList = data.pages.map((page, index) => `${index + 1}. ${page}`).join("\n");
  const visualList = data.pages
    .map((page) => `- ${page}：低保真线框图、关键状态、交互说明、空/错/加载状态`)
    .join("\n");

  return `# ${data.title} UX 设计文档

## 0. 项目概览
- 产品类型：${data.productType}
- 设计平台：${data.platform}
- 文档用途：用于设计启动、方案评审、研发交付说明的初版材料。

## 1. 项目背景
${data.background}

## 2. 设计目标
${data.goals.map((item) => `- ${item}`).join("\n")}

## 3. 目标用户
${data.users.map((item) => `- ${item}`).join("\n")}

## 4. 核心场景与需求
${data.requirements.map((item) => `- ${item}`).join("\n")}

## 5. 用户流程
${data.flow.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## 6. 页面与模块清单
${pageList}

## 7. 需要设计的图
${visualList}

## 8. 设计重点
- 信息层级：优先呈现用户完成主任务所需的信息，弱化低频配置。
- 反馈状态：覆盖初始、加载中、成功、失败、空数据、无权限等状态。
- 可编辑性：涉及自动生成或系统推荐内容时，需要保留人工校对和撤销入口。
- 协作交付：关键页面需补充研发可验收的交互说明和状态规则。

## 9. 风险与待确认问题
${data.risks.map((item) => `- ${item}`).join("\n")}

## 10. 设计验收标准
${data.acceptance.map((item) => `- ${item}`).join("\n")}
`;
}

function getFigmaFileKey(url) {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? "";
}

function getLarkDocToken(url) {
  const match = url.match(/\/(?:docx|docs|wiki)\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? "";
}

function buildFigmaPayload(data) {
  return {
    schema: "prd-to-figma-wireframes/v1",
    target: {
      fileUrl: els.figmaFileUrl.value.trim(),
      fileKey: getFigmaFileKey(els.figmaFileUrl.value.trim()),
      pageName: els.figmaPageName.value.trim() || "PRD UX Brief",
    },
    theme: {
      primary: "#4AA3FF",
      primaryDark: "#1976D2",
      warning: "#E5487B",
      text: "#121722",
      muted: "#667085",
      surface: "#FFFFFF",
    },
    document: {
      title: `${data.title} UX 设计文档`,
      productType: data.productType,
      platform: data.platform,
      goals: data.goals,
      users: data.users,
      flow: data.flow,
      risks: data.risks,
    },
    frames: data.pages.map((page, index) => ({
      id: `screen-${String(index + 1).padStart(2, "0")}`,
      name: page,
      size: data.platform.includes("iOS") || data.platform.includes("小程序") ? "mobile" : "desktop",
      sections: ["导航 / 标题区", "核心内容区", "状态反馈区", "主操作区"],
      notes: ["低保真线框图", "需要覆盖空状态、加载、失败、无权限", "后续可替换为高保真组件"],
    })),
  };
}

function markdownToHtml(markdown) {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  let html = "";
  let inList = false;
  let inOrderedList = false;

  lines.forEach((line) => {
    if (/^#\s+/.test(line)) {
      html += closeLists();
      html += `<h1>${line.replace(/^#\s+/, "")}</h1>`;
    } else if (/^##\s+/.test(line)) {
      html += closeLists();
      html += `<h2>${line.replace(/^##\s+/, "")}</h2>`;
    } else if (/^-\s+/.test(line)) {
      if (!inList) {
        html += closeOrderedList();
        html += "<ul>";
        inList = true;
      }
      html += `<li>${line.replace(/^-\s+/, "")}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inOrderedList) {
        html += closeUnorderedList();
        html += "<ol>";
        inOrderedList = true;
      }
      html += `<li>${line.replace(/^\d+\.\s+/, "")}</li>`;
    } else if (line.trim()) {
      html += closeLists();
      html += `<p>${line}</p>`;
    } else {
      html += closeLists();
    }
  });

  html += closeLists();
  return html;

  function closeLists() {
    return closeUnorderedList() + closeOrderedList();
  }

  function closeUnorderedList() {
    if (!inList) return "";
    inList = false;
    return "</ul>";
  }

  function closeOrderedList() {
    if (!inOrderedList) return "";
    inOrderedList = false;
    return "</ol>";
  }
}

function renderInsights(data) {
  els.goalCount.textContent = data.goals.length;
  els.pageCount.textContent = data.pages.length;
  els.riskCount.textContent = data.risks.length;
  els.parseStatus.textContent = "已解析";
  els.parseStatus.classList.add("ready");

  const cards = [
    ["产品目标", data.goals.slice(0, 2).join("；")],
    ["核心用户", data.users.slice(0, 4).join(" / ")],
    ["主流程", data.flow.join(" → ")],
    ["优先确认", data.risks[0]],
  ];

  els.insights.innerHTML = cards
    .map(
      ([title, body]) => `
        <div class="insight-card">
          <strong>${title}</strong>
          <p>${body}</p>
        </div>
      `,
    )
    .join("");
}

function renderWireframes(pages) {
  els.wireframes.innerHTML = pages
    .map(
      (page, index) => `
        <div class="wireframe-card">
          <div class="wireframe-title">
            <span>${page}</span>
            <span>#${String(index + 1).padStart(2, "0")}</span>
          </div>
          <div class="wireframe-sketch" aria-label="${page} 线框图占位">
            <div class="sketch-bar"></div>
            <div class="sketch-content">
              <div class="sketch-block"></div>
              <div class="sketch-block"></div>
              <div class="sketch-block"></div>
            </div>
            <div class="sketch-small"></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function generate() {
  const text = els.prdText.value.trim();
  if (!text) {
    els.prdText.value = samplePrd;
  }
  const parsed = parsePrd(els.prdText.value);
  currentMarkdown = buildMarkdown(parsed);
  currentFigmaPayload = buildFigmaPayload(parsed);
  els.docPreview.innerHTML = markdownToHtml(currentMarkdown);
  renderInsights(parsed);
  renderWireframes(parsed.pages);
}

els.prdFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  els.prdText.value = await file.text();
  generate();
});

els.importLarkDoc.addEventListener("click", async () => {
  const url = els.larkDocUrl.value.trim();
  const token = getLarkDocToken(url);
  if (!url || !token) {
    els.larkStatus.textContent = "请粘贴有效的飞书文档链接";
    return;
  }

  els.larkStatus.textContent = "正在尝试读取本地飞书导入服务...";
  try {
    const response = await fetch(`/api/lark-doc?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error("missing local service");
    const data = await response.json();
    els.prdText.value = data.markdown || data.text || "";
    els.larkStatus.textContent = "已从飞书文档导入 PRD";
    generate();
  } catch {
    els.larkStatus.textContent = `已识别文档 token：${token}。当前静态服务未接入飞书授权，请用 scripts/import-lark-prd.sh 拉取后粘贴正文。`;
  }
});

els.generate.addEventListener("click", generate);

els.loadSample.addEventListener("click", () => {
  els.prdText.value = samplePrd;
  generate();
});

els.copyDoc.addEventListener("click", async () => {
  if (!currentMarkdown) generate();
  await navigator.clipboard.writeText(currentMarkdown);
  els.copyDoc.textContent = "已复制";
  setTimeout(() => {
    els.copyDoc.textContent = "复制 Markdown";
  }, 1400);
});

els.copyFigmaPayload.addEventListener("click", async () => {
  if (!currentFigmaPayload.schema) generate();
  await navigator.clipboard.writeText(JSON.stringify(currentFigmaPayload, null, 2));
  els.copyFigmaPayload.textContent = "已复制";
  setTimeout(() => {
    els.copyFigmaPayload.textContent = "复制 Figma 数据";
  }, 1400);
});

els.createLarkDoc.addEventListener("click", async () => {
  if (!currentMarkdown) generate();
  els.createLarkDoc.textContent = "准备中";
  try {
    const response = await fetch("/api/lark-doc/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: currentMarkdown }),
    });
    if (!response.ok) throw new Error("missing local service");
    const data = await response.json();
    if (data.url) window.open(data.url, "_blank");
    els.createLarkDoc.textContent = "已创建";
  } catch {
    await navigator.clipboard.writeText(currentMarkdown);
    els.createLarkDoc.textContent = "已复制内容";
    alert("当前静态服务未接入飞书创建接口。已复制 Markdown，请用 scripts/create-lark-design-doc.sh 创建飞书文档。");
  } finally {
    setTimeout(() => {
      els.createLarkDoc.textContent = "创建飞书文档";
    }, 1800);
  }
});

els.downloadDoc.addEventListener("click", () => {
  if (!currentMarkdown) generate();
  const blob = new Blob([currentMarkdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ux-design-brief.md";
  link.click();
  URL.revokeObjectURL(url);
});

els.prdText.value = samplePrd;
generate();
