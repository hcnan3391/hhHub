'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, Tag, Button, Space, Alert, message, Spin, Typography, Collapse } from 'antd';
import { 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    WarningOutlined, 
    InfoCircleOutlined,
    CodeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text, Paragraph } = Typography;

interface DependencyInfo {
    name: string;
    version: string;
    required: string;
    installed?: string;
    status: 'missing' | 'matched' | 'conflict' | 'compatible';
}

interface DependencyAnalysisData {
    blockName: string;
    allDependencies: DependencyInfo[];
    conflicts: DependencyInfo[];
    missing: DependencyInfo[];
    installCommands: {
        npm: string;
        yarn: string;
        pnpm: string;
    };
    hasConflicts: boolean;
}

interface DependencyAnalysisProps {
    open: boolean;
    onClose: () => void;
    materialsName: string;
    blockName: string;
}

export default function DependencyAnalysis({ 
    open, 
    onClose, 
    materialsName, 
    blockName 
}: DependencyAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DependencyAnalysisData | null>(null);
    const [selectedPackageManager, setSelectedPackageManager] = useState<'npm' | 'yarn' | 'pnpm'>('npm');

    const fetchDependencies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/blocks/dependencies?materialsName=${materialsName}&blockName=${encodeURIComponent(blockName)}`
            );
            const result = await res.json();
            
            if (result.success) {
                setData(result.data);
            } else {
                message.error(result.message || '获取依赖信息失败');
            }
        } catch {
            message.error('获取依赖信息失败');
        } finally {
            setLoading(false);
        }
    }, [materialsName, blockName]);

    useEffect(() => {
        if (open && materialsName && blockName) {
            fetchDependencies();
        }
    }, [open, materialsName, blockName, fetchDependencies]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'matched':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'compatible':
                return <InfoCircleOutlined style={{ color: '#1677ff' }} />;
            case 'conflict':
                return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'missing':
                return <WarningOutlined style={{ color: '#faad14' }} />;
            default:
                return null;
        }
    };

    const getStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
            matched: { color: 'success', text: '版本匹配' },
            compatible: { color: 'processing', text: '兼容' },
            conflict: { color: 'error', text: '版本冲突' },
            missing: { color: 'warning', text: '未安装' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const columns: ColumnsType<DependencyInfo> = [
        {
            title: '包名',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            render: (name: string) => (
                <Text code copyable={{ text: name }}>
                    {name}
                </Text>
            ),
        },
        {
            title: '要求版本',
            dataIndex: 'required',
            key: 'required',
            width: '20%',
            render: (version: string) => <Tag color="blue">{version}</Tag>,
        },
        {
            title: '已安装版本',
            dataIndex: 'installed',
            key: 'installed',
            width: '20%',
            render: (version?: string) => 
                version ? <Tag color="green">{version}</Tag> : <Text type="secondary">未安装</Text>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: '20%',
            render: (status: string) => (
                <Space>
                    {getStatusIcon(status)}
                    {getStatusTag(status)}
                </Space>
            ),
        },
    ];

    const renderSummary = () => {
        if (!data) return null;

        const totalDeps = data.allDependencies.length;
        const needsAction = data.missing.length + data.conflicts.length;

        return (
            <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }} size="middle">
                {/* 安装命令 */}
                {(data.installCommands.npm || data.installCommands.yarn || data.installCommands.pnpm) && (
                    <div style={{ 
                        background: '#f5f5f5', 
                        padding: 16, 
                        borderRadius: 8,
                        border: '1px solid #d9d9d9'
                    }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong>
                                    <CodeOutlined /> 安装命令
                                </Text>
                                <Space>
                                    <Button
                                        size="small"
                                        type={selectedPackageManager === 'npm' ? 'primary' : 'default'}
                                        onClick={() => setSelectedPackageManager('npm')}
                                    >
                                        npm
                                    </Button>
                                    <Button
                                        size="small"
                                        type={selectedPackageManager === 'yarn' ? 'primary' : 'default'}
                                        onClick={() => setSelectedPackageManager('yarn')}
                                    >
                                        yarn
                                    </Button>
                                    <Button
                                        size="small"
                                        type={selectedPackageManager === 'pnpm' ? 'primary' : 'default'}
                                        onClick={() => setSelectedPackageManager('pnpm')}
                                    >
                                        pnpm
                                    </Button>
                                </Space>
                            </div>
                            <Paragraph
                                code
                                copyable
                                style={{ 
                                    marginBottom: 0,
                                    background: '#fff',
                                    padding: 12,
                                    borderRadius: 4,
                                }}
                            >
                                {data.installCommands[selectedPackageManager]}
                            </Paragraph>
                            <Alert
                                message="提示"
                                description="请在你的项目根目录下运行上述命令来安装所需依赖"
                                type="info"
                                showIcon
                                style={{ marginTop: 8 }}
                            />
                        </Space>
                    </div>
                )}

                {/* 统计信息 */}
                {/* <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 16,
                    padding: 16,
                    background: '#fafafa',
                    borderRadius: 8,
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>
                            {totalDeps}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            总依赖数
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                            {totalDeps - needsAction}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            已满足
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>
                            {data.missing.length}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            未安装
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                            {data.conflicts.length}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            版本冲突
                        </div>
                    </div>
                </div> */}
            </Space>
        );
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <Space>
                    <InfoCircleOutlined style={{ color: '#1677ff' }} />
                    <span>依赖分析 - {blockName}</span>
                </Space>
            }
            width={1000}
            footer={[
                <Button key="close" onClick={onClose}>
                    关闭
                </Button>,
            ]}
        >
            <Spin spinning={loading} tip="分析依赖中...">
                {data && (
                    <div>
                        {renderSummary()}
                    </div>
                )}
            </Spin>
        </Modal>
    );
}
