import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Zap } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function Placeholder({ title, description, icon }: PlaceholderProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-slide-up">
      <Card className="p-12 text-center max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full text-primary text-4xl">{icon}</div>
        </div>
        <h1 className="text-3xl font-bold mb-3">{title}</h1>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="space-y-3">
          <Button onClick={() => navigate('/')} variant="outline" className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <p className="text-sm text-muted-foreground">
            <Zap className="w-4 h-4 inline mr-1" />
            Coming soon - This module is under development
          </p>
        </div>
      </Card>
    </div>
  );
}
