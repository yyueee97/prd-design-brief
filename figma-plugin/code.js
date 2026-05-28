figma.showUI(__html__, { width: 360, height: 430, themeColors: true });

const desktopSize = { width: 960, height: 720 };
const mobileSize = { width: 390, height: 844 };

figma.ui.onmessage = async (message) => {
  if (message.type !== "create-wireframes") return;

  const payload = message.payload;
  const pageName = payload?.target?.pageName || "PRD UX Brief";
  const frames = Array.isArray(payload?.frames) ? payload.frames : [];
  const theme = payload.theme || {};

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const page = figma.createPage();
  page.name = pageName;
  figma.currentPage = page;

  createCover(payload, theme);
  frames.forEach((frameData, index) => createWireframe(frameData, index, theme));

  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.notify(`已生成 ${frames.length} 个 UX 线框图`);
};

function createCover(payload, theme) {
  const frame = figma.createFrame();
  frame.name = "UX Brief / Overview";
  frame.resize(960, 520);
  frame.x = 0;
  frame.y = 0;
  frame.fills = [paint("#ffffff")];
  frame.cornerRadius = 16;
  frame.strokes = [paint("#ded7eb")];

  addText(frame, payload.document?.title || "UX Design Brief", 48, 44, 760, 42, 28, "Bold", theme.text);
  addText(frame, `产品类型：${payload.document?.productType || "-"}    平台：${payload.document?.platform || "-"}`, 48, 100, 760, 24, 14, "Regular", theme.muted);

  addSection(frame, "设计目标", payload.document?.goals || [], 48, 160, theme);
  addSection(frame, "目标用户", payload.document?.users || [], 360, 160, theme);
  addSection(frame, "风险提醒", payload.document?.risks || [], 672, 160, theme, true);
}

function createWireframe(frameData, index, theme) {
  const size = frameData.size === "mobile" ? mobileSize : desktopSize;
  const frame = figma.createFrame();
  frame.name = frameData.name || `Screen ${index + 1}`;
  frame.resize(size.width, size.height);
  frame.x = (index % 2) * (desktopSize.width + 80);
  frame.y = 620 + Math.floor(index / 2) * (desktopSize.height + 90);
  frame.fills = [paint("#ffffff")];
  frame.cornerRadius = 18;
  frame.strokes = [paint("#ded7eb")];

  addText(frame, frame.name, 32, 28, size.width - 64, 28, 20, "Bold", theme.text);
  addBlock(frame, 32, 78, size.width - 64, 42, theme.primary || "#7c3aed");

  const contentTop = 148;
  const gap = 18;
  const columnWidth = size.width > 500 ? (size.width - 82) / 2 : size.width - 64;
  const blocks = frameData.sections || ["导航 / 标题区", "核心内容区", "状态反馈区", "主操作区"];

  blocks.forEach((label, blockIndex) => {
    const isTwoColumn = size.width > 500;
    const x = isTwoColumn ? 32 + (blockIndex % 2) * (columnWidth + gap) : 32;
    const y = contentTop + Math.floor(blockIndex / (isTwoColumn ? 2 : 1)) * 150;
    addBlock(frame, x, y, columnWidth, 112, "#f1edf8");
    addText(frame, label, x + 16, y + 14, columnWidth - 32, 20, 13, "Bold", theme.text);
    addBlock(frame, x + 16, y + 48, columnWidth - 32, 12, "#d8cee8");
    addBlock(frame, x + 16, y + 72, columnWidth * 0.62, 12, "#e7e1f0");
  });

  addText(frame, "Notes: 低保真结构，可替换为团队组件库", 32, size.height - 56, size.width - 64, 20, 12, "Regular", theme.muted);
}

function addSection(parent, title, items, x, y, theme, warning = false) {
  addText(parent, title, x, y, 240, 22, 15, "Bold", warning ? theme.warning : theme.primary);
  const safeItems = items.slice(0, 5);
  safeItems.forEach((item, index) => {
    addText(parent, `• ${item}`, x, y + 36 + index * 30, 240, 22, 12, "Regular", theme.text);
  });
}

function addText(parent, text, x, y, width, height, fontSize, style, color) {
  const node = figma.createText();
  node.characters = String(text);
  node.fontName = { family: "Inter", style };
  node.fontSize = fontSize;
  node.lineHeight = { unit: "PERCENT", value: 130 };
  node.fills = [paint(color || "#121722")];
  node.resize(width, height);
  node.x = x;
  node.y = y;
  parent.appendChild(node);
  return node;
}

function addBlock(parent, x, y, width, height, color) {
  const node = figma.createRectangle();
  node.resize(width, height);
  node.x = x;
  node.y = y;
  node.cornerRadius = 8;
  node.fills = [paint(color)];
  parent.appendChild(node);
  return node;
}

function paint(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    type: "SOLID",
    color: {
      r: ((value >> 16) & 255) / 255,
      g: ((value >> 8) & 255) / 255,
      b: (value & 255) / 255,
    },
  };
}
