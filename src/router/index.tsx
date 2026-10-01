import { createBrowserRouter, Navigate } from 'react-router-dom';
import SerialTrackerPage from '@/pages/analytics/SerialTrackerPage';

import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminProtectedRoute } from './AdminProtectedRoute';
import BannersPage from '@/pages/banners/BannersPage';
import AdminLoginPage from '@/pages/auth/AdminLoginPage';
import AdminOtpPage from '@/pages/auth/AdminOtpPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import WithdrawalsPage from '@/pages/withdrawals/WithdrawalsPage';
import ProductsPage from '@/pages/products/ProductsPage';
import QrGeneratorPage from '@/pages/products/QrGeneratorPage';
import OrdersPage from '@/pages/orders/OrdersPage';
import StaffPage from '@/pages/staff/StaffPage';
import UsersPage from '@/pages/users/UsersPage';
import ChatsPage from '@/pages/chats/ChatsPage';
import DisputesPage from '@/pages/disputes/DisputesPage';
import LogsPage from '@/pages/logs/LogsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import RouteErrorPage from '@/pages/RouteErrorPage';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <AdminLoginPage /> },
          { path: '/otp', element: <AdminOtpPage /> },
        ],
      },
      {
        element: <AdminProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/withdrawals', element: <WithdrawalsPage /> },
              { path: '/products', element: <ProductsPage /> },
              { path: '/qr-generator', element: <QrGeneratorPage /> },
              { path: '/orders', element: <OrdersPage /> },
                { path: '/serial-tracker', element: <SerialTrackerPage /> },
              { path: '/banners', element: <BannersPage /> },
              { path: '/staff', element: <StaffPage /> },
              { path: '/users', element: <UsersPage /> },
              { path: '/chats', element: <ChatsPage /> },
              { path: '/disputes', element: <DisputesPage /> },
              { path: '/logs', element: <LogsPage /> },
              { path: '/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
