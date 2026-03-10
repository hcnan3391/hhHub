import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface DependencyInfo {
    name: string;
    version: string;
    required: string; // 物料要求的版本
    installed?: string; // 项目中已安装的版本
    status: 'missing' | 'matched' | 'conflict' | 'compatible';
    description?: string;
}

interface DependencyAnalysis {
    blockName: string;
    allDependencies: DependencyInfo[];
    conflicts: DependencyInfo[];
    missing: DependencyInfo[];
    installCommands: {
        npm: string;
        yarn: string;
        pnpm: string;
    };
    hasConflicts: boolean;
}

// 读取物料的 package.json
function getBlockPackageJson(materialsName: string, blockName: string) {
    const mainPath = path.join(process.cwd(), '.hhHub');
    const blockPath = path.join(mainPath, materialsName, blockName);
    const packageJsonPath = path.join(blockPath, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
        try {
            return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        } catch (error) {
            console.error('Error reading block package.json:', error);
        }
    }
    return null;
}

// 读取项目的 package.json
function getProjectPackageJson() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        } catch (error) {
            console.error('Error reading project package.json:', error);
        }
    }
    return null;
}

// 比较版本兼容性
function compareVersions(required: string, installed: string): 'matched' | 'conflict' | 'compatible' {
    // 移除版本号前缀 (^, ~, >=, etc.)
    const cleanRequired = required.replace(/^[\^~>=<]+/, '');
    const cleanInstalled = installed.replace(/^[\^~>=<]+/, '');

    if (cleanRequired === cleanInstalled) {
        return 'matched';
    }

    // 简单的主版本号检查
    const reqMajor = cleanRequired.split('.')[0];
    const instMajor = cleanInstalled.split('.')[0];

    if (reqMajor === instMajor) {
        return 'compatible';
    }

    return 'conflict';
}

// 分析依赖
function analyzeDependencies(
    blockDeps: Record<string, string>,
    projectDeps: Record<string, string>
): DependencyInfo[] {
    const result: DependencyInfo[] = [];

    for (const [name, version] of Object.entries(blockDeps)) {
        const installed = projectDeps[name];
        let status: DependencyInfo['status'] = 'missing';

        if (installed) {
            status = compareVersions(version, installed);
        }

        result.push({
            name,
            version,
            required: version,
            installed,
            status,
        });
    }

    return result;
}

// 生成安装命令
function generateInstallCommands(missing: DependencyInfo[], conflicts: DependencyInfo[]): {
    npm: string;
    yarn: string;
    pnpm: string;
} {
    const packages = [...missing, ...conflicts].map(dep => `${dep.name}@${dep.required}`);
    if (packages.length === 0) {
        return { npm: '', yarn: '', pnpm: '' };
    }
    
    const packageList = packages.join(' ');
    return {
        npm: `npm install ${packageList}`,
        yarn: `yarn add ${packageList}`,
        pnpm: `pnpm add ${packageList}`,
    };
}

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
        // 读取物料的 package.json
        const blockPkg = getBlockPackageJson(materialsName, blockName);
        if (!blockPkg) {
            return NextResponse.json(
                { success: false, message: '未找到物料的 package.json' },
                { status: 404 }
            );
        }

        // 读取项目的 package.json
        const projectPkg = getProjectPackageJson();
        if (!projectPkg) {
            return NextResponse.json(
                { success: false, message: '未找到项目的 package.json' },
                { status: 404 }
            );
        }

        // 分析各类依赖
        const dependencies = analyzeDependencies(
            blockPkg.dependencies || {},
            { ...(projectPkg.dependencies || {}), ...(projectPkg.devDependencies || {}) }
        );

        const devDependencies = analyzeDependencies(
            blockPkg.devDependencies || {},
            projectPkg.devDependencies || {}
        );

        const peerDependencies = analyzeDependencies(
            blockPkg.peerDependencies || {},
            { ...(projectPkg.dependencies || {}), ...(projectPkg.devDependencies || {}) }
        );

        // 合并所有依赖，去重
        const allDepsMap = new Map<string, DependencyInfo>();
        [...dependencies, ...devDependencies, ...peerDependencies].forEach(dep => {
            if (!allDepsMap.has(dep.name)) {
                allDepsMap.set(dep.name, dep);
            }
        });
        const allDependencies = Array.from(allDepsMap.values());

        // 找出冲突和缺失的依赖
        const conflicts = allDependencies.filter(dep => dep.status === 'conflict');
        const missing = allDependencies.filter(dep => dep.status === 'missing');

        // 生成安装命令
        const installCommands = generateInstallCommands(missing, conflicts);

        const analysis: DependencyAnalysis = {
            blockName,
            allDependencies,
            conflicts,
            missing,
            installCommands,
            hasConflicts: conflicts.length > 0,
        };

        return NextResponse.json({
            success: true,
            data: analysis,
        });
    } catch (err) {
        const error = err as Error;
        console.error('依赖分析失败:', error);
        return NextResponse.json(
            { success: false, message: error.message || '依赖分析失败' },
            { status: 500 }
        );
    }
}
