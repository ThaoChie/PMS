import { describe, it, expect } from 'vitest';
import {
  computeWorkflowCanvasLayout,
  getDisplayStatusName,
  NODE_W,
} from '../features/workflow/utils/workflowCanvas';

describe('workflowCanvas layout and truncation', () => {
  it('ensures paddingRight >= NODE_W + 40 for any number of statuses', () => {
    for (const count of [1, 2, 3, 4, 5, 6, 8, 10]) {
      const layout = computeWorkflowCanvasLayout(count);
      expect(layout.PADDING_RIGHT).toBeGreaterThanOrEqual(NODE_W + 40);
    }
  });

  it('guarantees that every status node (from first to last) is fully visible inside svgW without being cut off', () => {
    for (const count of [1, 2, 3, 4, 5, 6, 7]) {
      const layout = computeWorkflowCanvasLayout(count);

      // First node check
      const firstX = layout.getNodeX(0);
      expect(firstX).toBeGreaterThanOrEqual(layout.PADDING_LEFT);

      // Last node check
      const lastIndex = count - 1;
      const lastX = layout.getNodeX(lastIndex);
      const lastRightEdge = lastX + layout.NODE_W;

      // The rightmost edge of the last box must have at least 40px margin from svgW
      expect(lastRightEdge).toBeLessThanOrEqual(layout.svgW - 40);
    }
  });

  it('correctly handles 4 and 5 statuses so that the last status has complete rounded corners inside svgW', () => {
    const layout5 = computeWorkflowCanvasLayout(5);
    const lastX = layout5.getNodeX(4);
    const lastRightEdge = lastX + layout5.NODE_W;

    // Must be fully inside viewBox with safety margin
    expect(lastRightEdge).toBeLessThan(layout5.svgW);
    expect(layout5.svgW - lastRightEdge).toBeGreaterThanOrEqual(50);
  });

  it('truncates long status names with ellipsis and leaves short names intact', () => {
    expect(getDisplayStatusName('To Do')).toBe('To Do');
    expect(getDisplayStatusName('In Progress')).toBe('In Progress');
    expect(getDisplayStatusName('Done')).toBe('Done');

    // Long names
    expect(getDisplayStatusName('Pending Approval')).toBe('Pending App…');
    expect(getDisplayStatusName('Chờ khách hàng duyệt')).toBe('Chờ khách h…');
    expect(getDisplayStatusName('')).toBe('');
  });
});
