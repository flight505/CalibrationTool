import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  collapsed: collapsedProp,
  setCollapsed: setCollapsedProp,
}: {
  children: React.ReactNode;
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [collapsedState, setCollapsedState] = useState(true);

  const collapsed = collapsedProp !== undefined ? collapsedProp : collapsedState;
  const setCollapsed = setCollapsedProp !== undefined ? setCollapsedProp : setCollapsedState;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <TooltipProvider delayDuration={200}>
        {children}
      </TooltipProvider>
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  collapsed,
  setCollapsed,
}: {
  children: React.ReactNode;
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <SidebarProvider collapsed={collapsed} setCollapsed={setCollapsed}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<"div">) => {
  return (
    <>
      <DesktopSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "h-full px-3 py-4 flex flex-col bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 transition-all duration-200",
        collapsed ? "w-[70px]" : "w-[280px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive,
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
}) => {
  const { collapsed } = useSidebar();

  const buttonContent = (
    <button
      onClick={link.onClick}
      className={cn(
        "flex items-center gap-3 py-2 px-2 rounded-md w-full transition-colors",
        collapsed ? "justify-center" : "justify-start",
        "hover:bg-neutral-200 dark:hover:bg-neutral-700",
        isActive && "bg-neutral-200 dark:bg-neutral-700",
        className
      )}
    >
      <div className="flex-shrink-0">
        {link.icon}
      </div>
      {!collapsed && (
        <span className="text-neutral-700 dark:text-neutral-200 text-sm whitespace-nowrap overflow-hidden">
          {link.label}
        </span>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-neutral-800 dark:bg-neutral-900 text-white">
          <p>{link.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
};

export const SidebarGroup = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { collapsed } = useSidebar();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={cn("mb-4", className)}>
      {!collapsed && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <span>{title}</span>
          <svg
            className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
      {(expanded || collapsed) && (
        <div className={cn("space-y-1", !collapsed && "mt-2")}>
          {children}
        </div>
      )}
    </div>
  );
};