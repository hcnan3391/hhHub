import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            materialsName,
            blockKey,
            blockName,
            description,
            files,
            tags,
            category,
            screenshot,
        } = body;

        if (!materialsName || !blockKey || !blockName || !files) {
            return NextResponse.json(
                { success: false, message: '缺少必填参数：materialsName、blockKey、blockName、files' },
                { status: 400 }
            );
        }

        // Validate blockKey format (alphanumeric, hyphens, underscores only)
        if (!/^[a-zA-Z0-9_-]+$/.test(blockKey)) {
            return NextResponse.json(
                { success: false, message: '区块标识只能包含英文字母、数字、连字符和下划线' },
                { status: 400 }
            );
        }

        const roothubPath = path.join(process.cwd(), '.hhHub');
        const materialPath = path.join(roothubPath, materialsName);
        const blockPath = path.join(materialPath, blockKey);
        const materialsJsonPath = path.join(materialPath, 'materials.json');

        // Create material directory if it doesn't exist
        if (!fs.existsSync(materialPath)) {
            fs.mkdirSync(materialPath, { recursive: true });
        }

        // Check if block already exists
        if (fs.existsSync(blockPath)) {
            return NextResponse.json(
                { success: false, message: `区块「${blockKey}」已存在，请使用其他标识` },
                { status: 409 }
            );
        }

        // Create block directory structure and write files
        const fileEntries = Object.entries(files as Record<string, string>);

        for (const [filePath, content] of fileEntries) {
            const fullPath = path.join(blockPath, filePath);
            const dir = path.dirname(fullPath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(fullPath, content, 'utf-8');
        }

        // Save screenshot if provided
        let screenshotUrl = '';
        if (screenshot && screenshot.startsWith('data:image')) {
            const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const screenshotPath = path.join(blockPath, 'snapshot.png');
            fs.writeFileSync(screenshotPath, buffer);
            screenshotUrl = `/api/blocks/screenshot?materialsName=${encodeURIComponent(materialsName)}&blockName=${encodeURIComponent(blockKey)}`;
        }

        // Read or create materials.json
        let materialsJson: any = { list: { blocks: [] } };
        if (fs.existsSync(materialsJsonPath)) {
            try {
                const raw = JSON.parse(fs.readFileSync(materialsJsonPath, 'utf-8'));
                if (!raw.list) raw.list = {};
                if (!raw.list.blocks) raw.list.blocks = [];
                materialsJson = raw;
            } catch {
                materialsJson = { list: { blocks: [] } };
            }
        }

        // Extract tags from code and dependencies
        const mainCode = files['src/index.tsx'] || files['src/index.js'] || '';
        const packageJson = files['package.json'] ? JSON.parse(files['package.json']) : {};
        const extractedTags = extractTags(blockKey, packageJson, mainCode);

        // Append new block record
        materialsJson.list.blocks.push({
            key: blockKey,
            name: blockName,
            description: description || '',
            tags: tags?.length > 0 ? tags : extractedTags,
            category: category || inferCategory(blockKey),
            screenshot: screenshotUrl,
            previewUrl: '',
        });

        // Write back materials.json
        fs.writeFileSync(materialsJsonPath, JSON.stringify(materialsJson, null, 2), 'utf-8');

        return NextResponse.json({
            success: true,
            message: '区块创建成功',
            data: {
                key: blockKey,
                fileCount: fileEntries.length,
                screenshot: !!screenshotUrl,
            },
        });
    } catch (err: any) {
        console.error('Error creating block:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

/**
 * 从区块名称和 package.json 提取标签
 */
function extractTags(blockName: string, packageJson: any, code: string): string[] {
    const tags: string[] = [];

    // 从名称中提取组件类型
    const nameParts = blockName.split('-');
    if (nameParts.length > 0) {
        tags.push(nameParts[0]);
    }

    // 从 dependencies 中提取 UI 库信息
    const deps = packageJson.dependencies || {};
    if (deps.antd) {
        tags.push('Ant Design');
    }
    if (deps['@ant-design/icons']) {
        tags.push('图标');
    }
    if (deps['@ant-design/pro-components'] || deps['@ant-design/pro-layout']) {
        tags.push('Pro Components');
    }

    // 从代码中检测使用的组件
    if (code.includes('Chart') || code.includes('chart')) {
        tags.push('图表');
    }
    if (code.includes('Table') || code.includes('table')) {
        tags.push('表格');
    }
    if (code.includes('Form') || code.includes('form')) {
        tags.push('表单');
    }

    return tags;
}

/**
 * 根据区块名称推断分类
 */
function inferCategory(blockName: string): string {
    const nameParts = blockName.split('-');
    const componentType = nameParts[0];

    // 表单相关组件
    const formComponents = [
        'input', 'select', 'checkbox', 'radio', 'switch', 'slider', 'date-picker',
        'time-picker', 'calendar', 'form', 'cascader', 'tree-select', 'auto-complete',
        'mention', 'rate', 'transfer', 'upload'
    ];
    if (formComponents.includes(componentType)) {
        return 'form';
    }

    // 数据展示组件
    const dataDisplayComponents = [
        'table', 'list', 'card', 'collapse', 'tree', 'avatar', 'badge', 'calendar',
        'carousel', 'descriptions', 'empty', 'image', 'popover', 'qrcode', 'segmented',
        'statistic', 'tabs', 'tag', 'timeline', 'tooltip', 'tour'
    ];
    if (dataDisplayComponents.includes(componentType)) {
        return 'data-display';
    }

    // 导航组件
    const navigationComponents = [
        'affix', 'anchor', 'back-top', 'breadcrumb', 'dropdown', 'menu', 'pagination',
        'page-header', 'steps'
    ];
    if (navigationComponents.includes(componentType)) {
        return 'navigation';
    }

    // 反馈组件
    const feedbackComponents = [
        'alert', 'drawer', 'message', 'modal', 'notification', 'popconfirm', 'progress',
        'result', 'skeleton', 'spin', 'watermark'
    ];
    if (feedbackComponents.includes(componentType)) {
        return 'feedback';
    }

    return 'component';
}
