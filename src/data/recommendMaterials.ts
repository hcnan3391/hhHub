// 推荐物料库配置
export const recommendMaterials = [
    {
        alias: 'Ant Design Blocks',
        name: 'ant-design-blocks',
        gitPath: 'https://github.com/ant-design/ant-design-blocks.git',
        description: 'Ant Design 官方区块库，包含丰富的 React 组件示例',
        type: 'react',
        category: 'component',
        framework: 'React 18',
        uiLibrary: 'Ant Design',
        tags: JSON.stringify(['组件', '区块', 'React', 'Ant Design', '官方']),
        active: true,
    },
    {
        alias: 'Ant Design Pro Blocks',
        name: 'pro-blocks',
        gitPath: 'https://github.com/ant-design/pro-blocks.git',
        description: 'Ant Design Pro 区块库，包含完整的页面级区块',
        type: 'react',
        category: 'layout',
        framework: 'React 18',
        uiLibrary: 'Ant Design Pro',
        tags: JSON.stringify(['页面', '布局', 'React', 'Ant Design Pro', '企业级']),
        active: false,
    },
];

// 物料分类定义
export const materialCategories = [
    { value: 'component', label: '基础组件', icon: '🧩' },
    { value: 'layout', label: '布局页面', icon: '📐' },
    { value: 'form', label: '表单组件', icon: '📝' },
    { value: 'table', label: '表格数据', icon: '📊' },
    { value: 'chart', label: '图表可视化', icon: '📈' },
    { value: 'navigation', label: '导航菜单', icon: '🧭' },
    { value: 'feedback', label: '反馈提示', icon: '💬' },
    { value: 'business', label: '业务组件', icon: '💼' },
    { value: 'other', label: '其他', icon: '📦' },
];

// 框架类型定义
export const frameworkTypes = [
    { value: 'react', label: 'React', icon: '⚛️' },
    { value: 'vue', label: 'Vue', icon: '💚' },
    { value: 'angular', label: 'Angular', icon: '🅰️' },
    { value: 'svelte', label: 'Svelte', icon: '🔥' },
    { value: 'vanilla', label: 'Vanilla JS', icon: '📜' },
];
