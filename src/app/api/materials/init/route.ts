import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recommendMaterials } from '@/data/recommendMaterials';

export async function POST() {
    try {
        // 初始化推荐物料到数据库
        for (const material of recommendMaterials) {
            await prisma.material.upsert({
                where: { alias: material.alias },
                update: {
                    name: material.name,
                    gitPath: material.gitPath,
                    description: material.description,
                    type: material.type,
                    category: material.category,
                    framework: material.framework,
                    uiLibrary: material.uiLibrary,
                    tags: material.tags,
                    active: material.active,
                    isCustom: false,
                },
                create: {
                    alias: material.alias,
                    name: material.name,
                    gitPath: material.gitPath,
                    description: material.description,
                    type: material.type,
                    category: material.category,
                    framework: material.framework,
                    uiLibrary: material.uiLibrary,
                    tags: material.tags,
                    active: material.active,
                    isCustom: false,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: `成功初始化 ${recommendMaterials.length} 个推荐物料`,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message },
            { status: 500 }
        );
    }
}
