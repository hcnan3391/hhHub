/**
 * 文件上传自动化测试脚本
 * 使用系统已安装的 Chrome，无需下载 Playwright
 *
 * 运行方式: npx ts-node scripts/test-upload.ts
 */

import puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.join(__dirname, '../test-upload-files');
const SCREENSHOT_DIR = path.join(__dirname, '../test-results');

// 创建测试目录
[TEST_DIR, SCREENSHOT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 创建测试文件
function createTestFiles() {
  const files = [
    { name: 'helper.ts', content: `export const helper = () => "Helper function";` },
    { name: 'utils.ts', content: `export const utils = () => "Utils function";` },
    { name: 'types.ts', content: `export interface Props { name: string; }` },
    { name: 'Component.tsx', content: `import React from 'react';\nexport default () => <div>Test</div>;` },
    { name: 'styles.css', content: `.test { color: red; }` },
    { name: 'config.json', content: `{"name": "test"}` },
  ];

  files.forEach(({ name, content }) => {
    fs.writeFileSync(path.join(TEST_DIR, name), content);
  });

  console.log(`✅ 创建了 ${files.length} 个测试文件在 ${TEST_DIR}`);
  return files.map(f => path.join(TEST_DIR, f.name));
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 启动文件上传测试...\n');

  // 创建测试文件
  const testFiles = createTestFiles();

  // 查找 Chrome 路径
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ];

  const chromePath = chromePaths.find(p => fs.existsSync(p));
  if (!chromePath) {
    console.error('❌ 未找到 Chrome 浏览器，请安装 Chrome');
    process.exit(1);
  }

  console.log(`🌐 使用 Chrome: ${chromePath}\n`);

  // 启动浏览器
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false, // 设为 true 可以无界面运行
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // 1. 访问物料库页面
    console.log('📍 步骤 1: 访问物料库页面');
    await page.goto('http://localhost:3000/materials', { waitUntil: 'networkidle2' });
    await delay(2000);

    // 2. 点击新建区块按钮
    console.log('📍 步骤 2: 点击「新建区块」');
    await page.click('.ant-btn:has-text("新建区块")');
    await delay(1000);

    // 3. 测试单文件上传
    console.log('\n📍 步骤 3: 测试单文件上传');

    // 等待文件选择器并点击上传按钮
    const [fileChooser] = await Promise.all([
      new Promise((resolve) => {
        page.once('filechooser', resolve);
      }),
      page.click('.ant-btn:has-text("导入文件")'),
    ]);

    await (fileChooser as any).accept([testFiles[0]]);
    await delay(500);

    // 检查是否成功
    const pageContent = await page.content();
    const hasFile = pageContent.includes('src/helper.ts');
    console.log(hasFile ? '✅ 单文件上传成功' : '❌ 单文件上传失败');

    // 4. 测试多文件同时上传（验证竞态条件）
    console.log('\n📍 步骤 4: 测试多文件同时上传');

    const [fileChooser2] = await Promise.all([
      new Promise((resolve) => {
        page.once('filechooser', resolve);
      }),
      page.click('.ant-btn:has-text("导入文件")'),
    ]);

    // 同时选择3个文件
    await (fileChooser2 as any).accept(testFiles.slice(1, 4)); // utils.ts, types.ts, Component.tsx
    await delay(1000);

    // 统计成功导入的文件数
    const updatedContent = await page.content();
    const importedFiles = ['utils.ts', 'types.ts', 'Component.tsx'].filter(name =>
      updatedContent.includes(`src/${name}`)
    );

    console.log(`📊 成功导入: ${importedFiles.length}/3 个文件`);
    console.log(`   文件: ${importedFiles.join(', ') || '无'}`);

    if (importedFiles.length === 3) {
      console.log('✅ 多文件上传正常');
    } else {
      console.log('❌ 发现竞态条件问题！');
      console.log('   原因: beforeUpload 每次只处理一个文件，多个文件同时上传时会相互覆盖');
    }

    // 5. 截图保存
    console.log('\n📍 步骤 5: 保存测试截图');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'upload-test-result.png'),
      fullPage: false,
    });
    console.log(`✅ 截图已保存: ${SCREENSHOT_DIR}/upload-test-result.png`);

    // 6. 测试结论
    console.log('\n' + '='.repeat(50));
    console.log('📋 测试结论:');
    console.log('='.repeat(50));

    if (importedFiles.length < 3) {
      console.log('🔴 存在问题: 多文件上传存在竞态条件');
      console.log('   建议: 使用 onChange 替代 beforeUpload，批量处理文件');
    } else {
      console.log('🟢 当前实现正常（可能因文件大小/时机不同而有差异）');
    }

    // 保持浏览器打开 3 秒以便查看结果
    await delay(3000);

  } catch (error) {
    console.error('❌ 测试出错:', error);
  } finally {
    await browser.close();

    // 清理测试文件
    console.log('\n🧹 清理测试文件...');
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

runTest().catch(console.error);
