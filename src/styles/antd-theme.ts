// Ant Design 官网风格的样式配置

export const antdThemeStyles = {
  // 卡片样式
  card: {
    borderRadius: 8,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.03), 0 1px 6px -1px rgba(0,0,0,.02), 0 2px 4px 0 rgba(0,0,0,.02)',
    border: '1px solid #f0f0f0',
    transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
  
  cardHover: {
    boxShadow: '0 1px 2px -2px rgba(0,0,0,.16), 0 3px 6px 0 rgba(0,0,0,.12), 0 5px 12px 4px rgba(0,0,0,.09)',
    transform: 'translateY(-2px)',
  },

  // 按钮样式
  button: {
    borderRadius: 6,
    fontWeight: 400,
    transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
  },

  // 输入框样式
  input: {
    borderRadius: 6,
    transition: 'all 0.3s',
  },

  // 标题样式
  pageTitle: {
    fontSize: 24,
    fontWeight: 600,
    color: '#000000d9',
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#000000d9',
    marginBottom: 16,
  },

  // 间距
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // 颜色
  colors: {
    primary: '#1677ff',
    primaryHover: '#4096ff',
    primaryActive: '#0958d9',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1677ff',
    text: '#000000d9',
    textSecondary: '#00000073',
    textDisabled: '#00000040',
    border: '#d9d9d9',
    borderLight: '#f0f0f0',
    background: '#ffffff',
    backgroundLight: '#fafafa',
  },
};

export default antdThemeStyles;
