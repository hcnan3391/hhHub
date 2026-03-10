'use client';

import React from 'react';
import { Card, Typography } from 'antd';
import MainLayout from '@/components/MainLayout';
import { ToolkitData } from '@/data/toolkitData';

const { Text, Title } = Typography;

export default function ToolkitPage() {
    return (
        <MainLayout>
            <Title level={5} style={{ marginBottom: 24 }}>工具箱</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {ToolkitData.map(item => (
                    <Card
                        key={item.key}
                        hoverable
                        style={{ width: 260, height: 160 }}
                        onClick={() => window.open(item.url, '_blank')}
                        bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}
                    >
                        <img
                            src={item.image}
                            alt={item.title}
                            style={{ height: 48, objectFit: 'contain', marginBottom: 10 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <Title level={5} style={{ margin: '0 0 6px' }}>
                            <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                                {item.title}
                            </a>
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                        </Text>
                    </Card>
                ))}
            </div>
        </MainLayout>
    );
}
