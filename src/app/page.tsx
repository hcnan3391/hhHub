'use client';

import React from 'react';
import { Row, Col, Card, Button, Typography } from 'antd';
import { InfoCircleOutlined, BarChartOutlined, AppstoreOutlined, CodeOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Paragraph } = Typography;

const MATERIALS_LIST = [
  { title: 'Ant Design 物料', url: 'https://github.com/ant-design/ant-design-blocks' },
  { title: 'RootLinkFE React 物料', url: 'https://github.com/RootLinkFE/materials-react' },
  { title: 'RootLinkFE Vue 物料', url: 'https://github.com/RootLinkFE/materials-vue' },
];

const DOC_URL = 'https://github.com/RootLinkFE/hhHub';

export default function OverviewPage() {
  return (
    <MainLayout>
      <Row gutter={24} style={{ height: '100%' }}>
        <Col xs={24} lg={16} style={{ margin: '0 auto' }}>
          <Card bordered={false}>
            <Title level={3} style={{ textAlign: 'center' }}>欢迎使用 hhHub</Title>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32 }}>
              <InfoCircleOutlined style={{ fontSize: 36, color: '#1677ff', marginRight: 16, marginTop: 4 }} />
              <div>
                <Title level={5}>设计规范</Title>
                <Paragraph>多端统一物料平台，低码化、移动化、组件化、区块化、治理降本、流通降本、社区化、国际化</Paragraph>
                <Paragraph>物料设计研发规范（效率、体验、质量）</Paragraph>
                <Paragraph>物料运营管理规范</Paragraph>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32 }}>
              <BarChartOutlined style={{ fontSize: 36, color: '#1677ff', marginRight: 16, marginTop: 4 }} />
              <div>
                <Title level={5}>可视化开发</Title>
                <Paragraph>可视化UI界面，物料预览，源码查看，个性化配置</Paragraph>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32 }}>
              <CodeOutlined style={{ fontSize: 36, color: '#1677ff', marginRight: 16, marginTop: 4 }} />
              <div>
                <Title level={5}>配套工具</Title>
                <Paragraph>CLI、脚手架、配套的CI命令帮助你快速开发物料，管理项目等</Paragraph>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32 }}>
              <AppstoreOutlined style={{ fontSize: 36, color: '#1677ff', marginRight: 16, marginTop: 4 }} />
              <div>
                <Title level={5}>丰富物料</Title>
                <Paragraph>集成 ant-design 物料，基于丰富的物料可帮助你快速开发页面，并且支持私有物料</Paragraph>
                {MATERIALS_LIST.map(item => (
                  <Paragraph key={item.title}>
                    {item.title}&nbsp;
                    {item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>}
                  </Paragraph>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" href={DOC_URL} target="_blank">了解更多 &gt;</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
