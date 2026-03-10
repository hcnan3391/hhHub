import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const legacyDir = path.join(process.cwd(), 'legacy');

    // Migrate Materials
    const materialsPath = path.join(legacyDir, 'recommendMaterials.json');
    if (fs.existsSync(materialsPath)) {
        const materials = JSON.parse(fs.readFileSync(materialsPath, 'utf8'));
        console.log(`Found ${materials.length} materials to migrate.`);
        for (const m of materials) {
            await prisma.material.upsert({
                where: { alias: m.alias },
                update: {
                    name: m.name,
                    gitPath: m.gitPath,
                    description: m.description || '',
                    type: m.type,
                    active: m.active ?? true,
                },
                create: {
                    alias: m.alias,
                    name: m.name,
                    gitPath: m.gitPath,
                    description: m.description || '',
                    type: m.type,
                    active: m.active ?? true,
                },
            });
        }
    }

    // Migrate Resources
    const resourcesPath = path.join(legacyDir, 'recommendResources.json');
    if (fs.existsSync(resourcesPath)) {
        const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
        console.log(`Found ${resources.length} resources to migrate.`);
        for (const r of resources) {
            if (!r.path) continue;
            await prisma.resource.upsert({
                where: { url: r.path },
                update: {
                    name: r.name || r.title || '',
                },
                create: {
                    url: r.path,
                    name: r.name || r.title || '',
                },
            });
        }
    }

    console.log('Migration completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
