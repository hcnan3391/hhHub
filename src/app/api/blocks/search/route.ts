import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import prisma from '@/lib/prisma';

interface Block {
    name: string;
    key: string;
    description: string;
    screenshot: string;
    previewUrl: string;
    sourceCode: string;
    tags: string[];
    dependencies: string[];
    category: string;
    type: string;
    materialName: string;
    materialAlias: string;
}

// 物料配置文件适配器
function loadBlocksFromMaterial(materialPath: string): Omit<Block, 'materialName' | 'materialAlias'>[] | null {
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
function normalizeBlocks(blocks: any[]): Omit<Block, 'materialName' | 'materialAlias'>[] {
    return blocks.filter(Boolean).map((block: any) => ({
        name: block.name || block.key || block.title,
        key: block.key || block.value || block.name,
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
    try {
        const { searchParams } = new URL(req.url);
        const keyword = searchParams.get('keyword') || '';
        const materialName = searchParams.get('materialName') || '';
        const type = searchParams.get('type') || '';
        const category = searchParams.get('category') || '';
        const tag = searchParams.get('tag') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '24', 10);

        const mainPath = path.join(process.cwd(), '.hhHub');

        // 获取要搜索的物料列表
        let materialsToSearch: { name: string; alias: string }[] = [];

        if (materialName) {
            // 指定了特定物料
            const material = await prisma.material.findUnique({
                where: { name: materialName },
                select: { name: true, alias: true },
            });
            if (material) {
                materialsToSearch = [material];
            }
        } else {
            // 搜索所有启用的物料
            materialsToSearch = await prisma.material.findMany({
                where: { active: true },
                select: { name: true, alias: true },
            });
        }

        // 收集所有区块
        let allBlocks: Block[] = [];

        for (const material of materialsToSearch) {
            const materialPath = path.join(mainPath, material.name);
            if (!fs.existsSync(materialPath)) continue;

            const blocks = loadBlocksFromMaterial(materialPath);
            if (blocks) {
                allBlocks.push(...blocks.map(b => ({
                    ...b,
                    materialName: material.name,
                    materialAlias: material.alias,
                })));
            }
        }

        // 过滤区块
        let filteredBlocks = allBlocks;

        // 按关键词搜索（名称、描述、标签）
        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            filteredBlocks = filteredBlocks.filter((block: Block) => {
                const tags = (block.tags || []).map((v: string) => v.toLowerCase());
                return (
                    block.name?.toLowerCase().includes(lowerKeyword) ||
                    block.description?.toLowerCase().includes(lowerKeyword) ||
                    tags.some((t: string) => t.includes(lowerKeyword))
                );
            });
        }

        // 按类型过滤
        if (type) {
            filteredBlocks = filteredBlocks.filter((block: Block) => block.type === type);
        }

        // 按分类过滤
        if (category && category !== '全部') {
            filteredBlocks = filteredBlocks.filter((block: Block) => {
                if (Array.isArray(block.category)) {
                    return block.category.includes(category);
                }
                return block.category === category;
            });
        }

        // 按标签过滤
        if (tag) {
            filteredBlocks = filteredBlocks.filter((block: Block) =>
                (block.tags || []).includes(tag)
            );
        }

        const total = filteredBlocks.length;

        // 分页
        const start = (page - 1) * pageSize;
        const list = filteredBlocks.slice(start, start + pageSize);

        return NextResponse.json({
            success: true,
            data: {
                list,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (err: any) {
        console.error('搜索区块失败:', err);
        return NextResponse.json(
            { success: false, message: err.message || '搜索失败' },
            { status: 500 }
        );
    }
}
