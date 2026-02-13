import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-12 text-center max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl font-semibold mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
