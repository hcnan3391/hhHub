'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, Form, Input, Select, Button, notification, Tabs, Upload, Space, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined, CodeOutlined, EyeOutlined, EditOutlined, ImportOutlined } from '@ant-design/icons';
import { materialCategories } from '@/data/recommendMaterials';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import {
    SandpackProvider,
    SandpackLayout,
    SandpackPreview,
} from '@codesandbox/sandpack-react';

export interface BlockEditorModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    materialsName: string;
    materialsAlias: string;
}

interface FileItem {
    path: string;
    code: string;
}

const DEFAULT_FILES: FileItem[] = [
    {
        path: 'src/App.tsx',
        code: `import React from 'react';
import { Button } from 'antd';

export default function Demo() {
  return (
    <Button type="primary">
      Hello hhHub
    </Button>
  );
}`,
    },
    {
        path: 'src/index.tsx',
        code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}`,
    },
    {
        path: 'package.json',
        code: JSON.stringify(
            {
                name: 'demo-block',
                version: '1.0.0',
                description: '示例区块',
                dependencies: {
                    react: '^18.2.0',
                    'react-dom': '^18.2.0',
                    antd: '^5.12.0',
                },
            },
            null,
            2
        ),
    },
];

export default function BlockEditorModal({
    open,
    onClose,
    onSuccess,
    materialsName,
    materialsAlias,
}: BlockEditorModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);
    const [activeFile, setActiveFile] = useState('src/App.tsx');
    const [screenshotFile, setScreenshotFile] = useState<UploadFile[]>([]);
    const [renameModal, setRenameModal] = useState<{ open: boolean; oldPath: string; newPath: string }>({
        open: false,
        oldPath: '',
        newPath: '',
    });
    const [addFileModal, setAddFileModal] = useState<{ open: boolean; fileName: string }>({
        open: false,
        fileName: 'src/utils.ts',
    });

    // 清理 Sandpack 防止阻止导航
    useEffect(() => {
        if (!open) return;

        const cleanupSandpack = () => {
            const iframes = document.querySelectorAll('iframe[src*="sandpack"]');
            iframes.forEach(iframe => iframe.remove());
        };

        return () => {
            cleanupSandpack();
        };
    }, [open]);

    // 重置状态
    const resetState = useCallback(() => {
        setFiles(DEFAULT_FILES);
        setActiveFile('src/App.tsx');
        setScreenshotFile([]);
        setRenameModal({ open: false, oldPath: '', newPath: '' });
        setAddFileModal({ open: false, fileName: 'src/utils.ts' });
        form.resetFields();
    }, [form]);

    // 解析代码中的依赖
    const parseDependencies = useCallback((code: string): Record<string, string> => {
        const deps: Record<string, string> = {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            antd: '^5.12.0',
        };

        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"];?/g;
        let match;

        while ((match = importRegex.exec(code)) !== null) {
            const pkgName = match[1];
            if (pkgName.startsWith('.') || pkgName.startsWith('/')) continue;

            const parts = pkgName.split('/');
            const mainPkg = pkgName.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

            if (!deps[mainPkg] && !mainPkg.startsWith('antd') && mainPkg !== 'react' && mainPkg !== 'react-dom') {
                deps[mainPkg] = 'latest';
            }
        }

        if (/@ant-design\/icons/.test(code)) {
            deps['@ant-design/icons'] = '^5.0.0';
        }

        return deps;
    }, []);

    // 自动生成 package.json
    const generatePackageJson = useCallback(() => {
        const mainCode = files.find(f => f.path === 'src/App.tsx')?.code || '';
        const deps = parseDependencies(mainCode);

        return JSON.stringify(
            {
                name: form.getFieldValue('blockKey') || 'demo-block',
                version: '1.0.0',
                description: form.getFieldValue('description') || '',
                dependencies: deps,
            },
            null,
            2
        );
    }, [files, form, parseDependencies]);

    // 更新 package.json 依赖 - 使用 ref 避免无限循环
    const prevCodeRef = React.useRef('');
    useEffect(() => {
        const mainCode = files.find(f => f.path === 'src/App.tsx')?.code;
        if (mainCode && mainCode !== prevCodeRef.current) {
            prevCodeRef.current = mainCode;
            const newPackageJson = generatePackageJson();
            setFiles(prev => {
                const existing = prev.find(f => f.path === 'package.json');
                if (existing && existing.code !== newPackageJson) {
                    return prev.map(f => (f.path === 'package.json' ? { ...f, code: newPackageJson } : f));
                }
                return prev;
            });
        }
    }, [files, generatePackageJson]);

    // 添加新文件
    const addFile = () => {
        setAddFileModal({ open: true, fileName: 'src/utils.ts' });
    };

    // 处理文件导入
    const handleFileImport: UploadProps['beforeUpload'] = (file) => {
        const allowedExtensions = ['.tsx', '.jsx', '.ts', '.js', '.json', '.css', '.less', '.scss', '.html'];
        const fileName = file.name;
        const ext = '.' + fileName.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            notification.error({ message: `不支持的文件类型: ${ext}` });
            return false;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            let filePath = `src/${fileName}`;

            // 特殊处理 package.json，放在根目录
            if (fileName === 'package.json') {
                filePath = 'package.json';
            }

            // 检查文件是否已存在
            const existingIndex = files.findIndex(f => f.path === filePath);
            if (existingIndex >= 0) {
                // 更新已存在的文件
                setFiles(prev => prev.map(f => f.path === filePath ? { ...f, code: content } : f));
                notification.success({ message: `文件「${filePath}」已更新` });
            } else {
                // 添加新文件
                const newFile: FileItem = { path: filePath, code: content };
                setFiles(prev => [...prev, newFile]);
                notification.success({ message: `文件「${filePath}」导入成功` });
            }

            // 切换到导入的文件
            setActiveFile(filePath);
        };
        reader.onerror = () => {
            notification.error({ message: `读取文件「${fileName}」失败` });
        };
        reader.readAsText(file);

        return false; // 阻止自动上传
    };

    const handleAddFileConfirm = () => {
        let newPath = addFileModal.fileName.trim();

        if (!newPath) {
            notification.error({ message: '文件名不能为空' });
            return;
        }

        // 确保路径格式正确
        if (!newPath.startsWith('src/') && !newPath.startsWith('./')) {
            newPath = `src/${newPath}`;
        }

        // 检查文件是否已存在
        if (files.some(f => f.path === newPath)) {
            notification.error({ message: `文件「${newPath}」已存在` });
            return;
        }

        // 根据文件扩展名生成默认内容
        let defaultCode = '// 新文件\n';
        if (newPath.endsWith('.css') || newPath.endsWith('.less') || newPath.endsWith('.scss')) {
            defaultCode = '/* 样式文件 */\n';
        } else if (newPath.endsWith('.json')) {
            defaultCode = '{}\n';
        } else if (newPath.endsWith('.tsx') || newPath.endsWith('.jsx')) {
            defaultCode = `import React from 'react';

export default function Component() {
  return <div>New Component</div>;
}
`;
        }

        const newFile: FileItem = {
            path: newPath,
            code: defaultCode,
        };
        setFiles([...files, newFile]);
        setActiveFile(newPath);
        setAddFileModal({ open: false, fileName: 'src/utils.ts' });
    };

    // 重命名文件
    const renameFile = (oldPath: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRenameModal({ open: true, oldPath, newPath: oldPath });
    };

    const handleRenameConfirm = () => {
        const { oldPath, newPath } = renameModal;
        const trimmedNewPath = newPath.trim();

        if (!trimmedNewPath || trimmedNewPath === oldPath) {
            setRenameModal({ open: false, oldPath: '', newPath: '' });
            return;
        }

        if (files.some(f => f.path === trimmedNewPath)) {
            notification.error({ message: `文件「${trimmedNewPath}」已存在` });
            return;
        }

        setFiles(prev => prev.map(f => (f.path === oldPath ? { ...f, path: trimmedNewPath } : f))
        );

        if (activeFile === oldPath) {
            setActiveFile(trimmedNewPath);
        }

        setRenameModal({ open: false, oldPath: '', newPath: '' });
    };

    // 删除文件
    const deleteFile = (path: string) => {
        if (path === 'src/index.tsx' || path === 'src/App.tsx') {
            notification.warning({ message: '不能删除必要文件' });
            return;
        }
        const newFiles = files.filter(f => f.path !== path);
        setFiles(newFiles);
        if (activeFile === path) {
            setActiveFile('src/App.tsx');
        }
    };

    // 更新文件代码
    const updateFileCode = (path: string, code: string) => {
        setFiles(prev => prev.map(f => (f.path === path ? { ...f, code } : f)));
    };

    // 转换为 Sandpack 文件格式
    const getSandpackFiles = useCallback(() => {
        const sandpackFiles: Record<string, { code: string }> = {};

        // react-ts 模板需要 /src/App.tsx 作为组件入口
        const appFile = files.find(f => f.path === 'src/App.tsx');
        if (appFile) {
            sandpackFiles['/src/App.tsx'] = { code: appFile.code };
        }

        // react-ts 模板需要 /src/index.tsx 作为渲染入口
        const indexFile = files.find(f => f.path === 'src/index.tsx');
        if (indexFile) {
            sandpackFiles['/src/index.tsx'] = { code: indexFile.code };
        }

        // 添加其他辅助文件
        files.forEach(file => {
            if (file.path !== 'src/App.tsx' && file.path !== 'src/index.tsx' && file.path !== 'package.json') {
                const sandpackPath = file.path.startsWith('src/') ? `/src/${file.path.replace(/^src\//, '')}` : `/${file.path}`;
                sandpackFiles[sandpackPath] = { code: file.code };
            }
        });

        // 添加 package.json 以自定义项目配置（如 name: demo-block）
        const pkgFile = files.find(f => f.path === 'package.json');
        if (pkgFile) {
            sandpackFiles['/package.json'] = { code: pkgFile.code };
        }

        return sandpackFiles;
    }, [files]);

    // 提交创建
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // 准备文件数据
            const filesData = files.reduce(
                (acc, file) => {
                    acc[file.path] = file.code;
                    return acc;
                },
                {} as Record<string, string>
            );

            // 截图数据
            let screenshotBase64 = '';
            if (screenshotFile.length > 0 && screenshotFile[0].originFileObj) {
                screenshotBase64 = await new Promise<string>(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(screenshotFile[0].originFileObj!);
                });
            }

            const res = await fetch('/api/blocks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    materialsName,
                    blockKey: values.blockKey,
                    blockName: values.blockName,
                    description: values.description,
                    tags: values.tags || [],
                    category: values.category,
                    files: filesData,
                    screenshot: screenshotBase64,
                }),
            }).then(r => r.json());

            if (res.success) {
                notification.success({ message: '区块创建成功', duration: 2 });
                resetState();
                onClose();
                onSuccess();
            } else {
                notification.error({ message: res.message || '创建失败' });
            }
        } catch (err: any) {
            if (err?.errorFields) return;
            notification.error({ message: '操作失败' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        resetState();
        onClose();
    };

    const sandpackFiles = getSandpackFiles();
    const dependencies = parseDependencies(files.find(f => f.path === 'src/App.tsx')?.code || '');
    const currentFile = files.find(f => f.path === activeFile);

    return (
        <Modal
            open={open}
            title={`新建区块 — ${materialsAlias}`}
            onCancel={handleCancel}
            width='95vw'
            style={{ top: 20, maxWidth: 1400 }}
            footer={[
                <Button key='cancel' onClick={handleCancel}>
                    取消
                </Button>,
                <Button key='submit' type='primary' loading={loading} onClick={handleSubmit}>
                    创建区块
                </Button>,
            ]}
            destroyOnClose
        >
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                {/* 左侧：基本信息 */}
                <div style={{ width: 320, flexShrink: 0 }}>
                    <Form form={form} layout='vertical'>
                        <Form.Item
                            label='区块标识'
                            name='blockKey'
                            rules={[
                                { required: true, message: '请填写区块标识' },
                                {
                                    pattern: /^[a-zA-Z0-9_-]+$/,
                                    message: '只能包含英文字母、数字、连字符和下划线',
                                },
                            ]}
                            tooltip='用作目录名，只能包含英文字母、数字、连字符（-）和下划线（_）'
                        >
                            <Input placeholder='例如：my-button' />
                        </Form.Item>

                        <Form.Item
                            label='区块名称'
                            name='blockName'
                            rules={[{ required: true, message: '请填写区块名称' }]}
                        >
                            <Input placeholder='例如：我的按钮组件' />
                        </Form.Item>

                        <Form.Item label='分类' name='category' initialValue='component'>
                            <Select
                                options={materialCategories.map(c => ({
                                    label: `${c.icon} ${c.label}`,
                                    value: c.value,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item label='标签' name='tags'>
                            <Select mode='tags' placeholder='输入标签后按回车添加' style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item label='描述' name='description'>
                            <Input.TextArea rows={2} placeholder='简要描述该区块的用途' />
                        </Form.Item>

                        <Form.Item label='截图'>
                            <Upload
                                listType='picture-card'
                                fileList={screenshotFile}
                                onChange={({ fileList }) => setScreenshotFile(fileList)}
                                beforeUpload={() => false}
                                maxCount={1}
                                accept='image/*'
                            >
                                {screenshotFile.length === 0 && (
                                    <div>
                                        <UploadOutlined />
                                        <div style={{ marginTop: 8 }}>上传截图</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                    </Form>

                    {/* 文件列表 */}
                    <div style={{ marginTop: 16 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                            }}
                        >
                            <span style={{ fontWeight: 500 }}>文件列表</span>
                            <Space size={4}>
                                <Upload
                                    accept='.tsx,.jsx,.ts,.js,.json,.css,.less,.scss,.html'
                                    beforeUpload={handleFileImport}
                                    showUploadList={false}
                                    multiple
                                >
                                    <Button type='link' size='small' icon={<ImportOutlined />}>
                                        导入文件
                                    </Button>
                                </Upload>
                                <Button type='link' size='small' icon={<PlusOutlined />} onClick={addFile}>
                                    添加文件
                                </Button>
                            </Space>
                        </div>
                        <div
                            style={{
                                border: '1px solid #f0f0f0',
                                borderRadius: 6,
                                maxHeight: 200,
                                overflow: 'auto',
                            }}
                        >
                            {files.map(file => (
                                <div
                                    key={file.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        background: activeFile === file.path ? '#e6f4ff' : 'transparent',
                                        borderBottom: '1px solid #f0f0f0',
                                    }}
                                    onClick={() => setActiveFile(file.path)}
                                >
                                    {file.path.endsWith('.json') ? (
                                        <FileOutlined style={{ marginRight: 8, color: '#faad14' }} />
                                    ) : file.path.match(/\.(css|less|scss)$/) ? (
                                        <FileOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                                    ) : (
                                        <CodeOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                                    )}
                                    <span
                                        style={{
                                            flex: 1,
                                            fontSize: 13,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {file.path}
                                    </span>
                                    <Space size={8}>
                                        <Tooltip title='重命名'>
                                            <EditOutlined
                                                style={{ color: '#1677ff', fontSize: 12 }}
                                                onClick={e => renameFile(file.path, e)}
                                            />
                                        </Tooltip>
                                        {file.path !== 'src/index.tsx' && file.path !== 'package.json' && (
                                            <Tooltip title='删除'>
                                                <DeleteOutlined
                                                    style={{ color: '#ff4d4f', fontSize: 12 }}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        deleteFile(file.path);
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Space>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 右侧：代码编辑和预览 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Tabs
                        items={[
                            {
                                key: 'editor',
                                label: (
                                    <Space>
                                        <CodeOutlined />
                                        代码编辑
                                    </Space>
                                ),
                                children: currentFile ? (
                                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                background: '#fafafa',
                                                padding: '8px 12px',
                                                borderBottom: '1px solid #f0f0f0',
                                                fontSize: 13,
                                                color: '#666',
                                            }}
                                        >
                                            {currentFile.path}
                                        </div>
                                        <Input.TextArea
                                            value={currentFile.code}
                                            onChange={e => updateFileCode(activeFile, e.target.value)}
                                            autoSize={{ minRows: 20, maxRows: 25 }}
                                            style={{
                                                fontFamily: 'monospace',
                                                fontSize: 13,
                                                border: 'none',
                                                resize: 'none',
                                            }}
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : null,
                            },
                            {
                                key: 'preview',
                                label: (
                                    <Space>
                                        <EyeOutlined />
                                        实时预览
                                    </Space>
                                ),
                                children: (
                                    <SandpackProvider
                                        template='react-ts'
                                        files={sandpackFiles}
                                        customSetup={{
                                            dependencies: {
                                                ...dependencies,
                                                antd: '^5.12.0',
                                            },
                                        }}
                                        options={{
                                            recompileMode: 'delayed',
                                            recompileDelay: 500,
                                        }}
                                    >
                                        <SandpackLayout
                                            style={{
                                                height: 500,
                                                borderRadius: 8,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <SandpackPreview
                                                style={{ height: '100%' }}
                                                showOpenInCodeSandbox={false}
                                                showRefreshButton={true}
                                            />
                                        </SandpackLayout>
                                    </SandpackProvider>
                                ),
                            },
                        ]}
                    />
                </div>
            </div>

            {/* 添加文件弹窗 */}
            <Modal
                title="添加新文件"
                open={addFileModal.open}
                onOk={handleAddFileConfirm}
                onCancel={() => setAddFileModal({ open: false, fileName: 'src/utils.ts' })}
                okText="添加"
                cancelText="取消"
            >
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item label="文件名">
                        <Input
                            value={addFileModal.fileName}
                            onChange={e => setAddFileModal({ ...addFileModal, fileName: e.target.value })}
                            placeholder="例如：src/utils.ts"
                            autoFocus
                            onPressEnter={handleAddFileConfirm}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 重命名文件弹窗 */}
            <Modal
                title="重命名文件"
                open={renameModal.open}
                onOk={handleRenameConfirm}
                onCancel={() => setRenameModal({ open: false, oldPath: '', newPath: '' })}
                okText="重命名"
                cancelText="取消"
            >
                <Form layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item label="新文件名">
                        <Input
                            value={renameModal.newPath}
                            onChange={e => setRenameModal({ ...renameModal, newPath: e.target.value })}
                            placeholder="新文件名"
                            autoFocus
                            onPressEnter={handleRenameConfirm}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
}
