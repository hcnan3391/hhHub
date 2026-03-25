import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 创建测试文件
const testDir = path.join(__dirname, '../test-files');

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 创建测试用的代码文件
fs.writeFileSync(path.join(testDir, 'helper.ts'), `
export const helper = () => {
  return "Helper function";
};
`);

fs.writeFileSync(path.join(testDir, 'utils.ts'), `
export const utils = () => {
  return "Utils function";
};
`);

fs.writeFileSync(path.join(testDir, 'types.ts'), `
export interface Props {
  name: string;
}
`);

test.describe('区块编辑器文件上传测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问物料库页面
    await page.goto('http://localhost:3000/materials');
    await page.waitForSelector('.ant-table-row', { timeout: 10000 });

    // 点击第一个物料源的「新建区块」按钮
    const createBtn = page.locator('.ant-btn:has-text("新建区块")').first();
    await createBtn.click();

    // 等待弹窗打开
    await page.waitForSelector('.ant-modal-content', { timeout: 5000 });
  });

  test('测试单文件上传', async ({ page }) => {
    // 找到导入文件按钮
    const uploadInput = page.locator('input[type="file"][accept*=".tsx"]').first();

    // 上传单个文件
    await uploadInput.setInputFiles(path.join(testDir, 'helper.ts'));

    // 等待文件出现在列表中
    await page.waitForTimeout(500);

    // 验证文件已导入
    const fileItem = page.locator('text=src/helper.ts');
    await expect(fileItem).toBeVisible();

    console.log('✅ 单文件上传测试通过');
  });

  test('测试多文件同时上传 - 验证竞态条件', async ({ page }) => {
    // 找到导入文件按钮
    const uploadInput = page.locator('input[type="file"][accept*=".tsx"]').first();

    // 同时上传3个文件
    await uploadInput.setInputFiles([
      path.join(testDir, 'helper.ts'),
      path.join(testDir, 'utils.ts'),
      path.join(testDir, 'types.ts'),
    ]);

    // 等待文件读取完成
    await page.waitForTimeout(1000);

    // 统计成功导入的文件数量
    const fileItems = await page.locator('text=/src/(helper|utils|types)\\.ts/').count();

    console.log(`📊 成功导入的文件数: ${fileItems}/3`);

    if (fileItems === 3) {
      console.log('✅ 多文件上传测试通过 - 所有文件都成功导入');
    } else {
      console.log('❌ 发现竞态条件问题！预期导入3个文件，实际只导入', fileItems, '个');
      console.log('   问题原因：多个文件同时触发 beforeUpload，setFiles 相互覆盖');
    }

    // 截图保存测试结果
    await page.screenshot({
      path: path.join(__dirname, '../test-results/upload-test.png'),
      fullPage: false,
    });
  });

  test('测试覆盖已有文件', async ({ page }) => {
    const uploadInput = page.locator('input[type="file"][accept*=".tsx"]').first();

    // 第一次上传
    await uploadInput.setInputFiles(path.join(testDir, 'helper.ts'));
    await page.waitForTimeout(500);

    // 修改文件内容后再次上传
    const modifiedContent = `
export const helper = () => {
  return "Modified Helper";
};
`;
    const modifiedPath = path.join(testDir, 'helper-modified.ts');
    fs.writeFileSync(modifiedPath, modifiedContent);

    // 重命名为相同文件名后上传
    const renamedPath = path.join(testDir, 'helper.ts');
    fs.writeFileSync(renamedPath, modifiedContent);

    await uploadInput.setInputFiles(renamedPath);
    await page.waitForTimeout(500);

    // 验证提示信息
    const successMsg = page.locator('.ant-message-success');
    await expect(successMsg).toContainText('已更新');

    console.log('✅ 文件覆盖测试通过');

    // 清理
    fs.unlinkSync(modifiedPath);
  });
});
