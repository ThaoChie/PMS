export interface PresetAvatar {
  id: string;
  name: string;
  url: string;
}

function createSvgDataUri(bg: string, faceColor: string, hairColor: string, accessories: string = ''): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="50" fill="${bg}"/>
    <circle cx="50" cy="50" r="28" fill="${faceColor}"/>
    <ellipse cx="50" cy="30" rx="26" ry="16" fill="${hairColor}"/>
    <circle cx="40" cy="48" r="3.5" fill="#1E293B"/>
    <circle cx="60" cy="48" r="3.5" fill="#1E293B"/>
    <path d="M42 62 Q50 70 58 62" stroke="#1E293B" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${accessories}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'pm-lead',
    name: 'Quản lý dự án (PM)',
    url: createSvgDataUri('#DBEAFE', '#FDE047', '#1E293B', '<path d="M30 46 h14 M56 46 h14" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>'),
  },
  {
    id: 'dev-ninja',
    name: 'Lập trình viên (Dev)',
    url: createSvgDataUri('#EDE9FE', '#FCD34D', '#6D28D9', '<rect x="34" y="44" width="12" height="8" rx="2" fill="#4B5563"/><rect x="54" y="44" width="12" height="8" rx="2" fill="#4B5563"/><line x1="46" y1="48" x2="54" y2="48" stroke="#4B5563" stroke-width="2"/>'),
  },
  {
    id: 'qa-tester',
    name: 'Kiểm thử viên (QA)',
    url: createSvgDataUri('#D1FAE5', '#FBBF24', '#047857', '<circle cx="50" cy="53" r="2" fill="#DC2626"/>'),
  },
  {
    id: 'ui-designer',
    name: 'Thiết kế (UI/UX)',
    url: createSvgDataUri('#FCE7F3', '#FDE047', '#DB2777', '<circle cx="34" cy="56" r="4" fill="#F472B6" opacity="0.6"/><circle cx="66" cy="56" r="4" fill="#F472B6" opacity="0.6"/>'),
  },
  {
    id: 'analyst',
    name: 'Chuyên viên phân tích (BA)',
    url: createSvgDataUri('#FEF3C7', '#FDE047', '#B45309', '<path d="M36 44 h12 M52 44 h12" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>'),
  },
  {
    id: 'scrum-master',
    name: 'Scrum Master',
    url: createSvgDataUri('#FFEDD5', '#FCD34D', '#C2410C', '<polygon points="50,14 46,24 54,24" fill="#F97316"/>'),
  },
  {
    id: 'devops',
    name: 'Kỹ sư DevOps',
    url: createSvgDataUri('#E0E7FF', '#FDE047', '#3730A3', '<circle cx="36" cy="48" r="6" stroke="#4338CA" stroke-width="2" fill="none"/><circle cx="64" cy="48" r="6" stroke="#4338CA" stroke-width="2" fill="none"/><line x1="42" y1="48" x2="58" y2="48" stroke="#4338CA" stroke-width="2"/>'),
  },
  {
    id: 'tech-architect',
    name: 'Kiến trúc sư hệ thống',
    url: createSvgDataUri('#CCFBF1', '#FCD34D', '#0F766E', '<path d="M40 64 h20" stroke="#0F766E" stroke-width="3" stroke-linecap="round"/>'),
  },
];
