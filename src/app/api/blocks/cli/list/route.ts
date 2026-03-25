import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

interface BlockInfo {
  name: string;
  key: string;
  description?: string;
  category?: string;
  tags?: string[];
  hasSourceFiles: boolean;
  sourceFileCount: number;
  path: string;
}

interface MaterialsListResponse {
  materialsName: string;
  totalBlocks: number;
  blocks: BlockInfo[];
}

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

const INCLUDED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.less', '.css', '.scss', '.sass'];

function shouldExclude(filePath: string): boolean {
  if (EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath))) {
    return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  return !INCLUDED_EXTENSIONS.includes(ext);
}

async function countSourceFiles(dirPath: string): Promise<number> {
  let count = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        count += await countSourceFiles(fullPath);
      } else if (!shouldExclude(fullPath)) {
        count++;
      }
    }
  } catch {
    // 忽略错误
  }
  return count;
}

function loadMaterialsConfig(materialsPath: string): any[] {
  const configFiles = [
    { file: 'materials.json', parser: (data: any) => data.list?.blocks || [] },
    { file: 'umi-block.json', parser: (data: any) => data.blocks || [] },
    { file: 'rh-block.json', parser: (data: any) => data.list || [] },
    { file: 'package.json', parser: (data: any) => data.blocks || [] },
  ];

  for (const { file, parser } of configFiles) {
    const filePath = path.join(materialsPath, file);
    if (existsSync(filePath)) {
      try {
        const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
        const blocks = parser(raw);
        if (blocks && blocks.length > 0) {
          return blocks;
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  return [];
}

async function scanBlocks(materialsPath: string): Promise<BlockInfo[]> {
  const blocks: BlockInfo[] = [];
  const configBlocks = loadMaterialsConfig(materialsPath);

  for (const block of configBlocks) {
    const key = block.key || block.name;
    const blockPath = path.join(materialsPath, key);

    if (existsSync(blockPath)) {
      const sourceFileCount = await countSourceFiles(blockPath);
      blocks.push({
        name: block.name || key,
        key,
        description: block.description,
        category: block.category,
        tags: block.tags,
        hasSourceFiles: sourceFileCount > 0,
        sourceFileCount,
        path: blockPath,
      });
    }
  }

  if (blocks.length === 0) {
    try {
      const entries = await fs.readdir(materialsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const blockPath = path.join(materialsPath, entry.name);
          const sourceFileCount = await countSourceFiles(blockPath);
          blocks.push({
            name: entry.name,
            key: entry.name,
            hasSourceFiles: sourceFileCount > 0,
            sourceFileCount,
            path: blockPath,
          });
        }
      }
    } catch {
      // 忽略错误
    }
  }

  return blocks;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialsName = searchParams.get('materialsName');

    if (!materialsName) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数: materialsName' },
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

    const blocks = await scanBlocks(materialsPath);

    return NextResponse.json({
      success: true,
      data: {
        materialsName,
        totalBlocks: blocks.length,
        blocks,
      },
    });
  } catch (error) {
    console.error('获取区块列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '获取区块列表失败',
      },
      { status: 500 }
    );
  }
}