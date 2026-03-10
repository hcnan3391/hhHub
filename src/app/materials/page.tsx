'use client';

import React, { useEffect, useState } from 'react';
import { Select, Button, Spin, notification, Modal, List, Tag, Input, Space, Card, Row, Col, Statistic } from 'antd';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, SearchOutlined, FilterOutlined, BarChartOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import BlocksView from './blocks/BlocksView';
import { materialCategories, frameworkTypes } from '@/data/recommendMaterials';

interface MaterialOption {
    label: string;
    value: string;
}

interface SyncResult {
    name: string;
    alias: string;
    status: 'updated' | 'cloned' | 'error' | 'skipped';
    message: string;
}

interface Material {
    id: number;
    alias: string;
    name: string;
    description?: string;
    type?: string;
    category?: string;
    framework?: string;
    uiLibrary?: string;
    tags?: string[];
    active: boolean;
    usageCount: number;
}

interface MaterialStats {
    total: number;
    active: number;
    custom: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byFramework: Record<string, number>;
    topUsed?: { alias: string; type?: string; category?: string; usageCount: number }[];
}

export default function MaterialsPage() {
    const [options, setOptions] = useState<MaterialOption[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [syncing, setSyncing] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    
    // 搜索和过滤状态
    const [searchMode, setSearchMode] = useState<'blocks' | 'materials'>('blocks');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [stats, setStats] = useState<MaterialStats | null>(null);
    const [showStats, setShowStats] = useState(false);

    const loadMaterials = async () => {
        const res = await fetch('/api/materials').then(r => r.json());
        if (res.success) {
            const all = [...res.data.recommendMaterials, ...res.data.customMaterials];
            const active = all
                .filter((m: any) => m.active)
                .map((m: any) => ({ label: m.alias, value: m.name }));
            setOptions(active);
            if (active.length > 0 && !selected) {
                setSelected(active[0].value);
            }
            return active.length;
        }
        return 0;
    };

    useEffect(() => {
        loadMaterials();
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await fetch('/api/materials/stats').then(r => r.json());
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('加载统计信息失败:', error);
        }
    };

    const searchMaterials = async () => {
        setMaterialsLoading(true);
        try {
            const params = new URLSearchParams({ activeOnly: 'true' });
            if (searchKeyword) params.set('keyword', searchKeyword);
            if (filterType && filterType !== 'undefined') params.set('type', filterType);
            if (filterCategory && filterCategory !== 'undefined') params.set('category', filterCategory);
            const res = await fetch(`/api/materials/search?${params}`).then(r => r.json());
            if (res.success) {
                setMaterials(res.data.list);
            }
        } catch (error) {
            notification.error({ message: '搜索失败' });
        } finally {
            setMaterialsLoading(false);
        }
    };

    const handleSearchMaterials = () => {
        setSearchMode('materials');
        searchMaterials();
    };

    const handleSelectMaterial = (materialName: string) => {
        setSelected(materialName);
        setSearchMode('blocks');
    };

    const initMaterials = async () => {
        setInitializing(true);
        try {
            const res = await fetch('/api/materials/init', { method: 'POST' }).then(r => r.json());
            if (res.success) {
                notification.success({ 
                    message: '初始化成功', 
                    description: res.message 
                });
                await loadMaterials();
            } else {
                notification.error({ 
                    message: '初始化失败', 
                    description: res.message 
                });
            }
        } catch (error: any) {
            notification.error({ 
                message: '初始化失败', 
                description: error.message 
            });
        } finally {
            setInitializing(false);
        }
    };

    const sync = async () => {
        setSyncing(true);
        setSyncResults([]);
        
        try {
            const res = await fetch('/api/materials/sync').then(r => r.json());
            
            if (res.data && res.data.length > 0) {
                setSyncResults(res.data);
                setShowResults(true);
            }
            
            if (res.success) {
                notification.success({ 
                    message: '同步成功', 
                    description: res.message || '物料库已更新',
                    duration: 3,
                });
                // 同步成功后重新加载物料列表
                await loadMaterials();
            } else {
                notification.warning({ 
                    message: '同步完成', 
                    description: res.message,
                    duration: 5,
                });
            }
        } catch (error: any) {
            notification.error({ 
                message: '同步失败', 
                description: error.message || '网络错误，请稍后重试'
            });
        } finally {
            setSyncing(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'updated':
            case 'cloned':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'error':
                return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'skipped':
                return <InfoCircleOutlined style={{ color: '#faad14' }} />;
            default:
                return null;
        }
    };

    const getStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
            updated: { color: 'success', text: '已更新' },
            cloned: { color: 'success', text: '已克隆' },
            error: { color: 'error', text: '失败' },
            skipped: { color: 'warning', text: '跳过' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    return (
        <MainLayout>
            {/* 顶部操作栏 */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                marginBottom: 24, 
                flexWrap: 'wrap',
                paddingBottom: 16,
                borderBottom: '1px solid #f0f0f0'
            }}>
                <h2 style={{ 
                    margin: 0, 
                    fontSize: 20, 
                    fontWeight: 600, 
                    color: '#000000d9',
                    flex: 1,
                    minWidth: 100
                }}>
                    物料管理
                </h2>
                <Select
                    value={selected}
                    onChange={(val) => {
                        setSelected(val);
                        setSearchMode('blocks');
                    }}
                    style={{ width: 220 }}
                    options={options}
                    placeholder="请选择物料库"
                    size="large"
                />
                <Button 
                    type="primary" 
                    icon={<SyncOutlined spin={syncing} />} 
                    onClick={sync} 
                    loading={syncing}
                    disabled={options.length === 0}
                    size="large"
                    style={{ borderRadius: 6 }}
                >
                    同步物料
                </Button>
                {options.length === 0 && (
                    <Button 
                        type="default"
                        onClick={initMaterials}
                        loading={initializing}
                        size="large"
                        style={{ borderRadius: 6 }}
                    >
                        初始化推荐物料
                    </Button>
                )}
                <Button 
                    icon={<BarChartOutlined />}
                    onClick={() => setShowStats(true)}
                    size="large"
                    style={{ borderRadius: 6 }}
                >
                    统计信息
                </Button>
            </div>

            {/* 高级搜索栏 */}
            {options.length > 0 && (
                <Card 
                    style={{ 
                        marginBottom: 24,
                        borderRadius: 8,
                        boxShadow: '0 1px 2px 0 rgba(0,0,0,.03), 0 1px 6px -1px rgba(0,0,0,.02), 0 2px 4px 0 rgba(0,0,0,.02)',
                        border: '1px solid #f0f0f0',
                    }}
                    title={
                        <Space style={{ fontSize: 15, fontWeight: 500 }}>
                            <SearchOutlined style={{ color: '#1677ff' }} />
                            <span>物料搜索</span>
                        </Space>
                    }
                    headStyle={{ 
                        borderBottom: '1px solid #f0f0f0',
                        padding: '12px 20px'
                    }}
                    bodyStyle={{ padding: '20px' }}
                >
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                        <Input.Search
                            placeholder="搜索物料库名称、描述、标签..."
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)}
                            onSearch={handleSearchMaterials}
                            enterButton={
                                <Button 
                                    type="primary" 
                                    icon={<SearchOutlined />}
                                    style={{ borderRadius: '0 6px 6px 0' }}
                                >
                                    搜索物料库
                                </Button>
                            }
                            size="large"
                            style={{ borderRadius: 6 }}
                        />
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 12, 
                            flexWrap: 'wrap',
                            paddingTop: 8
                        }}>
                            <span style={{ 
                                color: '#00000073', 
                                fontSize: 14,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <FilterOutlined /> 筛选条件
                            </span>
                            <Select
                                placeholder="框架类型"
                                value={filterType || undefined}
                                onChange={setFilterType}
                                style={{ width: 160 }}
                                allowClear
                                options={frameworkTypes.map(f => ({ 
                                    label: `${f.icon} ${f.label}`, 
                                    value: f.value 
                                }))}
                            />
                            <Select
                                placeholder="物料分类"
                                value={filterCategory || undefined}
                                onChange={setFilterCategory}
                                style={{ width: 160 }}
                                allowClear
                                options={materialCategories.map(c => ({ 
                                    label: `${c.icon} ${c.label}`, 
                                    value: c.value 
                                }))}
                            />
                            <Button 
                                type="primary"
                                onClick={handleSearchMaterials}
                                style={{ borderRadius: 6 }}
                            >
                                应用筛选
                            </Button>
                            <Button 
                                onClick={() => {
                                    setSearchKeyword('');
                                    setFilterType('');
                                    setFilterCategory('');
                                    setSearchMode('blocks');
                                }}
                                style={{ borderRadius: 6 }}
                            >
                                清除
                            </Button>
                        </div>
                    </Space>
                </Card>
            )}

            {/* 内容区域 */}
            {options.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: 80, 
                    background: '#fafafa', 
                    borderRadius: 8,
                    border: '1px dashed #d9d9d9'
                }}>
                    <InfoCircleOutlined style={{ 
                        fontSize: 64, 
                        color: '#bfbfbf', 
                        marginBottom: 24 
                    }} />
                    <p style={{ 
                        color: '#00000073', 
                        fontSize: 16, 
                        marginBottom: 24,
                        lineHeight: 1.6
                    }}>
                        暂无物料库，请先初始化推荐物料
                    </p>
                    <Button 
                        type="primary"
                        size="large"
                        onClick={initMaterials}
                        loading={initializing}
                        style={{ 
                            borderRadius: 6,
                            height: 40,
                            paddingLeft: 32,
                            paddingRight: 32,
                            fontSize: 15
                        }}
                    >
                        初始化推荐物料
                    </Button>
                </div>
            ) : searchMode === 'materials' ? (
                // 物料库搜索结果
                <Spin spinning={materialsLoading}>
                    {materials.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {materials.map((material) => (
                                <Col key={material.id} xs={24} sm={12} md={8} lg={6}>
                                    <Card
                                        hoverable
                                        onClick={() => handleSelectMaterial(material.name)}
                                        style={{ 
                                            height: '100%',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
                                            border: '1px solid #f0f0f0',
                                        }}
                                        bodyStyle={{ padding: 20 }}
                                    >
                                        <Card.Meta
                                            title={
                                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                    <div style={{ 
                                                        fontSize: 16, 
                                                        fontWeight: 600,
                                                        color: '#000000d9',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {material.alias}
                                                    </div>
                                                    <Space size={6} wrap>
                                                        {material.type && (
                                                            <Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>
                                                                {material.type}
                                                            </Tag>
                                                        )}
                                                        {material.category && (
                                                            <Tag color="green" style={{ margin: 0, borderRadius: 4 }}>
                                                                {materialCategories.find(c => c.value === material.category)?.label || material.category}
                                                            </Tag>
                                                        )}
                                                    </Space>
                                                </Space>
                                            }
                                            description={
                                                <div style={{ marginTop: 8 }}>
                                                    <p style={{ 
                                                        fontSize: 13, 
                                                        color: '#00000073',
                                                        marginBottom: 12,
                                                        lineHeight: 1.6,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        minHeight: 40
                                                    }}>
                                                        {material.description || '暂无描述'}
                                                    </p>
                                                    {material.framework && (
                                                        <div style={{ 
                                                            fontSize: 12, 
                                                            color: '#00000073',
                                                            marginBottom: 4
                                                        }}>
                                                            框架: {material.framework}
                                                        </div>
                                                    )}
                                                    {material.usageCount > 0 && (
                                                        <div style={{ 
                                                            fontSize: 12, 
                                                            color: '#00000073'
                                                        }}>
                                                            使用次数: {material.usageCount}
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: 60, 
                            color: '#00000073',
                            fontSize: 15
                        }}>
                            未找到匹配的物料库
                        </div>
                    )}
                </Spin>
            ) : selected ? (
                // 区块视图
                <BlocksView materialsName={selected} materialsAlias={options.find(o => o.value === selected)?.label} />
            ) : (
                <div style={{ 
                    textAlign: 'center', 
                    padding: 60, 
                    color: '#00000073',
                    fontSize: 15
                }}>
                    请选择物料库或使用搜索功能
                </div>
            )}

            {/* 统计信息弹窗 */}
            <Modal
                title={
                    <Space style={{ fontSize: 16, fontWeight: 600 }}>
                        <BarChartOutlined style={{ color: '#1677ff' }} />
                        <span>物料统计</span>
                    </Space>
                }
                open={showStats}
                onCancel={() => setShowStats(false)}
                footer={null}
                width={800}
                styles={{
                    header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 16 },
                    body: { paddingTop: 24 }
                }}
            >
                {stats && (
                    <div>
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <Card style={{ 
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0',
                                    textAlign: 'center'
                                }}>
                                    <Statistic 
                                        title="物料总数" 
                                        value={stats.total}
                                        valueStyle={{ color: '#000000d9', fontWeight: 600 }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card style={{ 
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0',
                                    textAlign: 'center'
                                }}>
                                    <Statistic 
                                        title="已激活" 
                                        value={stats.active} 
                                        valueStyle={{ color: '#52c41a', fontWeight: 600 }} 
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card style={{ 
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0',
                                    textAlign: 'center'
                                }}>
                                    <Statistic 
                                        title="自定义" 
                                        value={stats.custom} 
                                        valueStyle={{ color: '#1677ff', fontWeight: 600 }} 
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card 
                            title={<span style={{ fontSize: 15, fontWeight: 500 }}>按类型分布</span>}
                            style={{ 
                                marginBottom: 16,
                                borderRadius: 8,
                                border: '1px solid #f0f0f0'
                            }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                        >
                            <Space wrap size={[8, 8]}>
                                {Object.entries(stats.byType).map(([type, count]) => (
                                    <Tag key={type} color="blue" style={{ margin: 0, borderRadius: 4, padding: '4px 12px' }}>
                                        {frameworkTypes.find(f => f.value === type)?.label || type}: {count}
                                    </Tag>
                                ))}
                            </Space>
                        </Card>

                        <Card 
                            title={<span style={{ fontSize: 15, fontWeight: 500 }}>按分类分布</span>}
                            style={{ 
                                marginBottom: 16,
                                borderRadius: 8,
                                border: '1px solid #f0f0f0'
                            }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                        >
                            <Space wrap size={[8, 8]}>
                                {Object.entries(stats.byCategory).map(([category, count]) => (
                                    <Tag key={category} color="green" style={{ margin: 0, borderRadius: 4, padding: '4px 12px' }}>
                                        {materialCategories.find(c => c.value === category)?.label || category}: {count}
                                    </Tag>
                                ))}
                            </Space>
                        </Card>

                        {stats.topUsed && stats.topUsed.length > 0 && (
                            <Card 
                                title={<span style={{ fontSize: 15, fontWeight: 500 }}>最常使用</span>}
                                style={{ 
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0'
                                }}
                                headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                            >
                                <List
                                    dataSource={stats.topUsed}
                                    renderItem={(item: any) => (
                                        <List.Item style={{ padding: '12px 0' }}>
                                            <List.Item.Meta
                                                title={
                                                    <span style={{ 
                                                        fontSize: 14, 
                                                        fontWeight: 500,
                                                        color: '#000000d9'
                                                    }}>
                                                        {item.alias}
                                                    </span>
                                                }
                                                description={
                                                    <Space size={6} style={{ marginTop: 4 }}>
                                                        {item.type && (
                                                            <Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>
                                                                {item.type}
                                                            </Tag>
                                                        )}
                                                        {item.category && (
                                                            <Tag color="green" style={{ margin: 0, borderRadius: 4 }}>
                                                                {item.category}
                                                            </Tag>
                                                        )}
                                                        <span style={{ color: '#00000073', fontSize: 13 }}>
                                                            使用 {item.usageCount} 次
                                                        </span>
                                                    </Space>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        )}
                    </div>
                )}
            </Modal>

            {/* 同步结果弹窗 */}
            <Modal
                title="同步结果"
                open={showResults}
                onCancel={() => setShowResults(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setShowResults(false)}>
                        关闭
                    </Button>
                ]}
                width={600}
            >
                <List
                    dataSource={syncResults}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={getStatusIcon(item.status)}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{item.alias}</span>
                                        {getStatusTag(item.status)}
                                    </div>
                                }
                                description={item.message}
                            />
                        </List.Item>
                    )}
                />
            </Modal>
        </MainLayout>
    );
}
