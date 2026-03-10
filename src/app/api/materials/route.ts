import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const all = await prisma.material.findMany({ orderBy: { id: 'asc' } });
        
        // 解析 tags JSON 字符串
        const materialsWithParsedTags = all.map(m => ({
            ...m,
            tags: m.tags ? JSON.parse(m.tags) : [],
        }));
        
        const recommendMaterials = materialsWithParsedTags.filter((m) => !m.isCustom);
        const customMaterials = materialsWithParsedTags.filter((m) => m.isCustom);
        return NextResponse.json({ success: true, data: { recommendMaterials, customMaterials } });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, alias, name, gitPath, description, category, framework, uiLibrary, tags } = body;
        
        const existing = await prisma.material.findUnique({ where: { alias } });
        if (existing) {
            return NextResponse.json({ success: false, message: `${alias} 已存在，请换个名称` }, { status: 400 });
        }
        
        const gitName = gitPath ? gitPath.split('/').pop()?.replace('.git', '') : name;
        const material = await prisma.material.create({
            data: { 
                type, 
                alias, 
                name: gitName || name, 
                gitPath, 
                description, 
                category,
                framework,
                uiLibrary,
                tags,
                active: true, 
                isCustom: true 
            },
        });
        return NextResponse.json({ success: true, data: material });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
