import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// 物料配置文件适配器
function loadMaterialsConfig(materialsName: string) {
    const mainPath = path.join(process.cwd(), '.hhHub');
    const materialPath = path.join(mainPath, materialsName);

    // 尝试多种配置文件格式
    const configFiles = [
        { file: 'materials.json', parser: (data: any) => data.list?.blocks || [] },
        { file: 'umi-block.json', parser: (data: any) => data.blocks || [] },
        { file: 'rh-block.json', parser: (data: any) => data.list || [] },
        { file: 'package.json', parser: (data: any) => data.blocks || [] },
    ];

    for (const { file, parser } of configFiles) {
        const filePath = path.join(materialPath, file);
        if (fs.existsSync(filePath)) {
            try {
                const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const blocks = parser(raw);
                if (blocks && blocks.length > 0) {
                    return normalizeBlocks(blocks);
                }
            } catch (error) {
                console.error(`Error parsing ${file}:`, error);
            }
        }
    }

    return null;
}

// 标准化区块数据格式
function normalizeBlocks(blocks: any[]): any[] {
    return blocks.filter(Boolean).map((block: any) => ({
        name: block.name || block.key || block.title,
        key: block.key || block.value || block.name, // 添加 key 字段，用于文件路径
        description: block.description || '',
        screenshot: block.img || block.screenshot || '',
        previewUrl: block.previewUrl || '',
        sourceCode: block.url || block.sourceCode || '',
        tags: block.tags || [],
        dependencies: block.dependencies || block.features || [],
        category: block.category || block.type || '',
        type: block.type || '',
    }));
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const materialsName = searchParams.get('materialsName') || '';
    const name = searchParams.get('name') || '';
    const category = searchParams.get('category') || '全部';
    const tag = searchParams.get('tag') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '24', 10);

    try {
        const blocks = loadMaterialsConfig(materialsName);

        if (!blocks) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: `当前物料「${materialsName}」配置文件获取失败，请先同步物料库或检查物料库格式` 
                },
                { status: 404 }
            );
        }

        let filteredBlocks = blocks;

        // Filter by name/description/tags
        if (name) {
            filteredBlocks = filteredBlocks.filter((item: any) => {
                const tags = (item.tags || []).map((v: string) => v.toLowerCase());
                return (
                    item.name?.indexOf(name) > -1 ||
                    item.description?.indexOf(name) > -1 ||
                    tags.includes(name.toLowerCase())
                );
            });
        }

        // Filter by category/tag
        if (category !== '全部') {
            filteredBlocks = filteredBlocks.filter((item: any) => {
                const hasTag = (item.tags || []).includes(tag);
                const sameType = item.type === category;
                if (Array.isArray(item.category)) {
                    return item.category.includes(category) || hasTag || sameType;
                }
                return item.category === category || hasTag || sameType;
            });
        }

        const total = filteredBlocks.length;
        // Paginate
        const start = (page - 1) * pageSize;
        const list = filteredBlocks.slice(start, start + pageSize);

        return NextResponse.json({ success: true, data: { page, pageSize, total, list } });
    } catch (err: any) {
        console.error('Error loading blocks:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
