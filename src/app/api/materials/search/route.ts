import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const keyword = searchParams.get('keyword') || '';
        const type = searchParams.get('type') || '';
        const category = searchParams.get('category') || '';
        const framework = searchParams.get('framework') || '';
        const activeOnly = searchParams.get('activeOnly') === 'true';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

        // 构建查询条件
        const where: any = {};

        if (activeOnly) {
            where.active = true;
        }

        if (keyword) {
            where.OR = [
                { name: { contains: keyword } },
                { alias: { contains: keyword } },
                { description: { contains: keyword } },
                { tags: { contains: keyword } },
            ];
        }

        if (type) {
            where.type = type;
        }

        if (category) {
            where.category = category;
        }

        if (framework) {
            where.framework = { contains: framework };
        }

        // 查询总数
        const total = await prisma.material.count({ where });

        // 查询数据
        const materials = await prisma.material.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [
                { usageCount: 'desc' }, // 按使用次数排序
                { updatedAt: 'desc' },
            ],
        });

        // 解析 tags JSON 字符串
        const materialsWithParsedTags = materials.map(m => ({
            ...m,
            tags: m.tags ? JSON.parse(m.tags) : [],
        }));

        return NextResponse.json({
            success: true,
            data: {
                list: materialsWithParsedTags,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (err: any) {
        console.error('搜索物料失败:', err);
        return NextResponse.json(
            { success: false, message: err.message || '搜索失败' },
            { status: 500 }
        );
    }
}
