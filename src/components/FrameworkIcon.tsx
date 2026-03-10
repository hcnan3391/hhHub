'use client';

import React from 'react';

const FRAMEWORK_COLORS: Record<string, string> = {
    React: '#61dafb',
    Vue: '#42b983',
    Angular: '#dd0031',
    Bootstrap: '#7952b3',
};

const FRAMEWORK_TEXT_COLORS: Record<string, string> = {
    React: '#000',
    Vue: '#fff',
    Angular: '#fff',
    Bootstrap: '#fff',
};

interface FrameworkIconProps {
    type?: string | null;
    size?: number;
}

export default function FrameworkIcon({ type = 'React', size = 36 }: FrameworkIconProps) {
    const key = type || 'React';
    const bg = FRAMEWORK_COLORS[key] || '#ccc';
    const color = FRAMEWORK_TEXT_COLORS[key] || '#000';
    const initial = key.charAt(0).toUpperCase();

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 8,
                background: bg,
                color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: size * 0.45,
                marginRight: 12,
                flexShrink: 0,
            }}
            title={key}
        >
            {initial}
        </div>
    );
}
