'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, message, Spin, Space, Tooltip, Badge } from 'antd';
import { useRouter } from 'next/navigation';
import {
    PlayCircleOutlined,
    ReloadOutlined,
    CodeOutlined,
    BugOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    SandpackStack,
    useSandpack,
} from '@codesandbox/sandpack-react';

// 刷新按钮组件
const RefreshButton = () => {
    const { sandpack } = useSandpack();

    return (
        <Tooltip title="刷新预览">
            <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => sandpack.runSandpack()}
            >
                刷新
            </Button>
        </Tooltip>
    );
};

// 在 StackBlitz 中打开按钮
const StackBlitzButton = ({ originalCode, blockName, dependencies }: {
    originalCode: string;
    blockName: string;
    dependencies: Record<string, string>;
}) => {
    const openInStackBlitz = () => {
        if (!originalCode) {
            message.warning('代码未加载完成');
            return;
        }

        if (typeof window !== 'undefined') {
            if (!(window as any).StackBlitzSDK) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/@stackblitz/sdk@1/bundles/sdk.umd.js';
                script.onload = () => openStackBlitzProject(originalCode, blockName, dependencies);
                document.head.appendChild(script);
            } else {
                openStackBlitzProject(originalCode, blockName, dependencies);
            }
        }
    };

    return (
        <Tooltip title="在 StackBlitz 中打开">
            <Button
                size="small"
                icon={<ExportOutlined />}
                onClick={openInStackBlitz}
            >
                StackBlitz
            </Button>
        </Tooltip>
    );
};

const openStackBlitzProject = (code: string, blockName: string, deps: Record<string, string>) => {
    const project = {
        title: blockName || 'Ant Design Component',
        description: `${blockName || 'Component'} - Created from hhHub`,
        template: 'create-react-app' as const,
        files: {
            'package.json': JSON.stringify(
                {
                    name: (blockName || 'antd-component').toLowerCase().replace(/\s+/g, '-'),
                    version: '0.0.0',
                    private: true,
                    dependencies: {
                        react: '^18.2.0',
                        'react-dom': '^18.2.0',
                        'react-scripts': '5.0.1',
                        antd: '^5.12.0',
                        dayjs: '^1.11.10',
                        '@ant-design/icons': '^5.0.0',
                        ...deps,
                    },
                    scripts: {
                        start: 'react-scripts start',
                        build: 'react-scripts build',
                    },
                },
                null,
                2
            ),
            'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${blockName || 'Ant Design Component'}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
            'src/index.js': `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);`,
            'src/App.js': code,
            'src/index.css': `body {
  margin: 0;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
}`,
        },
    };

    (window as any).StackBlitzSDK.openProject(project, {
        newWindow: true,
        openFile: 'src/App.js',
    });

    message.success('正在打开 StackBlitz...');
};

interface MaterialSandboxProps {
    open: boolean;
    onClose: () => void;
    block: {
        name: string;
        key?: string;
        sourceCode?: string;
        previewUrl?: string;
        dependencies?: string[];
    } | null;
    materialsName: string;
}

