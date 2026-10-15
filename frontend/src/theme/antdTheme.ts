import { tokens } from './tokens';

/**
 * Ant Design ConfigProvider Theme Configuration
 * Keeps AntD components aligned with EPMS design system
 */
export const antdTheme = {
  token: {
    colorPrimary: tokens.colors.brand.primary,
    colorInfo: '#2563EB',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: tokens.colors.brand.primary,
    colorTextBase: tokens.colors.text.primary,
    colorBgBase: tokens.colors.background.default,
    fontFamily: tokens.typography.fontFamily.sans,
    borderRadius: 8,
  },
  components: {
    Button: {
      colorPrimary: tokens.colors.brand.primary,
      colorPrimaryHover: tokens.colors.brand.hover,
      borderRadius: 8,
    },
    Table: {
      headerBg: tokens.colors.background.panel,
      headerColor: tokens.colors.text.secondary,
      borderColor: tokens.colors.border.default,
      rowHoverBg: tokens.colors.background.hover,
    },
    Drawer: {
      colorBgElevated: tokens.colors.background.default,
    },
    Modal: {
      borderRadiusLG: 12,
    },
  },
};
