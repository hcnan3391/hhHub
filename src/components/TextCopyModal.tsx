'use client';

import React from 'react';
import { Modal, Typography, Button, message } from 'antd';

const { Text } = Typography;

interface TextCopyModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    texts?: Array<{ title?: string; text: string }>;
    text?: string;
}

export default function TextCopyModal({ open, onClose, title = '使用', texts, text }: TextCopyModalProps) {
    const items = texts || (text ? [{ title: '', text }] : []);

    const copyText = (str: string) => {
        navigator.clipboard.writeText(str).then(() => {
            message.success('已复制到剪贴板！');
        });
    };

    return (
        <Modal
            open={open}
            title={title}
            onCancel={onClose}
            footer={<Button onClick={onClose}>关闭</Button>}
        >
            {items.map((item, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                    {item.title && (
                        <p style={{ color: '#666', marginBottom: 8 }}>{item.title}</p>
                    )}
                    <div
                        style={{
                            background: '#1e1e1e',
                            borderRadius: 6,
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                        }}
                    >
                        <Text code style={{ color: '#e6edf3', background: 'transparent', fontSize: 13 }}>
                            {item.text}
                        </Text>
                        <Button size="small" onClick={() => copyText(item.text)} style={{ flexShrink: 0 }}>
                            复制
                        </Button>
                    </div>
                </div>
            ))}
        </Modal>
    );
}