export default function MaterialSandbox({ open, onClose, block, materialsName }: MaterialSandboxProps) {
    const [loading, setLoading] = useState(false);
    const [originalCode, setOriginalCode] = useState('');
    const [files, setFiles] = useState<Record<string, { code: string }>>({});
    const [dependencies, setDependencies] = useState<Record<string, string>>({});
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 监听路由变化，当用户离开页面时关闭弹窗
    useEffect(() => {
        if (!open) return;

        // 路由开始变化时关闭弹窗
        const handleRouteChange = () => {
            onClose();
        };

        // 清理 Sandpack 的 iframe 防止阻止导航
        const cleanupSandpack = () => {
            const iframes = document.querySelectorAll('iframe[src*="sandpack"]');
            iframes.forEach(iframe => iframe.remove());
        };

        window.addEventListener('beforeunload', cleanupSandpack);
        document.addEventListener('visibilitychange', cleanupSandpack);

        return () => {
            window.removeEventListener('beforeunload', cleanupSandpack);
            document.removeEventListener('visibilitychange', cleanupSandpack);
            cleanupSandpack();
        };
    }, [open, onClose]);

    // 获取区块代码
    const fetchBlockCode = useCallback(async () => {
        if (!block) return;

        setLoading(true);
        setHasError(false);
        setErrorMessage('');

        try {
            const blockIdentifier = block.key || block.name;
            const res = await fetch(
                `/api/blocks/code?materialsName=${materialsName}&blockName=${encodeURIComponent(blockIdentifier)}`
            );
            const data = await res.json();

            if (data.success && data.data.originalCode) {
                const original = data.data.originalCode;
                setOriginalCode(original);

                // 解析依赖
                const deps = parseDependencies(original);
                setDependencies(deps);

                // 创建 Sandpack 文件
                const sandpackFiles = createSandpackFiles(original, block.name);
                setFiles(sandpackFiles);
            } else {
                setHasError(true);
                setErrorMessage(data.message || '未获取到代码内容');
                message.warning(data.message || '未获取到代码内容');
            }
        } catch (error) {
            setHasError(true);
            setErrorMessage('获取代码失败，请检查网络连接');
            message.error('获取代码失败');
        } finally {
            setLoading(false);
        }
    }, [block, materialsName]);

    useEffect(() => {
        if (open && block) {
            fetchBlockCode();
        }
    }, [open, block, fetchBlockCode]);

    // 解析代码中的依赖
    const parseDependencies = (code: string): Record<string, string> => {
        const deps: Record<string, string> = {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            antd: '^5.12.0',
            dayjs: '^1.11.10',
        };

        // 提取 import 语句中的依赖
        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"];?/g;
        let match;

        while ((match = importRegex.exec(code)) !== null) {
            const pkgName = match[1];

            // 跳过相对路径导入和已处理的包
            if (pkgName.startsWith('.') || pkgName.startsWith('/')) continue;

            // 提取包名（处理 @scope/package 和 package/subpath）
            const parts = pkgName.split('/');
            const mainPkg = pkgName.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

            if (!deps[mainPkg] && !mainPkg.startsWith('antd') && mainPkg !== 'react' && mainPkg !== 'react-dom') {
                deps[mainPkg] = 'latest';
            }
        }

        // 检查是否需要 @ant-design/icons
        if (code.includes('<Icon') || code.includes('Icon ') || /from\s+['"]@ant-design\/icons['"]/.test(code)) {
            deps['@ant-design/icons'] = '^5.0.0';
        }

        // 检查是否需要 @ant-design/charts
        if (/from\s+['"]@ant-design\/charts['"]/.test(code)) {
            deps['@ant-design/charts'] = '^1.0.0';
        }

        return deps;
    };

    // 转换代码为 Sandpack 可用格式
    const transformCodeForSandpack = (code: string): string => {
        // 移除样式导入（Sandpack 不支持直接导入 CSS/LESS）
        let transformed = code.replace(/import\s+['"].*\.(less|css|scss|sass)['"];?\s*/g, '');
        transformed = transformed.replace(/import\s+.*?from\s+['"].*\.(less|css|scss|sass)['"];?\s*/g, '');

        // 确保有默认导出
        if (!transformed.includes('export default')) {
            const componentMatch = transformed.match(/(?:const|let|var|function)\s+(\w+)\s*(?:[=\(])/);
            if (componentMatch) {
                const componentName = componentMatch[1];
                if (componentName[0] === componentName[0].toUpperCase()) {
                    transformed += `\n\nexport default ${componentName};`;
                }
            }
        }

        return transformed;
    };

    // 创建 Sandpack 文件结构
    const createSandpackFiles = (code: string, blockName: string): Record<string, { code: string }> => {
        const transformedCode = transformCodeForSandpack(code);

        return {
            '/App.js': {
                code: transformedCode,
            },
            '/index.js': {
                code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);`,
            },
            '/styles.css': {
                code: `body {
  margin: 0;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

#root {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  min-height: calc(100vh - 48px);
  box-sizing: border-box;
}`,
            },
            '/package.json': {
                code: JSON.stringify(
                    {
                        name: blockName.toLowerCase().replace(/\s+/g, '-'),
                        version: '0.0.1',
                        dependencies: {
                            react: '^18.2.0',
                            'react-dom': '^18.2.0',
                            antd: '^5.12.0',
                            dayjs: '^1.11.10',
                            '@ant-design/icons': '^5.0.0',
                        },
                    },
                    null,
                    2
                ),
            },
        };
    };

    // 错误显示
    const ErrorDisplay = () => (
        <div
            style={{
                padding: '60px 40px',
                textAlign: 'center',
                background: '#fff2f0',
                borderRadius: 12,
                border: '1px solid #ffccc7',
            }}
        >
            <BugOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 24 }} />
            <h3 style={{ color: '#cf1322', marginBottom: 12, fontSize: 18 }}>加载失败</h3>
            <p style={{ color: '#666', marginBottom: 24 }}>{errorMessage}</p>
            <Button type="primary" size="large" onClick={fetchBlockCode}>
                重试加载
            </Button>
        </div>
    );

    // 加载中显示
    const LoadingDisplay = () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 600,
                background: '#fafafa',
                borderRadius: 12,
            }}
        >
            <Spin size="large" />
            <span style={{ marginTop: 16, color: '#999' }}>正在加载代码编辑器...</span>
        </div>
    );

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CodeOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>
                            {block?.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', lineHeight: 1.4 }}>
                            {materialsName}
                        </div>
                    </div>
                </div>
            }
            width="95vw"
            style={{ top: 20 }}
            footer={null}
            destroyOnClose
            styles={{
                body: { padding: '0 24px 24px' },
                header: {
                    borderBottom: '1px solid #f0f0f0',
                    padding: '16px 24px',
                },
            }}
        >
            {loading ? (
                <LoadingDisplay />
            ) : hasError ? (
                <ErrorDisplay />
            ) : (
                <SandpackProvider
                    template="react"
                    files={files}
                    customSetup={{
                        dependencies: dependencies,
                        entry: '/index.js',
                    }}
                    options={{
                        activeFile: '/App.js',
                        visibleFiles: ['/App.js', '/index.js', '/styles.css'],
                        recompileMode: 'delayed',
                        recompileDelay: 500,
                        autorun: true,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: '#fafafa',
                            borderRadius: '12px 12px 0 0',
                            border: '1px solid #e8e8e8',
                            borderBottom: 'none',
                        }}
                    >
                        <Space size={16}>
                            <Badge status="processing" text="实时编辑" />
                            <span style={{ color: '#999', fontSize: 13 }}>
                                修改代码后预览将自动更新
                            </span>
                        </Space>
                        <Space>
                            {Object.keys(dependencies).length > 4 && (
                                <span style={{ color: '#999', fontSize: 12 }}>
                                    已加载 {Object.keys(dependencies).length} 个依赖
                                </span>
                            )}
                            <RefreshButton />
                            <StackBlitzButton
                                originalCode={originalCode}
                                blockName={block?.name || ''}
                                dependencies={dependencies}
                            />
                        </Space>
                    </div>

                    <SandpackLayout
                        style={{
                            height: 'calc(95vh - 200px)',
                            minHeight: 500,
                            borderRadius: '0 0 12px 12px',
                            overflow: 'hidden',
                            border: '1px solid #e8e8e8',
                        }}
                    >
                        <SandpackStack style={{ height: '100%', width: '100%' }}>
                            <div style={{ display: 'flex', height: '100%' }}>
                                {/* 代码编辑器 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <SandpackCodeEditor
                                        showTabs
                                        showLineNumbers
                                        showInlineErrors
                                        wrapContent
                                        closableTabs={false}
                                        style={{ height: '100%' }}
                                    />
                                </div>

                                {/* 分隔线 */}
                                <div style={{ width: 1, background: '#e8e8e8' }} />

                                {/* 预览区 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <SandpackPreview
                                        style={{ height: '100%' }}
                                        showOpenInCodeSandbox={false}
                                        showRefreshButton={false}
                                    />
                                </div>
                            </div>
                        </SandpackStack>
                    </SandpackLayout>
                </SandpackProvider>
            )}
        </Modal>
    );
}
