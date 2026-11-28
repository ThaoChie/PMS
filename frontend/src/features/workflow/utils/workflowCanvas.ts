export const NODE_Y = 100;
export const NODE_W = 130;
export const NODE_H = 44;

export function getDisplayStatusName(name: string, maxLen = 12): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trim()}…`;
}

export function computeWorkflowCanvasLayout(statusCount: number) {
  const PADDING_LEFT = 60;
  const PADDING_RIGHT = NODE_W + 50; // >= NODE_W + 40 đảm bảo mọi ô (từ ô đầu tới ô cuối) không bị cắt lẹm
  const minStep = 175;
  const svgH = 240;
  const svgW = Math.max(
    760,
    PADDING_LEFT + (statusCount > 1 ? (statusCount - 1) * minStep : NODE_W) + PADDING_RIGHT
  );

  const getNodeX = (index: number) => {
    if (statusCount <= 1) return PADDING_LEFT;
    const totalTrackW = svgW - PADDING_LEFT - PADDING_RIGHT;
    const step = totalTrackW / (statusCount - 1);
    return PADDING_LEFT + index * step;
  };

  return { svgW, svgH, getNodeX, NODE_W, NODE_H, NODE_Y, PADDING_LEFT, PADDING_RIGHT };
}
