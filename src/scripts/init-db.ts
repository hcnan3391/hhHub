import { PrismaClient } from '@prisma/client';
import { recommendMaterials } from '../data/recommendMaterials';

const prisma = new PrismaClient();

async function main() {
    console.log('开始初始化数据库...');

    // 初始化推荐物料
    console.log(`\n正在初始化 ${recommendMaterials.length} 个推荐物料...`);
    for (const material of recommendMaterials) {
        const result = await prisma.material.upsert({
            where: { alias: material.alias },
            update: {
                name: material.name,
                gitPath: material.gitPath,
                description: material.description,
                type: material.type,
                active: material.active,
                isCustom: false,
            },
            create: {
                alias: material.alias,
                name: material.name,
                gitPath: material.gitPath,
                description: material.description,
                type: material.type,
                active: material.active,
                isCustom: false,
            },
        });
        console.log(`✓ ${result.alias}`);
    }

    console.log('\n✅ 数据库初始化完成！');
    console.log('\n提示：');
    console.log('1. 运行 npm run dev 启动开发服务器');
    console.log('2. 访问物料页面，点击"同步物料"按钮下载物料库');
}

main()
    .catch((e) => {
        console.error('❌ 初始化失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
