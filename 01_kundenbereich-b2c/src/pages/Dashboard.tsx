import { useAuth } from '@/contexts/AuthContext';
import { EnhancedCustomerDashboard } from '@/components/dashboards/EnhancedCustomerDashboard';
import { EnhancedSalespersonDashboard } from '@/components/dashboards/SalespersonDashboard';
import { EnhancedManagerDashboard } from '@/components/dashboards/EnhancedManagerDashboard';
import { EnhancedRegulatorDashboard } from '@/components/dashboards/EnhancedRegulatorDashboard';

export default function Dashboard() {
  const { state } = useAuth();
  const userRole = state.user?.role;

  switch (userRole) {
    case 'customer':
      return <EnhancedCustomerDashboard />;
    case 'salesperson':
      return <EnhancedSalespersonDashboard />;
    case 'manager':
      return <EnhancedManagerDashboard />;
    case 'regulator':
      return <EnhancedRegulatorDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Unbekannte Benutzerrolle</p>
        </div>
      );
  }
}
