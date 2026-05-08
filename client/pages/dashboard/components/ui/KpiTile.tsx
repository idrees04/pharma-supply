import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface KpiTileProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subValue?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorClassName?: string;
  href?: string;
  isLoading?: boolean;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  title,
  value,
  icon: Icon,
  subValue,
  colorClassName = "text-primary",
  href,
  isLoading
}) => {
  const content = (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 group",
      href ? "hover:shadow-lg hover:border-primary/50 cursor-pointer" : "cursor-default"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {title}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
              </div>
            )}
            {subValue && !isLoading && (
              <p className="text-xs text-muted-foreground font-medium">
                {subValue}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-muted/50 transition-colors group-hover:bg-muted",
            colorClassName.replace('text-', 'bg-').replace('600', '100').replace('500', '100')
          )}>
            <Icon className={cn("w-6 h-6", colorClassName)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Link to={href} className="block">
          {content}
        </Link>
      </motion.div>
    );
  }

  return content;
};

export const KpiTileSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-8 w-28 bg-muted animate-pulse rounded" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-12 w-12 bg-muted animate-pulse rounded-xl" />
      </div>
    </CardContent>
  </Card>
);
