import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useAdminAuthBootstrap } from '@/hooks/useAdminAuth';

export default function App() {
  useAdminAuthBootstrap();
  return <RouterProvider router={router} />;
}
