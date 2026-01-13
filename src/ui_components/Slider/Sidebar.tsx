import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Moon, Sun, Link as LinkIcon, Bot, LayoutDashboard, Workflow, Globe, Shield, Activity } from 'lucide-react'
import Logout from '../Logout/index';
import { useUser } from '@/context/UserContext';
import { cn } from "@/lib/utils";

import { motion } from 'framer-motion';

export function SidebarIconExample() {
  const { theme, setTheme } = useTheme()
  const { user } = useUser();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/connections":
        return "Connections";
      case "/connectors":
      case "/integration":
        return "Integrations";
      case "/automation":
        return "Automation Editor";
      case "/templates":
        return "Template Gallery";
      case "/agents":
        return "Agent Workspace";
      case "/guardrails":
        return "Guardrails";
      case "/evals":
        return "Live Evaluations";
      default:
        return "Workflow Builder";
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "Connectors",
      url: "/connectors",
      icon: <Globe size={20} />,
    },
    {
      title: "Connections",
      url: "/connections",
      icon: <LinkIcon size={20} />,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: <HugeiconsIcon icon={Layout01Icon} size={20} />,
    },
    {
      title: "AI Agents",
      url: "/agents",
      icon: <Bot size={20} />,
    },
    {
      title: "Automations",
      url: "/automation",
      icon: <Workflow size={20} />,
    },
    {
      title: "Guardrails",
      url: "/guardrails",
      icon: <Shield size={20} />,
    },
    {
      title: "Live Evals",
      url: "/evals",
      icon: <Activity size={20} />,
    },
  ]

  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <SidebarHeader className='p-4 mt-2'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
                <Link to="/" className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-xl group-hover:bg-blue-500/30 transition-all" />
                    <div className="relative h-10 w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <LayoutDashboard size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="truncate font-black text-slate-900 dark:text-white tracking-tighter text-base">WORKFLOW</span>
                    <span className="truncate text-[10px] font-bold text-blue-500 uppercase tracking-widest">Faaz Tech</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">Main Menu</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={cn(
                          "h-11 rounded-xl transition-all duration-300 relative group",
                          isActive
                            ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border-none"
                            : "text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                        )}
                      >
                        <Link to={item.url} className="flex items-center gap-3 font-bold text-sm tracking-tight">
                          <div className={cn(
                            "transition-colors",
                            isActive ? "text-white" : "group-hover:text-blue-500"
                          )}>
                            {item.icon}
                          </div>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-slate-200 dark:border-white/5">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all p-2 h-14"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                        <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">{user?.name ? user.name[0] : 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                      <span className="truncate font-black text-slate-900 dark:text-white tracking-tight">
                        {user?.name || 'User'}
                      </span>
                      <span className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Pro Plan
                      </span>
                    </div>
                    <HugeiconsIcon icon={UnfoldMoreIcon} className="h-4 w-4 text-slate-400" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl" side="right" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user?.picture} />
                          <AvatarFallback>{user?.name ? user.name[0] : 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-black tracking-tight">{user?.name}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{user?.email}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
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
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
                  <Logout />
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="overflow-hidden flex flex-col h-full bg-transparent">
        <header className="flex h-16 shrink-0 items-center justify-between px-8 border-b border-slate-200 dark:border-white/5 bg-white/30 dark:bg-slate-950/30 backdrop-blur-md transition-all z-20">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500" />
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 transition-all shadow-sm"
            >
              {theme === "dark" ? <Sun className='h-4 w-4 text-yellow-500' /> : <Moon className='h-4 w-4 text-slate-900' />}
            </button>
            <div className="h-10 w-10 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              <div className="h-full w-full rounded-[11px] bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-y-auto relative z-10">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
