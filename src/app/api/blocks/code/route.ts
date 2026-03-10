import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const materialsName = searchParams.get('materialsName');
        const blockName = searchParams.get('blockName');

        console.log('获取代码请求:', { materialsName, blockName });

        if (!materialsName || !blockName) {
            return NextResponse.json({
                success: false,
                message: '缺少必要参数',
            });
        }

        // 从 .hhHub 目录读取物料代码
        const materialPath = path.join(process.cwd(), '.hhHub', materialsName);
        
        // blockName 可能是中文名称或 key，需要尝试多种可能
        // 尝试多个可能的文件路径
        const possiblePaths = [
            // 使用 blockName 作为目录名
            path.join(materialPath, blockName, 'src', 'index.tsx'),
            path.join(materialPath, blockName, 'src', 'index.jsx'),
            path.join(materialPath, blockName, 'src', 'index.ts'),
            path.join(materialPath, blockName, 'src', 'index.js'),
            path.join(materialPath, 'src', blockName, 'index.tsx'),
            path.join(materialPath, 'src', blockName, 'index.jsx'),
            path.join(materialPath, 'src', blockName, 'index.ts'),
            path.join(materialPath, 'src', blockName, 'index.js'),
            path.join(materialPath, 'blocks', blockName, 'index.tsx'),
            path.join(materialPath, 'blocks', blockName, 'index.jsx'),
        ];

        let code = '';
        let foundPath = '';

        for (const filePath of possiblePaths) {
            try {
                code = await fs.readFile(filePath, 'utf-8');
                foundPath = filePath;
                console.log('找到代码文件:', foundPath);
                break;
            } catch {
                continue;
            }
        }

        if (!code) {
            console.error('未找到代码文件，尝试的路径:', possiblePaths);
            return NextResponse.json({
                success: false,
                message: '未找到组件代码文件',
                debug: {
                    materialsName,
                    blockName,
                    hint: 'blockName 应该是区块的 key 值（如 form-register），而不是中文名称'
                }
            });
        }

        // 简单处理代码，移除 import 语句，转换为可在浏览器运行的格式
        const processedCode = processCodeForBrowser(code);

        return NextResponse.json({
            success: true,
            data: {
                code: processedCode,
                originalCode: code, // 返回原始代码
                originalPath: foundPath,
            },
        });
    } catch (error) {
        console.error('获取区块代码失败:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : '获取代码失败',
        });
    }
}

function processCodeForBrowser(code: string): string {
    // 移除所有 import 语句
    let processed = code.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
    
    // 移除 export default 和 export
    processed = processed.replace(/export\s+default\s+/g, '');
    processed = processed.replace(/export\s+/g, '');
    
    // 移除样式导入（.less, .css, .scss）
    processed = processed.replace(/import\s+.*?['"].*?\.(less|css|scss|sass)['"];?\s*/g, '');
    
    // 移除 styles.xxx 的引用，替换为空对象
    processed = processed.replace(/className=\{styles\.\w+\}/g, 'className=""');
    processed = processed.replace(/styles\.\w+/g, '""');
    
    // 确保代码可以在浏览器中运行
    // 如果代码中有箭头函数组件，确保它被赋值
    if (!processed.includes('const Component =') && !processed.includes('function Component')) {
        // 尝试找到最后一个箭头函数或函数声明
        const arrowFunctionMatch = processed.match(/(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
        const functionMatch = processed.match(/function\s+(\w+)\s*\(/);
        
        if (arrowFunctionMatch && arrowFunctionMatch[1]) {
            processed += `\nconst Component = ${arrowFunctionMatch[1]};`;
        } else if (functionMatch && functionMatch[1]) {
            processed += `\nconst Component = ${functionMatch[1]};`;
        } else {
            // 如果找不到组件定义，尝试将整个代码包装为组件
            processed = `const Component = () => { ${processed} };`;
        }
    }
    
    return processed;
}
