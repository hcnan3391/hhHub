import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        const body = await req.json();
        // Support both `update` object and flat fields
        const data = body.update || body;
        const material = await prisma.material.update({ where: { id }, data });
        return NextResponse.json({ success: true, data: material });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        
        // 检查物料是否存在
        const material = await prisma.material.findUnique({ where: { id } });
        if (!material) {
            return NextResponse.json({ success: false, message: '物料不存在' }, { status: 404 });
        }
        
        // 删除物料
        await prisma.material.delete({ where: { id } });
        return NextResponse.json({ success: true, message: '删除成功' });
    } catch (err: any) {
        console.error('删除物料失败:', err);
        return NextResponse.json({ success: false, message: err.message || '删除失败' }, { status: 500 });
    }
}
