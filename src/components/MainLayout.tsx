'use client';

import React, { useState, useEffect } from 'react';
import {
    HomeOutlined,
    AppstoreOutlined,
    GlobalOutlined,
    ToolOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode): MenuItem {
    return { key, icon, label } as MenuItem;
}

const navItems: MenuItem[] = [
    getItem('仪表盘', '/', <HomeOutlined />),
    getItem('物料', '/materials', <AppstoreOutlined />),
    getItem('资源', '/resource', <GlobalOutlined />),
    getItem('工具箱', '/toolkit', <ToolOutlined />),
    getItem('设置', '/setting', <SettingOutlined />),
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { token: { colorBgContainer } } = theme.useToken();

    // 确保客户端挂载后再渲染，避免 hydration 问题
    useEffect(() => {
        setMounted(true);
    }, []);

    // 路由变化时强制清理所有 iframe
    useEffect(() => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                iframe.remove();
            } catch (e) {
                // ignore
            }
        });
    }, [pathname]);

    // 处理菜单点击
    const handleMenuClick: MenuProps['onClick'] = (e) => {
        const path = e.key;

        // 如果已经在当前页面，不导航
        if (path === pathname) return;

        // 强制清理 Sandpack 相关资源
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => iframe.remove());

        // 清理可能的 Service Worker 注册
        if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    if (registration.scope.includes('sandpack')) {
                        registration.unregister();
                    }
                });
            });
        }

        // 导航到新页面
        router.push(path);
    };

    // Match active menu key
    const selectedKey = navItems.find(item => {
        const k = item?.key as string;
        return k === pathname || (k !== '/' && pathname.startsWith(k));
    })?.key as string || '/';

    // 避免 hydration 问题，等待客户端挂载
    if (!mounted) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={240}
                collapsedWidth={64}
                style={{
                    background: '#fff',
                    boxShadow: '2px 0 8px 0 rgba(0,0,0,.05)',
                    borderRight: '1px solid #f0f0f0',
                }}
                trigger={null}
            >
                <div
                    style={{
                        height: 64,
                        margin: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: 12,
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'all 0.3s',
                    }}
                >
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: 18,
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(22,119,255,0.2)',
                            transition: 'all 0.3s',
                        }}
                    >
                        R
                    </div>
                    {!collapsed && (
                        <span style={{
                            color: '#000000d9',
                            fontWeight: 600,
                            fontSize: 16,
                            letterSpacing: 0.5,
                            transition: 'all 0.3s',
                        }}>
                            hhHub
                        </span>
                    )}
                </div>
                <Menu
                    selectedKeys={[selectedKey]}
                    mode="inline"
                    items={navItems}
                    onClick={handleMenuClick}
                    style={{
                        marginTop: 8,
                        border: 'none',
                        background: 'transparent',
                    }}
                    inlineIndent={20}
                />
                <div
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        position: 'absolute',
                        bottom: 24,
                        left: collapsed ? '50%' : 16,
                        transform: collapsed ? 'translateX(-50%)' : 'none',
                        width: collapsed ? 32 : 'calc(100% - 32px)',
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: 6,
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                        color: '#00000073',
                        fontSize: 14,
                        transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f0f0';
                        e.currentTarget.style.color = '#000000d9';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fafafa';
                        e.currentTarget.style.color = '#00000073';
                    }}
                >
                    {collapsed ? '»' : '« 收起'}
                </div>
            </Sider>
            <Layout>
                <Header
                    style={{
                        padding: '0 40px',
                        background: '#fff',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        height: 64,
                        boxShadow: '0 1px 2px 0 rgba(0,0,0,.03)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <Title
                        level={4}
                        style={{
                            margin: 0,
                            fontWeight: 600,
                            color: '#000000d9',
                            fontSize: 18,
                        }}
                    >
                        前端物料管理系统
                    </Title>
                </Header>
                <Content style={{ margin: '24px 24px 0', overflow: 'initial' }}>
                    <div
                        style={{
                            padding: 32,
                            minHeight: 'calc(100vh - 64px - 24px - 48px)',
                            background: colorBgContainer,
                            borderRadius: 8,
                            boxShadow: '0 1px 2px 0 rgba(0,0,0,.03), 0 1px 6px -1px rgba(0,0,0,.02), 0 2px 4px 0 rgba(0,0,0,.02)',
                        }}
                    >
                        {children}
                    </div>
                </Content>
                <Footer
                    style={{
                        textAlign: 'center',
                        padding: '20px 24px',
                        color: '#00000073',
                        fontSize: 14,
                        background: 'transparent',
                    }}
                >
                    hhHub ©{new Date().getFullYear()} Created with ❤️
                </Footer>
            </Layout>
        </Layout>
    );
}
