export function formatWorkflowErrorMessage(rawMsg: string): string {
  if (!rawMsg) return 'Lỗi khi lưu quy trình';
  if (rawMsg.includes('because it is referenced in issue history')) {
    const match = rawMsg.match(/'([^']+)'/);
    const stName = match ? match[1] : '';
    return `Không thể xóa trạng thái '${stName}' vì đã có dữ liệu trong lịch sử công việc.`;
  }
  if (rawMsg.includes('because it has') && rawMsg.includes('active issue')) {
    const match = rawMsg.match(/'([^']+)'/);
    const stName = match ? match[1] : '';
    return `Không thể xóa trạng thái '${stName}' vì đang có công việc thuộc trạng thái này.`;
  }
  return rawMsg;
}
