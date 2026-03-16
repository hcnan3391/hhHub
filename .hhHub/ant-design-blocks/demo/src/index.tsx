import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from 'antd';
import 'antd/dist/reset.css';

function Demo() {
  return (
    <Button type="primary">
      Hello hhHub
    </Button>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Demo />);
}