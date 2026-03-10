import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 获取所有物料
        const materials = await prisma.material.findMany();

        // 统计各种分类
        const stats = {
            total: materials.length,
            active: materials.filter(m => m.active).length,
            custom: materials.filter(m => m.isCustom).length,
            byType: {} as Record<string, number>,
            byCategory: {} as Record<string, number>,
            byFramework: {} as Record<string, number>,
            topUsed: [] as any[],
        };

        // 按类型统计
        materials.forEach(m => {
            if (m.type) {
                stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
            }
            if (m.category) {
                stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
            }
            if (m.framework) {
                stats.byFramework[m.framework] = (stats.byFramework[m.framework] || 0) + 1;
            }
        });

        // 获取使用最多的物料
        stats.topUsed = await prisma.material.findMany({
            where: { active: true },
            orderBy: { usageCount: 'desc' },
            take: 10,
            select: {
                id: true,
                alias: true,
                name: true,
                usageCount: true,
                category: true,
                type: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (err: any) {
        console.error('获取统计信息失败:', err);
        return NextResponse.json(
            { success: false, message: err.message || '获取统计信息失败' },
            { status: 500 }
        );
    }
}
