import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const materialsName = searchParams.get('materialsName') || '';
    const blockName = searchParams.get('blockName') || '';

    if (!materialsName || !blockName) {
        return NextResponse.json(
            { success: false, message: '缺少必要参数' },
            { status: 400 }
        );
    }

    try {
        const mainPath = path.join(process.cwd(), '.hhHub');
        const blockPath = path.join(mainPath, materialsName, blockName);

        // 尝试多种可能的截图文件名
        const possibleScreenshots = [
            'snapshot.png',
            'screenshot.png',
            'preview.png',
            'cover.png',
            'image.png',
        ];

        let screenshotPath: string | null = null;

        for (const screenshotName of possibleScreenshots) {
            const fullPath = path.join(blockPath, screenshotName);
            if (fs.existsSync(fullPath)) {
                screenshotPath = fullPath;
                break;
            }
        }

        if (!screenshotPath) {
            return NextResponse.json(
                { success: false, message: '截图不存在' },
                { status: 404 }
            );
        }

        // 读取图片文件
        const imageBuffer = fs.readFileSync(screenshotPath);

        // 根据文件扩展名确定 content type
        const ext = path.extname(screenshotPath).toLowerCase();
        const contentTypeMap: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
        };
        const contentType = contentTypeMap[ext] || 'application/octet-stream';

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // 缓存 1 天
            },
        });
    } catch (err: any) {
        console.error('获取截图失败:', err);
        return NextResponse.json(
            { success: false, message: err.message || '获取截图失败' },
            { status: 500 }
        );
    }
}
