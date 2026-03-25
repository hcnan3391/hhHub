import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// 需要排除的公共文件模式
const EXCLUDED_PATTERNS = [
  /package\.json$/i,
  /\.d\.ts$/i,
  /tsconfig\.json$/i,
  /\.eslintrc/i,
  /\.prettierrc/i,
  /\.gitignore$/i,
  /README/i,
  /CHANGELOG/i,
  /LICENSE$/i,
  /\.test\.(tsx?|jsx?)$/i,
  /\.spec\.(tsx?|jsx?)$/i,
  /__tests__/i,
  /__mocks__/i,
  /node_modules/i,
  /\.git/i,
  /snapshot\.(png|jpg|jpeg|gif|svg)$/i,
  /screenshot\.(png|jpg|jpeg|gif|svg)$/i,
];

// 需要包含的源代码文件模式
const INCLUDED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.less', '.css', '.scss', '.sass'];

interface SourceFile {
  filePath: string;
  relativePath: string;
  content: string;
  extension: string;
}

interface BlockSourceResponse {
  materialsName: string;
  blockName: string;
  files: SourceFile[];
  totalFiles: number;
}

function shouldExclude(filePath: string): boolean {
  if (EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath))) {
    return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  return !INCLUDED_EXTENSIONS.includes(ext);
}

async function scanSourceFiles(dirPath: string, basePath: string): Promise<SourceFile[]> {
  const files: SourceFile[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        const subFiles = await scanSourceFiles(fullPath, basePath);
        files.push(...subFiles);
      } else if (entry.isFile() && !shouldExclude(fullPath)) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({
            filePath: fullPath,
            relativePath,
            content,
            extension: path.extname(fullPath).toLowerCase(),
          });
        } catch (error) {
          console.warn(`无法读取文件: ${fullPath}`, error);
        }
      }
    }
  } catch (error) {
    console.error(`扫描目录失败: ${dirPath}`, error);
  }

  return files;
}

function getPossibleBlockPaths(materialsPath: string, blockName: string): string[] {
  return [
    path.join(materialsPath, blockName),
    path.join(materialsPath, 'src', blockName),
    path.join(materialsPath, 'blocks', blockName),
    path.join(materialsPath, 'components', blockName),
    path.join(materialsPath, 'pages', blockName),
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialsName = searchParams.get('materialsName');
    const blockName = searchParams.get('blockName');

    if (!materialsName || !blockName) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数: materialsName 和 blockName' },
        { status: 400 }
      );
    }

    const hubPath = path.join(process.cwd(), '.hhHub');
    const materialsPath = path.join(hubPath, materialsName);

    if (!existsSync(materialsPath)) {
      return NextResponse.json(
        { success: false, message: `物料库「${materialsName}」不存在` },
        { status: 404 }
      );
    }

    const possiblePaths = getPossibleBlockPaths(materialsPath, blockName);
    let blockPath: string | null = null;

    for (const p of possiblePaths) {
      if (existsSync(p)) {
        blockPath = p;
        break;
      }
    }

    if (!blockPath) {
      return NextResponse.json(
        {
          success: false,
          message: `区块「${blockName}」不存在`,
          debug: { searchedPaths: possiblePaths },
        },
        { status: 404 }
      );
    }

    const sourceFiles = await scanSourceFiles(blockPath, blockPath);

    if (sourceFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: '该区块没有可用的源代码文件（可能都是公共配置文件）' },
        { status: 404 }
      );
    }

    const response: BlockSourceResponse = {
      materialsName,
      blockName,
      files: sourceFiles,
      totalFiles: sourceFiles.length,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('获取区块源代码失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '获取源代码失败',
      },
      { status: 500 }
    );
  }
}