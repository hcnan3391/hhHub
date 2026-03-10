import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function getSetting(key: string) {
    const record = await prisma.setting.findUnique({ where: { key } });
    return record ? JSON.parse(record.value) : null;
}

async function setSetting(key: string, value: any) {
    return prisma.setting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
    });
}

export async function GET() {
    try {
        const data = (await getSetting('newsConfig')) || { isOpen: false, mode: 'timing', value: '09:00' };
        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const current = (await getSetting('newsConfig')) || {};
        const updated = { ...current, ...body };
        await setSetting('newsConfig', updated);
        return NextResponse.json({ success: true, data: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
