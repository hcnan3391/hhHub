import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 需要排除的目录
const EXCLUDED_DIRS = ['.git', '__tests__', 'assets', 'node_modules', '.umi', '.umi-production', 'dist', 'build'];

// 区块信息接口
interface BlockInfo {
    key: string;
    name: string;
    description: string;
    tags: string[];
    category: string;
    screenshot: string;
    previewUrl: string;
}

/**
 * 检查区块是否有截图
 */
function hasScreenshot(blockPath: string): boolean {
    const screenshotNames = ['snapshot.png', 'screenshot.png', 'preview.png', 'cover.png', 'image.png'];
    return screenshotNames.some(name => fs.existsSync(path.join(blockPath, name)));
}

/**
 * 扫描物料库目录，生成 materials.json
 */
function scanMaterialsJson(repoPath: string, materialsName: string): { blocks: BlockInfo[]; count: number } {
    const blocks: BlockInfo[] = [];

    if (!fs.existsSync(repoPath)) {
        return { blocks, count: 0 };
    }

    const items = fs.readdirSync(repoPath);

    for (const item of items) {
        const itemPath = path.join(repoPath, item);

        // 跳过非目录项和排除目录
        if (!fs.statSync(itemPath).isDirectory() || EXCLUDED_DIRS.includes(item)) {
            continue;
        }

        const packageJsonPath = path.join(itemPath, 'package.json');

        // 检查是否存在 package.json
        if (!fs.existsSync(packageJsonPath)) {
            continue;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

            // 检查是否有截图
            const hasImage = hasScreenshot(itemPath);

            // 提取区块信息
            const blockInfo: BlockInfo = {
                key: item,
                name: item,
                description: packageJson.description || '',
                tags: extractTags(item, packageJson),
                category: inferCategory(item),
                screenshot: hasImage ? `/api/blocks/screenshot?materialsName=${encodeURIComponent(materialsName)}&blockName=${encodeURIComponent(item)}` : '',
                previewUrl: '',
            };

            blocks.push(blockInfo);
        } catch (error) {
            console.error(`解析 ${item}/package.json 失败:`, error);
        }
    }

    return { blocks, count: blocks.length };
}

/**
 * 从区块名称和 package.json 提取标签
 */
function extractTags(blockName: string, packageJson: any): string[] {
    const tags: string[] = [];

    // 从名称中提取组件类型（如 button, input 等）
    const nameParts = blockName.split('-');
    if (nameParts.length > 0) {
        tags.push(nameParts[0]);
    }

    // 从 dependencies 中提取 UI 库信息
    const deps = packageJson.dependencies || {};
    if (deps.antd) {
        tags.push('Ant Design');
    }
    if (deps['@ant-design/icons']) {
        tags.push('图标');
    }
    if (deps['@ant-design/pro-components'] || deps['@ant-design/pro-layout']) {
        tags.push('Pro Components');
    }

    return tags;
}

/**
 * 根据区块名称推断分类
 */
function inferCategory(blockName: string): string {
    const nameParts = blockName.split('-');
    const componentType = nameParts[0];

    // 表单相关组件
    const formComponents = ['input', 'select', 'checkbox', 'radio', 'switch', 'slider', 'date-picker', 'time-picker', 'calendar', 'form', 'cascader', 'tree-select', 'auto-complete', 'mention', 'rate', 'transfer', 'upload'];
    if (formComponents.includes(componentType)) {
        return 'form';
    }

    // 数据展示组件
    const dataDisplayComponents = ['table', 'list', 'card', 'collapse', 'tree', 'avatar', 'badge', 'calendar', 'carousel', 'descriptions', 'empty', 'image', 'popover', 'qrcode', 'segmented', 'statistic', 'tabs', 'tag', 'timeline', 'tooltip', 'tour'];
    if (dataDisplayComponents.includes(componentType)) {
        return 'data-display';
    }

    // 导航组件
    const navigationComponents = ['affix', 'anchor', 'back-top', 'breadcrumb', 'dropdown', 'menu', 'pagination', 'page-header', 'steps'];
    if (navigationComponents.includes(componentType)) {
        return 'navigation';
    }

    // 反馈组件
    const feedbackComponents = ['alert', 'drawer', 'message', 'modal', 'notification', 'popconfirm', 'progress', 'result', 'skeleton', 'spin', 'watermark'];
    if (feedbackComponents.includes(componentType)) {
        return 'feedback';
    }

    return 'component';
}

