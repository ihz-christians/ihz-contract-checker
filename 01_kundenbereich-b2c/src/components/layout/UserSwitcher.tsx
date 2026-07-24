import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth, DEMO_USERS } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function UserSwitcher() {
  const { state, switchUser } = useAuth();
  const currentUser = state.user;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'customer':
        return 'default';
      case 'salesperson':
        return 'secondary';
      case 'manager':
        return 'outline';
      case 'regulator':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'customer':
        return 'Kunde';
      case 'salesperson':
        return 'Verkäufer';
      case 'manager':
        return 'Manager';
      case 'regulator':
        return 'Regulator';
      default:
        return role;
    }
  };

  const handleUserSwitch = (userId: string, userName: string) => {
    switchUser(userId);
    toast.success(`Zu ${userName} gewechselt`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Demo-Benutzer
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Zu anderem Benutzer wechseln</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.values(DEMO_USERS).map(({ user }) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => handleUserSwitch(user.id, user.name)}
            className="flex items-center gap-3 p-3"
            disabled={currentUser?.id === user.id}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name}
                {currentUser?.id === user.id && ' (Aktuell)'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
              {getRoleLabel(user.role)}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
