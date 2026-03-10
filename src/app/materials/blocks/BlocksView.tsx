'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Input, Row, Col, Button, Pagination, Empty, Modal, Tag, Space, Spin } from 'antd';
import { DownloadOutlined, SearchOutlined, PlayCircleOutlined, ApiOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons';
import TextCopyModal from '@/components/TextCopyModal';
import MaterialSandbox from '@/components/MaterialSandbox';
import DependencyAnalysis from '@/components/DependencyAnalysis';
import BlockEditorModal from '@/components/BlockEditorModal';

interface Block {
    name: string;
    key?: string; // 添加 key 字段，用于文件路径
    description?: string;
    screenshot?: string;
    previewUrl?: string;
    sourceCode?: string;
    tags?: string[];
    dependencies?: string[];
    category?: string | string[];
    type?: string;
}

const TAG_COLORS = ['blue', 'green', 'gold', 'purple', 'cyan'];

interface BlocksViewProps {
    materialsName: string;
    materialsAlias?: string;
}

export default function BlocksView({ materialsName, materialsAlias }: BlocksViewProps) {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState({ name: '', category: '全部', page: 1, pageSize: 24 });
    const [categories, setCategories] = useState<string[]>(['全部']);
    const [copyModal, setCopyModal] = useState(false);
    const [copyText, setCopyText] = useState('');
    const [sandboxOpen, setSandboxOpen] = useState(false);
    const [sandboxBlock, setSandboxBlock] = useState<Block | null>(null);
    const [dependencyOpen, setDependencyOpen] = useState(false);
    const [dependencyBlock, setDependencyBlock] = useState<Block | null>(null);
    const [blockEditorOpen, setBlockEditorOpen] = useState(false);

    const fetchBlocks = useCallback(async (params: typeof search, matName: string) => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({
                materialsName: matName,
                name: params.name,
                category: params.category,
                page: String(params.page),
                pageSize: String(params.pageSize),
            });
            const res = await fetch(`/api/blocks?${qs}`).then(r => r.json());
            if (res.success) {
                setBlocks(res.data.list || []);
                setTotal(res.data.total || 0);
                // Only update categories when loading all blocks (no category filter applied)
                if (params.category === '全部' && params.name === '') {
                    const cats = new Set<string>();
                    (res.data.list || []).forEach((b: Block) => {
                        if (Array.isArray(b.category)) {
                            b.category.forEach(c => c && cats.add(c));
                        } else if (b.category) {
                            cats.add(b.category);
                        }
                    });
                    setCategories(['全部', ...Array.from(cats)]);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const newSearch = { name: '', category: '全部', page: 1, pageSize: 24 };
        setSearch(newSearch);
        fetchBlocks(newSearch, materialsName);
    }, [materialsName, fetchBlocks]);

    const handleSearch = () => {
        const newSearch = { ...search, page: 1 };
        setSearch(newSearch);
        fetchBlocks(newSearch, materialsName);
    };

    const handleCategoryChange = (cat: string) => {
        const newSearch = { ...search, category: cat, page: 1 };
        setSearch(newSearch);
        fetchBlocks(newSearch, materialsName);
    };

    const handlePageChange = (page: number) => {
        const newSearch = { ...search, page };
        setSearch(newSearch);
        fetchBlocks(newSearch, materialsName);
    };

    const onCopy = (block: Block) => {
        setCopyText(`rh block use ${materialsName}:${block.name}`);
        setCopyModal(true);
    };

    const onSandboxPreview = (block: Block) => {
        setSandboxBlock(block);
        setSandboxOpen(true);
    };

    const onDependencyAnalysis = (block: Block) => {
        setDependencyBlock(block);
        setDependencyOpen(true);
    };

    return (
        <div>
            {/* Search bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <Input
                    size="large"
                    placeholder="输入关键词搜索，支持名称、描述、标签"
                    value={search.name}
                    onChange={e => setSearch(s => ({ ...s, name: e.target.value }))}
                    onPressEnter={handleSearch}
                    suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
                    style={{ flex: 1 }}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setBlockEditorOpen(true)}
                    style={{ borderRadius: 6, flexShrink: 0 }}
                >
                    新建区块
                </Button>
            </div>

            {/* Category filter */}
            <Space style={{ marginBottom: 20, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                    <Button
                        key={cat}
                        type={search.category === cat ? 'primary' : 'default'}
                        size="small"
                        onClick={() => handleCategoryChange(cat)}
                    >
                        {cat}
                    </Button>
                ))}
            </Space>

            {/* Block Grid */}
            <Spin spinning={loading}>
                {blocks.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {blocks.map((block, index) => (
                            <Col key={index} xs={24} sm={12} md={8} lg={6}>
                                <div
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        height: 260,
                                        padding: 0,
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.boxShadow = '0 1px 2px -2px rgba(0,0,0,.16), 0 3px 6px 0 rgba(0,0,0,.12), 0 5px 12px 4px rgba(0,0,0,.09)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = '#1677ff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#f0f0f0';
                                    }}
                                >
                                    {/* Screenshot */}
                                    <div
                                        style={{ 
                                            width: '100%', 
                                            height: 160, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            cursor: 'pointer', 
                                            background: '#fafafa',
                                            borderBottom: '1px solid #f0f0f0',
                                            overflow: 'hidden',
                                        }}
                                        onClick={() => onSandboxPreview(block)}
                                        title="点击编辑代码"
                                    >
                                        {block.screenshot ? (
                                            <img 
                                                src={block.screenshot} 
                                                alt={block.name} 
                                                style={{ 
                                                    maxWidth: '100%', 
                                                    maxHeight: '100%', 
                                                    objectFit: 'contain',
                                                    transition: 'transform 0.3s',
                                                }} 
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        ) : (
                                            <span style={{ color: '#bfbfbf', fontSize: 13 }}>暂无截图</span>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px 16px' }}>
                                        <div
                                            style={{
                                                fontWeight: 500, 
                                                fontSize: 14, 
                                                color: '#000000d9',
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                whiteSpace: 'nowrap',
                                                marginBottom: 8,
                                            }}
                                            title={block.name}
                                        >
                                            {block.name}
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            gap: 8,
                                        }}>
                                            <span style={{ 
                                                fontSize: 12, 
                                                color: '#00000073', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                whiteSpace: 'nowrap', 
                                                flex: 1 
                                            }}>
                                                {block.description || '暂无描述'}
                                            </span>
                                            <Space size={6} style={{ flexShrink: 0 }}>
                                                <span 
                                                    title="沙箱预览" 
                                                    style={{ 
                                                        color: '#1677ff', 
                                                        fontSize: 16, 
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s',
                                                    }} 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSandboxPreview(block);
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.color = '#4096ff';
                                                        e.currentTarget.style.transform = 'scale(1.2)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.color = '#1677ff';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <PlayCircleOutlined />
                                                </span>
                                                <span 
                                                    title="依赖分析" 
                                                    style={{ 
                                                        color: '#52c41a', 
                                                        fontSize: 16, 
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s',
                                                    }} 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDependencyAnalysis(block);
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.color = '#73d13d';
                                                        e.currentTarget.style.transform = 'scale(1.2)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.color = '#52c41a';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <ApiOutlined />
                                                </span>
                                                {block.previewUrl && (
                                                    <a 
                                                        href={block.previewUrl} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        title="预览" 
                                                        style={{ 
                                                            color: '#00000073', 
                                                            fontSize: 16,
                                                            transition: 'all 0.3s',
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.color = '#1677ff';
                                                            e.currentTarget.style.transform = 'scale(1.2)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.color = '#00000073';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        <ExportOutlined />
                                                    </a>
                                                )}
                                                <span 
                                                    title="下载代码" 
                                                    style={{ 
                                                        color: '#00000073', 
                                                        fontSize: 16, 
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s',
                                                    }} 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCopy(block);
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.color = '#1677ff';
                                                        e.currentTarget.style.transform = 'scale(1.2)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.color = '#00000073';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <DownloadOutlined />
                                                </span>
                                            </Space>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    !loading && <Empty description="暂无区块，请先同步物料库" />
                )}
            </Spin>

            {/* Pagination */}
            {total > 0 && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Pagination
                        current={search.page}
                        total={total}
                        pageSize={search.pageSize}
                        onChange={handlePageChange}
                        showTotal={t => `共 ${t} 个区块`}
                    />
                </div>
            )}

            {/* Copy CLI command modal */}
            <TextCopyModal
                open={copyModal}
                onClose={() => setCopyModal(false)}
                title="使用区块"
                text={copyText}
            />

            {/* Sandbox Preview */}
            <MaterialSandbox
                open={sandboxOpen}
                onClose={() => setSandboxOpen(false)}
                block={sandboxBlock}
                materialsName={materialsName}
            />

            {/* Dependency Analysis */}
            <DependencyAnalysis
                open={dependencyOpen}
                onClose={() => setDependencyOpen(false)}
                materialsName={materialsName}
                blockName={dependencyBlock?.key || dependencyBlock?.name || ''}
            />

            {/* Block Editor Modal */}
            <BlockEditorModal
                open={blockEditorOpen}
                onClose={() => setBlockEditorOpen(false)}
                onSuccess={() => fetchBlocks(search, materialsName)}
                materialsName={materialsName}
                materialsAlias={materialsAlias || materialsName}
            />
        </div>
    );
}
