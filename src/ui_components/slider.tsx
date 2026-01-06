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
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/item'
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
import { Moon, Sun, Link as LinkIcon, Bot, LayoutDashboard, Cable, Workflow, } from 'lucide-react'
import Logout from './Logout'
import { useUser } from '@/context/UserContext';

export function SidebarIconExample() {
  const { theme, setTheme } = useTheme()
  const { user } = useUser();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/order":
        return "Order";
      case "/connections":
        return "Connections";
      case "/integration":
        return "Integration";
      case "/automation":
        return "Automation";
      case "/templates":
        return "Templates";
      default:
        return "Dashboard";
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboard size={20} strokeWidth={2} />,
    },
    {
      title: "Integration",
      url: "/integration",
      icon: <Cable size={20} strokeWidth={2} />,
    },
    {
      title: "Connections",
      url: "/connections",
      icon: <LinkIcon size={20} strokeWidth={2} />,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: <HugeiconsIcon icon={Layout01Icon} strokeWidth={2} />,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: <Bot size={20} strokeWidth={2} />,
    },
    {
      title: "Automation",
      url: "/automation",
      icon: <Workflow size={20} strokeWidth={2} />,
    },
  ]


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className='p-3 mt-2'>
             <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link to="/">
                    <Avatar>
                      <AvatarImage src="https://picsum.photos/seed/picsum/200" />
                      <AvatarFallback className="rounded-lg">FTS</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Workflow Builder</span>
                      <span className="truncate text-xs">Automation</span>
                    </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarContent>
                <SidebarMenu>
                {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                        asChild 
                        tooltip={item.title} 
                        isActive={item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)}
                    >
                        <Link to={item.url}>{item.icon}<span>{item.title}</span></Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user?.picture}
                        alt={user?.name || 'User'}
                      />
                      <AvatarFallback className="rounded-lg">{user?.name ? user.name[0] : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.name || 'User'}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || 'User@user.com'}
                      </span>
                    </div>
                    <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <Item size="xs">
                        <ItemMedia>
                          <Avatar>
                            <AvatarImage
                              src={user?.picture}
                              alt={user?.name || 'User'}
                            />
                            <AvatarFallback className="rounded-lg">{user?.name ? user.name[0] : 'U'}</AvatarFallback>
                          </Avatar>
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{user?.name || 'User'}</ItemTitle>
                          <ItemDescription> {user?.email || 'User@user.com'}</ItemDescription>
                        </ItemContent>
                      </Item>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Account</DropdownMenuItem>
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                      <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                        <span>Dark Mode</span>
                        <Switch
                          checked={theme === "dark"}
                          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                        />
                      </div>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <Logout />
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          <div className="w-full flex flex-row justify-end mr-10">
            <button onClick={() =>{
                theme === "dark" ? setTheme("light") : setTheme("dark")
            }}>
                {theme === "dark" ? <Sun className='text-yellow-500' /> : <Moon className='text-black' />}
            </button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
            <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}