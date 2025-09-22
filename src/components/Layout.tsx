import React from 'react';
import SidebarLayout from './SidebarLayout';

interface LayoutProps {
  children: React.ReactNode;
  currentTool: string;
  onToolChange: (tool: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTool, onToolChange }) => {
  // Use the new SidebarLayout
  return (
    <SidebarLayout currentTool={currentTool} onToolChange={onToolChange}>
      {children}
    </SidebarLayout>
  );
};

export default Layout;
