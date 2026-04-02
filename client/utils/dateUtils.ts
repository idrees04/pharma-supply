import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string, formatStr: string = 'MMM yyyy'): string => {
    try {
        const date = parseISO(dateString);
        return format(date, formatStr);
    } catch {
        return dateString;
    }
};

export const formatRelativeDays = (daysOverdue: number): string => {
    if (daysOverdue <= 0) return 'Due today';
    return `${daysOverdue} day(s) overdue`;
};

export const formatRelativeDate = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 0) return 'Overdue';
        return `${diffDays} days left`;
    } catch {
        return dateString;
    }
};