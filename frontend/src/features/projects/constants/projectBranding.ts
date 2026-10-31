import {
  Folder,
  Briefcase,
  Code,
  Layout,
  Box,
  Cpu,
  Globe,
  Zap,
  Shield,
  Rocket,
  Star,
  Terminal,
} from 'lucide-react';

export const PROJECT_COLORS = [
  { value: '#1A1A1A', label: 'Đen than' },
  { value: '#2563EB', label: 'Xanh dương' },
  { value: '#4F46E5', label: 'Chàm' },
  { value: '#7C3AED', label: 'Tím' },
  { value: '#DB2777', label: 'Hồng cánh sen' },
  { value: '#DC2626', label: 'Đỏ Ruby' },
  { value: '#D97706', label: 'Hổ phách' },
  { value: '#059669', label: 'Xanh ngọc' },
  { value: '#0891B2', label: 'Xanh mòng két' },
  { value: '#4B5563', label: 'Xám chì' },
];

export const PROJECT_ICONS = [
  { id: 'folder', label: 'Thư mục', icon: Folder },
  { id: 'briefcase', label: 'Công việc', icon: Briefcase },
  { id: 'code', label: 'Mã nguồn', icon: Code },
  { id: 'layout', label: 'Giao diện', icon: Layout },
  { id: 'box', label: 'Sản phẩm', icon: Box },
  { id: 'cpu', label: 'Hệ thống', icon: Cpu },
  { id: 'globe', label: 'Website', icon: Globe },
  { id: 'zap', label: 'Tốc độ', icon: Zap },
  { id: 'shield', label: 'Bảo mật', icon: Shield },
  { id: 'rocket', label: 'Khởi nghiệp', icon: Rocket },
  { id: 'star', label: 'Ngôi sao', icon: Star },
  { id: 'terminal', label: 'Dòng lệnh', icon: Terminal },
];

export function getProjectIconComponent(iconId?: string) {
  const match = PROJECT_ICONS.find((item) => item.id === iconId);
  return match ? match.icon : null;
}
