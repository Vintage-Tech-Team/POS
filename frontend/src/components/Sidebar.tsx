'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  ShoppingBagIcon,
  TruckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon,
    roles: ['admin', 'manager', 'cashier', 'accountant'] 
  },
  { 
    name: 'POS', 
    href: '/pos', 
    icon: ShoppingCartIcon,
    roles: ['admin', 'manager', 'cashier'] 
  },
  { 
    name: 'Products', 
    href: '/products', 
    icon: CubeIcon,
    roles: ['admin', 'manager', 'cashier'] 
  },
  { 
    name: 'Sales', 
    href: '/sales', 
    icon: ShoppingBagIcon,
    roles: ['admin', 'manager', 'cashier'] 
  },
  { 
    name: 'Purchases', 
    href: '/purchases', 
    icon: TruckIcon,
    roles: ['admin', 'manager'] 
  },
  { 
    name: 'Inventory', 
    href: '/inventory', 
    icon: ChartBarIcon,
    roles: ['admin', 'manager'] 
  },
  { 
    name: 'Customers', 
    href: '/customers', 
    icon: UsersIcon,
    roles: ['admin', 'manager', 'cashier'] 
  },
  { 
    name: 'Suppliers', 
    href: '/suppliers', 
    icon: BuildingStorefrontIcon,
    roles: ['admin', 'manager'] 
  },
  { 
    name: 'Accounting', 
    href: '/accounting', 
    icon: CurrencyDollarIcon,
    roles: ['admin', 'accountant'] 
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: DocumentChartBarIcon,
    roles: ['admin', 'manager', 'accountant'] 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Cog6ToothIcon,
    roles: ['admin'] 
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  
  // Ensure component only renders on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Filter navigation based on user role - show all on server, filter on client
  const allowedNavigation = mounted 
    ? navigation.filter((item) => item.roles.includes(user?.role || ''))
    : navigation; // Show all during SSR to avoid hydration mismatch

  return (
    <div className="flex flex-col w-64 bg-gray-900">
      <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
        <h1 className="text-xl font-bold text-white">POS System</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {!mounted ? (
          // Show loading skeleton during SSR
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-10 bg-gray-800 rounded-md"></div>
            ))}
          </div>
        ) : (
          // Show filtered navigation after mount
          allowedNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                {item.name}
              </Link>
            );
          })
        )}
      </nav>
      
      {/* Role Badge - only show after mount */}
      {mounted && user && (
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
          <p className="text-xs text-gray-400">Current Role</p>
          <p className="text-sm font-medium text-white capitalize">{user.role}</p>
        </div>
      )}
    </div>
  );
}