/**
 * 写入 materials.json 文件
 */
function writeMaterialsJson(repoPath: string, blocks: BlockInfo[]): void {
    const materialsJsonPath = path.join(repoPath, 'materials.json');

    const materialsJson = {
        list: {
            blocks
        }
    };

    fs.writeFileSync(materialsJsonPath, JSON.stringify(materialsJson, null, 2), 'utf-8');
}

export async function GET() {
    try {
        const materials = await prisma.material.findMany({ where: { active: true } });
        
        if (materials.length === 0) {
            return NextResponse.json({
                success: false,
                message: '没有激活的物料库，请先在设置中激活物料库或初始化推荐物料',
            });
        }

        const mainPath = path.join(process.cwd(), '.hhHub');

        if (!fs.existsSync(mainPath)) {
            fs.mkdirSync(mainPath, { recursive: true });
        }

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const m of materials) {
            if (!m.gitPath) {
                results.push({ 
                    name: m.name, 
                    alias: m.alias,
                    status: 'skipped', 
                    message: '未配置 Git 路径' 
                });
                continue;
            }

            const repoPath = path.join(mainPath, m.name);
            
            try {
                let syncSuccess = false;

                if (fs.existsSync(repoPath)) {
                    // 检查是否是 git 仓库
                    const gitDir = path.join(repoPath, '.git');
                    if (fs.existsSync(gitDir)) {
                        console.log(`Updating ${m.name}...`);
                        const { stdout, stderr } = await execAsync('git pull', {
                            cwd: repoPath,
                            timeout: 60000 // 60秒超时
                        });
                        syncSuccess = true;
                        console.log(`Updated ${m.name}: ${stdout}`);
                    } else {
                        // 目录存在但不是 git 仓库，删除后重新克隆
                        console.log(`Removing invalid directory and cloning ${m.name}...`);
                        fs.rmSync(repoPath, { recursive: true, force: true });
                        await execAsync(`git clone --depth 1 ${m.gitPath} ${repoPath}`, {
                            timeout: 120000 // 120秒超时
                        });
                        syncSuccess = true;
                    }
                } else {
                    console.log(`Cloning ${m.name}...`);
                    // 使用 --depth 1 加快克隆速度
                    await execAsync(`git clone --depth 1 ${m.gitPath} ${repoPath}`, {
                        timeout: 120000 // 120秒超时
                    });
                    syncSuccess = true;
                }

                // Git 操作成功后，扫描并生成 materials.json
                if (syncSuccess) {
                    console.log(`Scanning blocks for ${m.name}...`);
                    const { blocks, count } = scanMaterialsJson(repoPath, m.name);

                    if (count > 0) {
                        writeMaterialsJson(repoPath, blocks);
                        results.push({
                            name: m.name,
                            alias: m.alias,
                            status: fs.existsSync(path.join(repoPath, '.git')) ? 'updated' : 'cloned',
                            message: `成功，扫描到 ${count} 个区块`
                        });
                    } else {
                        results.push({
                            name: m.name,
                            alias: m.alias,
                            status: fs.existsSync(path.join(repoPath, '.git')) ? 'updated' : 'cloned',
                            message: '同步成功，但未扫描到区块'
                        });
                    }
                    successCount++;
                }
            } catch (e: any) {
                console.error(`Error syncing ${m.name}:`, e.message);
                results.push({
                    name: m.name,
                    alias: m.alias,
                    status: 'error',
                    message: e.message || '同步失败'
                });
                errorCount++;
            }
        }

        return NextResponse.json({ 
            success: errorCount === 0, 
            data: results,
            summary: {
                total: materials.length,
                success: successCount,
                error: errorCount,
            },
            message: errorCount === 0 
                ? `成功同步 ${successCount} 个物料库` 
                : `同步完成，成功 ${successCount} 个，失败 ${errorCount} 个`
        });
    } catch (err: any) {
        console.error('Sync error:', err);
        return NextResponse.json({ 
            success: false, 
            message: err.message || '同步失败'
        }, { status: 500 });
    }
}
