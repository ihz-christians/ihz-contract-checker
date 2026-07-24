import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Upload,
  Settings,
  Shield,
  Users,
  AlertTriangle,
  Home,
  ExternalLink,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    roles: ['customer', 'salesperson', 'manager', 'regulator'],
  },
  {
    title: 'Fälle',
    url: '/cases',
    icon: FileText,
    roles: ['customer', 'salesperson', 'manager', 'regulator'],
  },
  {
    title: 'Upload',
    url: '/upload',
    icon: Upload,
    roles: ['salesperson'],
  },
  {
    title: 'Team-Berichte',
    url: '/reports/agency',
    icon: BarChart3,
    roles: ['manager'],
  },
  {
    title: 'Regulierungs-Berichte',
    url: '/reports/regulator',
    icon: AlertTriangle,
    roles: ['regulator'],
  },
  {
    title: 'Einstellungen',
    url: '/settings/profile',
    icon: Settings,
    roles: ['customer', 'salesperson', 'manager', 'regulator'],
  },
];

export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const location = useLocation();
  const { state: authState } = useAuth();
  const currentPath = location.pathname;

  const userRole = authState.user?.role;
  const filteredNavItems = navItems.filter((item) => userRole && item.roles.includes(userRole));

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar
      className={`${sidebarState === 'collapsed' ? 'w-16' : 'w-64'} border-r border-border bg-card`}
    >
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            {sidebarState !== 'collapsed' && (
              <div>
                <h2 className="font-semibold text-sm">IhreZuhauseBeratung</h2>
                <p className="text-xs text-muted-foreground">Ehrliche & kompetente Beratung</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: navIsActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive(item.url) || navIsActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {sidebarState !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a
                    href={import.meta.env.VITE_LANDINGPAGE_URL || 'https://ihrezuhauseberatung.de'}
                    className="flex items-center gap-3 px-3 py-2 mt-4 rounded-md transition-colors hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {sidebarState !== 'collapsed' && <span>Zur Startseite</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
