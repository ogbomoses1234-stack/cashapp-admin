import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Shows a slim gradient progress bar at the very top of the viewport
 * whenever the route changes. Auto-hides after the new page paints.
 */
export function RouteProgress() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 550);
    return () => clearTimeout(t);
  }, [location.pathname, location.search]);

  if (!visible) return null;
  return <div className="route-progress" aria-hidden />;
}
