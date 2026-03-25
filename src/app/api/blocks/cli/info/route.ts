import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

interface BlockDetailInfo {
  name: string;
  key: string;
  description?: string;
  category?: string;
  tags?: string[];
  screenshot?: string;
  previewUrl?: string;
  sourceCode?: string;
  path: string;
  fileStructure: FileNode[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

const EXCLUDED_DIRS = ['node_modules', '.git', '__tests__', '__mocks__', '.cache', 'dist', 'build', 'lib', 'es'];

async function scanDirectoryStructure(dirPath: string, basePath: string): Promise<FileNode[]> {
  const nodes: FileNode[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.includes(entry.name) || entry.name.startsWith('.')) {
          continue;
        }
        const children = await scanDirectoryStructure(fullPath, basePath);
        nodes.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          type: 'file',
          path: relativePath,
        });
      }
    }
  } catch {
    // 忽略错误
  }

  return nodes.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
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

function findBlockInConfig(config: any[], blockName: string): any | null {
  return config.find(
    (b: any) => b.key === blockName || b.name === blockName || b.value === blockName
  );
}

function readBlockPackageJson(blockPath: string): any | null {
  const packagePath = path.join(blockPath, 'package.json');
  if (existsSync(packagePath)) {
    try {
      return JSON.parse(readFileSync(packagePath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
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

    const config = loadMaterialsConfig(materialsPath);
    const configBlock = findBlockInConfig(config, blockName);
    const pkg = readBlockPackageJson(blockPath);
    const fileStructure = await scanDirectoryStructure(blockPath, blockPath);

    const blockInfo: BlockDetailInfo = {
      name: configBlock?.name || blockName,
      key: configBlock?.key || blockName,
      description: configBlock?.description || pkg?.description,
      category: configBlock?.category,
      tags: configBlock?.tags || [],
      screenshot: configBlock?.screenshot || configBlock?.img,
      previewUrl: configBlock?.previewUrl,
      sourceCode: configBlock?.url || configBlock?.sourceCode,
      path: blockPath,
      fileStructure,
      dependencies: pkg?.dependencies,
      devDependencies: pkg?.devDependencies,
    };

    return NextResponse.json({
      success: true,
      data: blockInfo,
    });
  } catch (error) {
    console.error('获取区块详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '获取区块详情失败',
      },
      { status: 500 }
    );
  }
}