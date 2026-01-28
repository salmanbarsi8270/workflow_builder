import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/sidebar'
import { HugeiconsIcon } from "@hugeicons/react"
import { UnfoldMoreIcon, Layout01Icon } from "@hugeicons/core-free-icons"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { useLocation, Link, Outlet } from "react-router-dom"
import { Link as LinkIcon, Bot, LayoutGrid, Zap, Globe, Monitor, Wrench, FolderOpen, UserCircle, HandshakeIcon, ChevronRight, Search, Bell } from 'lucide-react'
import Logout from '../Logout/index';
import { useUser } from '@/context/UserContext';
import { cn } from "@/lib/utils";
import { useState, useEffect } from 'react';
 
import { motion } from 'framer-motion';
import { ColorPickerModal } from './ColorPickerModal';
import { GlobalSupport } from '../support/GlobalSupport';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ApprovalsList } from '../Dashboard/ApprovalsList';
import axios from 'axios';
import { API_URL } from '../api/apiurl';
 
export function SidebarIconExample() {
  const { theme, setTheme, accentColor } = useTheme()
  const { user } = useUser();
  const location = useLocation();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);
  const [approvalCount, setApprovalCount] = useState(0);
 
  const isSupportPage = location.pathname === '/support' || location.pathname.startsWith('/support/');
 
  // Fetch global approval count
  const fetchApprovalCount = async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/v1/dashboard/stats?userId=${user.id}`);
      const runs = data?.recentRuns || [];
      const waiting = runs.filter((r: any) => r.status?.toLowerCase() === "waiting");
      setApprovalCount(waiting.length);
    } catch (err) {
      console.error("Failed to fetch global approval count:", err);
    }
  };
 
  useEffect(() => {
    fetchApprovalCount();
    const interval = setInterval(fetchApprovalCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);
 
  const mainNavItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutGrid size={18} />,
    },
    {
      title: "Connectors",
      url: "/connectors",
      icon: <Globe size={18} />,
    },
    {
      title: "Connections",
      url: "/connections",
      icon: <LinkIcon size={18} />,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: <HugeiconsIcon icon={Layout01Icon} size={18} />,
    },
    {
      title: "Automations",
      url: "/automation",
      icon: <Zap size={18} />,
    },
    {
      title: "AI Agents",
      url: "/agents",
      icon: <Bot size={18} />,
    },
  ]
 
  const advancedNavItems = [
    {
      title: "Live Evals",
      url: "/evals",
      icon: <Monitor size={18} />,
    },
    {
      title: "UI Designer",
      url: "/ui-designer",
      icon: <Wrench size={18} />,
    },
    {
      title: "File Manager",
      url: "/files",
      icon: <FolderOpen size={18} />,
    },
    {
      title: "Instructions",
      url: "/personas",
      icon: <UserCircle size={18} />,
    },
    {
      title: "Support",
      url: "/support",
      icon: <HandshakeIcon size={18} />,
    },
  ]
 
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/": return "Dashboard";
      case "/connections": return "Connections";
      case "/connectors":
      case "/integration": return "Integrations";
      case "/automation": return "Automation Editor";
      case "/templates": return "Template Gallery";
      case "/agents": return "Agent Workspace";
      case "/evals": return "Live Evaluations";
      case "/ui-designer": return "UI Designer";
      case "/files": return "FILE MANAGER";
      case "/personas": return "INSTRUCTION LIBRARY";
      case "/support": return "SUPPORT";
      default: return "Workflow Builder";
    }
  };
 
  const pageTitle = getPageTitle(location.pathname);
 
  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617]">
      <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b1222] transition-all duration-300">
        <SidebarHeader className='mb-4 mt-2'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent p-0 h-auto">
                <Link to="/" className="flex items-center gap-3">
                  <div className="relative group">
                    <div
                      className="p-2 rounded-xl flex items-center justify-center text-white shadow-lg transition-all"
                      style={{ backgroundColor: accentColor, boxShadow: `${accentColor}33 0px 8px 16px` }}
                    >
                      <LayoutGrid size={20} className="group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-black text-slate-900 dark:text-white tracking-widest text-sm uppercase">WORKFLOW</span>
                    <span
                      className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5"
                      style={{ color: accentColor }}
                    >
                      Faaz Tech
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
 
        <SidebarContent className="gap-0">
          <SidebarGroup className="mb-4">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4">DASHBOARD</SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
              {mainNavItems.map((item) => {
                const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={cn(
                          "h-10 rounded-xl transition-all duration-300 relative group px-4 overflow-hidden",
                          isActive
                            ? "text-white"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                        style={isActive ? {
                          background: `${accentColor}26`,
                          borderLeft: `3px solid ${accentColor}`,
                          borderRadius: '0 12px 12px 0'
                        } : {}}
                      >
                        <Link to={item.url} className="flex items-center gap-3 font-bold text-xs uppercase tracking-wider">
                          <div className={cn(
                            "transition-colors",
                            isActive ? "" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white"
                          )} style={isActive ? { color: accentColor } : {}}>
                            {item.icon}
                          </div>
                          <span className={isActive ? "" : "text-slate-500 dark:text-slate-400"} style={isActive ? { color: accentColor } : {}}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
 
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4">Advanced</SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
              {advancedNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={cn(
                          "h-10 rounded-xl transition-all duration-300 relative group px-4 overflow-hidden",
                          isActive
                            ? "text-white"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                        style={isActive ? {
                          background: `${accentColor}26`,
                          borderLeft: `3px solid ${accentColor}`,
                          borderRadius: '0 12px 12px 0'
                        } : {}}
                      >
                        <Link to={item.url} className="flex items-center gap-3 font-bold text-xs uppercase tracking-wider">
                          <div className={cn(
                            "transition-colors",
                            isActive ? "" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white"
                          )} style={isActive ? { color: accentColor } : {}}>
                            {item.icon}
                          </div>
                          <span className={isActive ? "" : "text-slate-500 dark:text-slate-400"} style={isActive ? { color: accentColor } : {}}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
 
        <SidebarFooter className="bg-transparent mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all p-3 h-16 w-full group"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <div className="p-2 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                          {user?.name ? user.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#0b1222] rounded-full" />
                      </div>
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="truncate font-black text-slate-900 dark:text-white tracking-tight text-xs uppercase">
                          {user?.name || 'Test Admin'}
                        </span>
                        <span
                          className="truncate text-[9px] font-black uppercase tracking-widest mt-0.5"
                          style={{ color: accentColor }}
                        >
                          Pro Plan
                        </span>
                      </div>
                      <HugeiconsIcon icon={UnfoldMoreIcon} className="h-4 w-4 text-slate-400 ml-auto group-hover:text-white transition-colors" />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl" side="right" align="end">
                  <DropdownMenuGroup className="gap-1 flex flex-col">
                    <DropdownMenuItem className="rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer">Account</DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer">Settings</DropdownMenuItem>
                    <div className="flex items-center justify-between px-2 py-2 text-xs font-bold uppercase tracking-widest">
                      <span>Dark Mode</span>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    <DropdownMenuItem
                      className="rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer"
                      onClick={() => setIsColorPickerOpen(true)}
                    >
                      Change Theme
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
                  <Logout />
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail className="hover:after:bg-[#f97316]/50" />
      </Sidebar>
     
      <SidebarInset className="overflow-hidden flex flex-col h-full bg-transparent">
        <header className="flex h-16 shrink-0 items-center justify-between px-8 bg-transparent transition-all z-20">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500" />
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
           
            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                <span className="text-slate-400 dark:text-slate-500 font-medium">DASHBOARD</span>
                {location.pathname !== '/' && (
                  <>
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-900 dark:text-white font-black tracking-widest">{pageTitle}</span>
                  </>
                )}
            </div>
          </div>
 
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition-colors">
                <Search size={18} />
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
              <button
                onClick={() => setIsApprovalsOpen(true)}
                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition-colors relative group"
              >
                <Bell size={18} className={cn(approvalCount > 0 && "animate-pulse")} />
                {approvalCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-[#f97316] text-white text-[10px] font-black rounded-full border-2 border-white dark:border-[#020617] flex items-center justify-center animate-bounce">
                    {approvalCount}
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>
 
        <div className={cn(
          "flex flex-1 flex-col relative z-10",
          isSupportPage ? "overflow-hidden" : "overflow-y-auto"
        )}>
          <Outlet />
        </div>
      </SidebarInset>
 
      <Sheet open={isApprovalsOpen} onOpenChange={setIsApprovalsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 p-0">
            <SheetHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Approvals</SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {user?.id && <ApprovalsList userId={user.id} />}
              {approvalCount === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <Bell className="h-8 w-8 opacity-20" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1">No pending approvals found.</p>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
      </Sheet>
 
      <ColorPickerModal open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen} />
      <GlobalSupport />
    </SidebarProvider>
  )
}
 
 