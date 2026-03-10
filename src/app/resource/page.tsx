'use client';

import React, { useState } from 'react';
import { Button, Tag, Space, Typography } from 'antd';
import { CodeOutlined, FileTextOutlined, RocketOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import TextCopyModal from '@/components/TextCopyModal';
import { RESOURCE_LIST } from '@/data/resourceList';

const { Title, Paragraph } = Typography;

const TYPES = [
    { name: '基建工具', key: 'cliProject', types: ['cli', 'tool'] },
    { name: '模板', key: 'projectTemplate', types: ['templates'] },
    { name: '解决方案', key: 'solutionProject', types: ['solution'] },
];

const THEME_COLOR: Record<string, string> = {
    REACT: '#61dafb', VUE: '#42b983', ANTD: '#1890ff',
    'ANT-DESIGN-REACT': '#1890ff', 'ANT-DESIGN-VUE': '#1890ff', TYPESCRIPT: '#3178c6',
};

interface ResourceItem {
    name: string; title?: string; description?: string; tags?: string[];
    path?: string; previewUrl?: string; script?: Array<{ title?: string; command: string }> | string; type: string; img?: string;
}

export default function ResourcePage() {
    const [visibleTypes, setVisibleTypes] = useState<string[]>(TYPES.map(t => t.key));
    const [copyModal, setCopyModal] = useState(false);
    const [copyTexts, setCopyTexts] = useState<Array<{ title?: string; text: string }>>([]);

    const allVisible = visibleTypes.length === TYPES.length;

    const toggleAll = () => {
        setVisibleTypes(allVisible ? [] : TYPES.map(t => t.key));
    };

    const toggleType = (key: string) => {
        setVisibleTypes(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const download = (script: ResourceItem['script']) => {
        if (!script || typeof script === 'string') return;
        const texts = script.map(s => ({ title: s.title || '复制命令行到控制台中执行。', text: s.command }));
        setCopyTexts(texts);
        setCopyModal(true);
    };

    return (
        <MainLayout>
            {/* Filter buttons */}
            <Space style={{ marginBottom: 24, flexWrap: 'wrap' }}>
                <Button type={allVisible ? 'primary' : 'default'} onClick={toggleAll}>全部</Button>
                {TYPES.map(t => (
                    <Button
                        key={t.key}
                        type={visibleTypes.includes(t.key) ? 'primary' : 'default'}
                        onClick={() => toggleType(t.key)}
                    >
                        {t.name}
                    </Button>
                ))}
            </Space>

            {/* Resource sections */}
            {TYPES.filter(t => visibleTypes.includes(t.key)).map(typeGroup => {
                const items: ResourceItem[] = RESOURCE_LIST.filter(r => typeGroup.types.includes(r.type));
                return (
                    <div key={typeGroup.key} style={{ marginBottom: 32 }}>
                        <Title level={5} style={{ marginBottom: 16 }}>{typeGroup.name}</Title>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            {items.map(item => (
                                <div
                                    key={item.name}
                                    style={{
                                        width: typeGroup.key === 'cliProject' ? 240 : 480,
                                        minWidth: typeGroup.key === 'cliProject' ? 200 : 320,
                                        height: 180,
                                        background: '#fff',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 6,
                                        display: 'flex',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.12)')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                    onClick={() => item.previewUrl && window.open(item.previewUrl, '_blank')}
                                >
                                    <div style={{ padding: '14px 16px', flex: 1, position: 'relative' }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.name}
                                        </div>
                                        <Paragraph
                                            style={{ fontSize: 12, color: '#666', margin: '0 0 8px', lineHeight: 1.6 }}
                                            ellipsis={{ rows: 3 }}
                                        >
                                            {item.description}
                                        </Paragraph>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {(item.tags || []).map((tag, i) => (
                                                <Tag key={i} color={THEME_COLOR[tag.toUpperCase()] || '#00b259'} style={{ fontSize: 11 }}>
                                                    {tag}
                                                </Tag>
                                            ))}
                                        </div>
                                        <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', gap: 12 }}>
                                            {item.path && (
                                                <a onClick={e => { e.stopPropagation(); window.open(item.path, '_blank'); }} title="查看代码" style={{ color: '#86909c', fontSize: 18 }}>
                                                    <CodeOutlined />
                                                </a>
                                            )}
                                            {item.previewUrl && (
                                                <a onClick={e => { e.stopPropagation(); window.open(item.previewUrl, '_blank'); }} title="查看文档" style={{ color: '#86909c', fontSize: 18 }}>
                                                    <FileTextOutlined />
                                                </a>
                                            )}
                                            {item.script && Array.isArray(item.script) && (
                                                <a onClick={e => { e.stopPropagation(); download(item.script); }} title="快速上手" style={{ color: '#86909c', fontSize: 18 }}>
                                                    <RocketOutlined />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            <TextCopyModal
                open={copyModal}
                onClose={() => setCopyModal(false)}
                title="安装使用"
                texts={copyTexts}
            />
        </MainLayout>
    );
}
