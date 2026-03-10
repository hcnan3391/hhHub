'use client';

import React, { useEffect, useState } from 'react';
import {
    Form, Input, Button, Radio, Card, Switch, Modal, notification, Space,
    Typography, Select, Tag,
} from 'antd';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import FrameworkIcon from '@/components/FrameworkIcon';
import { materialCategories, frameworkTypes } from '@/data/recommendMaterials';
import BlockEditorModal from '@/components/BlockEditorModal';

const { Title } = Typography;

interface Material {
    id: number; 
    alias: string; 
    name: string; 
    gitPath?: string;
    description?: string; 
    type?: string; 
    category?: string;
    framework?: string;
    uiLibrary?: string;
    tags?: string[];
    sourceType?: string;
    active: boolean; 
    isCustom: boolean;
}

export default function SettingPage() {
    const [settingForm] = Form.useForm();
    const [materialForm] = Form.useForm();
    const [recommendMaterials, setRecommendMaterials] = useState<Material[]>([]);
    const [customMaterials, setCustomMaterials] = useState<Material[]>([]);
    const [modal, setModal] = useState(false);
    const [formType, setFormType] = useState<'add' | 'edit'>('add');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [blockEditorOpen, setBlockEditorOpen] = useState(false);
    const [blockEditorMaterial, setBlockEditorMaterial] = useState<Material | null>(null);

    const fetchMaterials = async () => {
        console.log('fetchMaterials called');
        const res = await fetch('/api/materials', { cache: 'no-store' }).then(r => r.json());
        console.log('fetchMaterials response:', res);
        if (res.success) {
            // 强制创建新数组引用，确保 React 检测到状态变化
            setRecommendMaterials([...res.data.recommendMaterials]);
            setCustomMaterials([...res.data.customMaterials]);
            console.log('State updated:', {
                recommendCount: res.data.recommendMaterials.length,
                customCount: res.data.customMaterials.length
            });
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const settingRes = await fetch('/api/setting').then(r => r.json());
            if (settingRes.success) {
                settingForm.setFieldsValue(settingRes.data);
            }
            await fetchMaterials();
        };
        loadData();
    }, [settingForm]);

    const saveSetting = async () => {
        const values = settingForm.getFieldsValue();
        const res = await fetch('/api/setting', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
        }).then(r => r.json());
        if (res.success) notification.success({ message: '保存成功' });
        else notification.error({ message: '保存失败', description: res.message });
    };

    const toggleMaterial = async (id: number, active: boolean) => {
        const res = await fetch(`/api/materials/${id}`, {
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ active }),
        }).then(r => r.json());
        
        if (res.success) {
            notification.success({ message: '设置成功', duration: 1 });
            await fetchMaterials();
        } else {
            notification.error({ message: '设置失败', description: res.message });
        }
    };

    const deleteMaterial = (id: number) => {
        Modal.confirm({
            title: '提示', content: '确定要删除吗？',
            onOk: async () => {
                const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' }).then(r => r.json());
                if (res.success) {
                    notification.success({ message: '删除成功', duration: 1 });
                    fetchMaterials();
                } else {
                    notification.error({ message: '删除失败', description: res.message });
                }
            },
        });
    };

    const openAdd = () => {
        setFormType('add');
        setEditingId(null);
        materialForm.resetFields();
        setModal(true);
    };

    const openEdit = (m: Material) => {
        setFormType('edit');
        setEditingId(m.id);
        materialForm.setFieldsValue({ 
            type: m.type, 
            alias: m.alias, 
            gitPath: m.gitPath, 
            description: m.description,
            category: m.category,
            framework: m.framework,
            uiLibrary: m.uiLibrary,
            tags: m.tags || [],
        });
        setModal(true);
    };

    const submitMaterial = async () => {
        try {
            await materialForm.validateFields();
            const values = materialForm.getFieldsValue();
            const gitArr = (values.gitPath || '').split('/');
            const name = gitArr[gitArr.length - 1]?.replace('.git', '') || values.alias;
            
            // 处理 tags，转换为 JSON 字符串
            const payload = {
                ...values,
                name,
                tags: values.tags ? JSON.stringify(values.tags) : undefined,
            };
            
            if (formType === 'add') {
                const res = await fetch('/api/materials', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).then(r => r.json());
                
                if (res.success) { 
                    notification.success({ message: '添加成功', duration: 1 }); 
                    setModal(false); 
                    await fetchMaterials(); 
                } else {
                    notification.error({ message: res.message });
                }
            } else if (editingId !== null) {
                const res = await fetch(`/api/materials/${editingId}`, {
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).then(r => r.json());
                
                console.log('PATCH response:', res);
                
                if (res.success) { 
                    notification.success({ message: '修改成功', duration: 1 }); 
                    setModal(false); 
                    console.log('Calling fetchMaterials...');
                    await fetchMaterials(); 
                    console.log('fetchMaterials completed');
                } else {
                    notification.error({ message: res.message });
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            notification.error({ message: '操作失败' });
        }
    };

    const MaterialCard = ({ m, isCustom }: { m: Material; isCustom?: boolean }) => (
        <Card
            style={{ 
                marginBottom: 12,
                borderRadius: 8,
                transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
                border: '1px solid #f0f0f0',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,.03)',
            }}
            styles={{
                body: { 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '20px 24px' 
                }
            }}
            hoverable
        >
            <Space size={16}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                }}>
                    <FrameworkIcon type={m.type} />
                </div>
                <div>
                    <div style={{ 
                        fontWeight: 600, 
                        fontSize: 16, 
                        marginBottom: 6,
                        color: '#000000d9'
                    }}>
                        {m.alias}
                    </div>
                    <Space size={6} wrap style={{ marginBottom: 6 }}>
                        {m.category && (
                            <Tag color="green" style={{ fontSize: 12, margin: 0, borderRadius: 4 }}>
                                {materialCategories.find(c => c.value === m.category)?.label || m.category}
                            </Tag>
                        )}
                        {m.framework && (
                            <Tag color="blue" style={{ fontSize: 12, margin: 0, borderRadius: 4 }}>
                                {m.framework}
                            </Tag>
                        )}
                    </Space>
                    <div style={{ fontSize: 13, color: '#00000073', lineHeight: 1.5 }}>
                        {m.description || '暂无描述'}
                    </div>
                </div>
            </Space>
            <Space size={16}>
                {isCustom && (
                    <Space size={12}>
                        <PlusOutlined
                            style={{
                                cursor: 'pointer',
                                color: '#52c41a',
                                fontSize: 18,
                                transition: 'all 0.3s',
                            }}
                            title="添加区块"
                            onClick={() => { setBlockEditorMaterial(m); setBlockEditorOpen(true); }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        <EditOutlined
                            style={{ 
                                cursor: 'pointer', 
                                color: '#1677ff',
                                fontSize: 18,
                                transition: 'all 0.3s',
                            }} 
                            onClick={() => openEdit(m)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        <DeleteOutlined 
                            style={{ 
                                cursor: 'pointer', 
                                color: '#ff4d4f',
                                fontSize: 18,
                                transition: 'all 0.3s',
                            }} 
                            onClick={() => deleteMaterial(m.id)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    </Space>
                )}
                <Switch
                    checked={m.active}
                    checkedChildren="开" unCheckedChildren="关"
                    onChange={(checked) => {
                        toggleMaterial(m.id, checked);
                    }}
                />
            </Space>
        </Card>
    );

    return (
        <MainLayout>
            {/* Basic Settings */}
            <div style={{ marginBottom: 48 }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Title level={4} style={{ 
                        margin: 0, 
                        fontWeight: 600,
                        fontSize: 18,
                        color: '#000000d9'
                    }}>
                        基础设置
                    </Title>
                </div>
                <Card 
                    style={{ 
                        borderRadius: 8,
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 2px 0 rgba(0,0,0,.03), 0 1px 6px -1px rgba(0,0,0,.02), 0 2px 4px 0 rgba(0,0,0,.02)'
                    }}
                >
                    <Form form={settingForm} labelCol={{ span: 4 }} wrapperCol={{ span: 16 }}>
                        <Form.Item
                            label="下载目录"
                            name="downloadPath"
                            tooltip="工作目录根目录"
                        >
                            <Input 
                                style={{ width: 400, borderRadius: 6 }}
                                size="large"
                                placeholder="默认路径为工作目录下的 .hhHub" 
                            />
                        </Form.Item>
                        <Form.Item label="包管理器" name="nodeTool">
                            <Radio.Group size="large">
                                <Radio value="yarn">yarn</Radio>
                                <Radio value="npm">npm</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item wrapperCol={{ offset: 4 }}>
                            <Button 
                                type="primary" 
                                size="large"
                                onClick={saveSetting}
                                style={{ 
                                    borderRadius: 6, 
                                    paddingLeft: 32, 
                                    paddingRight: 32,
                                    height: 40
                                }}
                            >
                                保存设置
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>

            {/* Official Materials */}
            <div style={{ marginBottom: 48 }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Title level={4} style={{ 
                        margin: 0, 
                        fontWeight: 600,
                        fontSize: 18,
                        color: '#000000d9'
                    }}>
                        官方推荐物料
                    </Title>
                    <div style={{ 
                        marginLeft: 12,
                        padding: '4px 12px',
                        background: '#e6f7ff',
                        color: '#1677ff',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 500
                    }}>
                        {recommendMaterials.length} 个
                    </div>
                </div>
                {recommendMaterials.map(m => <MaterialCard key={m.id} m={m} />)}
                {recommendMaterials.length === 0 && (
                    <div style={{ 
                        textAlign: 'center',
                        padding: 60,
                        background: '#fafafa',
                        borderRadius: 8,
                        color: '#00000073',
                        fontSize: 15,
                        border: '1px dashed #d9d9d9'
                    }}>
                        暂无官方物料，请先同步
                    </div>
                )}
            </div>

            {/* Custom Materials */}
            <div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Title level={4} style={{ 
                            margin: 0, 
                            fontWeight: 600,
                            fontSize: 18,
                            color: '#000000d9'
                        }}>
                            自定义物料
                        </Title>
                        <div style={{ 
                            marginLeft: 12,
                            padding: '4px 12px',
                            background: '#f6ffed',
                            color: '#52c41a',
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 500
                        }}>
                            {customMaterials.length} 个
                        </div>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusCircleOutlined />}
                        onClick={openAdd}
                        style={{ 
                            borderRadius: 6,
                            height: 40
                        }}
                    >
                        添加物料
                    </Button>
                </div>
                {customMaterials.map(m => <MaterialCard key={m.id} m={m} isCustom />)}
                {customMaterials.length === 0 && (
                    <div style={{ 
                        textAlign: 'center',
                        padding: 60,
                        background: '#fafafa',
                        borderRadius: 8,
                        color: '#00000073',
                        fontSize: 15,
                        border: '1px dashed #d9d9d9'
                    }}>
                        暂无自定义物料，点击右上角按钮添加
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}            <Modal
                open={modal}
                title={
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#000000d9' }}>
                        {formType === 'add' ? '添加自定义物料' : '编辑物料'}
                    </span>
                }
                onCancel={() => setModal(false)}
                onOk={submitMaterial}
                okText="确定" 
                cancelText="取消"
                width={600}
                styles={{
                    header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 16 },
                    body: { paddingTop: 24 }
                }}
                footer={[
                    <Button 
                        key="help" 
                        href="https://github.com/RootLinkFE/hhHub" 
                        target="_blank"
                        style={{ borderRadius: 6 }}
                    >
                        查看帮助
                    </Button>,
                    <Button 
                        key="cancel" 
                        onClick={() => setModal(false)}
                        size="large"
                        style={{ borderRadius: 6 }}
                    >
                        取消
                    </Button>,
                    <Button 
                        key="ok" 
                        type="primary" 
                        onClick={submitMaterial}
                        size="large"
                        style={{ borderRadius: 6 }}
                    >
                        确定
                    </Button>,
                ]}
            >
                <Form form={materialForm} layout="vertical">
                    <Form.Item label="框架类型" name="type" rules={[{ required: true, message: '请选择框架类型' }]}>
                        <Select
                            size="large"
                            placeholder="选择框架类型"
                            options={frameworkTypes.map(f => ({
                                label: `${f.icon} ${f.label}`,
                                value: f.value,
                            }))}
                        />
                    </Form.Item>
                    
                    <Form.Item label="物料分类" name="category" rules={[{ required: true, message: '请选择物料分类' }]}>
                        <Select
                            size="large"
                            placeholder="选择物料分类"
                            options={materialCategories.map(c => ({
                                label: `${c.icon} ${c.label}`,
                                value: c.value,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label="物料名称" name="alias" rules={[{ required: true, message: '请填写物料名称' }]}>
                        <Input 
                            size="large"
                            placeholder="例如：我的 React 组件库" 
                        />
                    </Form.Item>

                    <Form.Item label="物料地址" name="gitPath" rules={[{ required: true, message: '请填写物料地址' }]}>
                        <Input 
                            size="large"
                            placeholder="ssh地址，例如 git@github.com:org/repo.git" 
                        />
                    </Form.Item>

                    <Form.Item label="框架版本" name="framework">
                        <Input 
                            size="large"
                            placeholder="例如：React 18, Vue 3" 
                        />
                    </Form.Item>

                    <Form.Item label="UI 库" name="uiLibrary">
                        <Input 
                            size="large"
                            placeholder="例如：Ant Design, Element UI" 
                        />
                    </Form.Item>

                    <Form.Item label="标签" name="tags">
                        <Select
                            size="large"
                            mode="tags"
                            placeholder="输入标签后按回车添加"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item label="描述" name="description">
                        <Input.TextArea 
                            rows={4}
                            placeholder="简要描述该物料库的用途和特点"
                            style={{ borderRadius: 6 }}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Block Editor Modal */}
            {blockEditorMaterial && (
                <BlockEditorModal
                    open={blockEditorOpen}
                    onClose={() => setBlockEditorOpen(false)}
                    onSuccess={() => {}}
                    materialsName={blockEditorMaterial.name}
                    materialsAlias={blockEditorMaterial.alias}
                />
            )}
        </MainLayout>
    );
}
