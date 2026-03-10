import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('开始更新物料元数据...');

    // 更新 Ant Design Blocks
    await prisma.material.updateMany({
        where: { name: 'ant-design-blocks' },
        data: {
            category: 'component',
            framework: 'React 18',
            uiLibrary: 'Ant Design',
            tags: JSON.stringify(['组件', '区块', 'React', 'Ant Design', '官方']),
        },
    });

    // 更新 Ant Design Pro Blocks
    await prisma.material.updateMany({
        where: { name: 'pro-blocks' },
        data: {
            category: 'layout',
            framework: 'React 18',
            uiLibrary: 'Ant Design Pro',
            tags: JSON.stringify(['页面', '布局', 'React', 'Ant Design Pro', '企业级']),
        },
    });

    console.log('物料元数据更新完成！');
}

main()
    .catch((e) => {
        console.error('更新失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
