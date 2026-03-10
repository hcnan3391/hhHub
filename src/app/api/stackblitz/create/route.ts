import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { code, name } = await request.json();

        if (!code) {
            return NextResponse.json({
                success: false,
                message: '缺少代码内容',
            });
        }

        // StackBlitz 项目配置
        const project = {
            title: name || 'Ant Design Component',
            description: `${name || 'Component'} - Created from hhHub`,
            template: 'create-react-app',
            files: {
                'package.json': JSON.stringify({
                    name: (name || 'antd-component').toLowerCase().replace(/\s+/g, '-'),
                    version: '0.0.0',
                    private: true,
                    dependencies: {
                        react: '^18.2.0',
                        'react-dom': '^18.2.0',
                        'react-scripts': '5.0.1',
                        antd: '^5.12.0',
                        dayjs: '^1.11.10',
                    },
                    scripts: {
                        start: 'react-scripts start',
                        build: 'react-scripts build',
                        test: 'react-scripts test --env=jsdom',
                        eject: 'react-scripts eject',
                    },
                    browserslist: {
                        production: ['>0.2%', 'not dead', 'not op_mini all'],
                        development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
                    },
                }, null, 2),
                'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${name || 'Ant Design Component'}" />
    <title>${name || 'Ant Design Component'}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
                'src/index.js': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
                'src/App.js': code,
                'src/index.css': `body {
  margin: 0;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
}

#root {
  min-height: 100vh;
}`,
            },
        };

        // 生成 StackBlitz URL（使用 SDK 方式）
        const projectData = encodeURIComponent(JSON.stringify(project));
        
        return NextResponse.json({
            success: true,
            data: {
                project,
                embedUrl: `https://stackblitz.com/edit/react-${Date.now()}?embed=1&file=src/App.js&hideNavigation=1&view=preview`,
                // StackBlitz 需要通过 SDK 打开，返回项目配置供前端使用
            },
        });
    } catch (error) {
        console.error('创建 StackBlitz 失败:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : '创建失败',
        });
    }
}
