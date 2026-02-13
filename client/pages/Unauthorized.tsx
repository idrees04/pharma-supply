import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Unauthorized Page
 *
 * Displayed when a user tries to access a resource they don't have permission for.
 * Provides a clear message and navigation back to safe areas.
 */
export default function Unauthorized() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-6 p-8 max-w-md">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <ShieldAlert className="w-16 h-16 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-foreground">403</h1>
                    <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground">
                        You don't have permission to access this page. Please contact your
                        administrator if you believe this is an error.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                        <Link to="/">Return to Dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/login">Sign in as different user</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
