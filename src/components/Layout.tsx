import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  Mail, 
  FileText, 
  BarChart3, 
  Settings,
  Wheat,
  CreditCard,
  Upload,
  Shield,
  Package
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Email Logs', href: '/emails', icon: Mail },
    { name: 'Cotton Data', href: '/cotton-data', icon: Database },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Contracts', href: '/contracts', icon: Upload },
    { name: 'Sampling Entry', href: '/sampling', icon: Package },
    { name: 'Admin Contracts', href: '/admin/contracts', icon: Shield },
    { name: 'Processing Logs', href: '/logs', icon: FileText },
    { name: 'Manual Review', href: '/review', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center px-6 bg-blue-700">
          <Wheat className="h-8 w-8 text-white" />
          <h1 className="ml-3 text-xl font-bold text-white">Cotton katha</h1>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8 px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;