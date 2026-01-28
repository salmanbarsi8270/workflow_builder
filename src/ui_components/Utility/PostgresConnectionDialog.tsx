import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Info, Eye, EyeOff, Loader2, Database } from "lucide-react"
import { useState } from "react"
import { API_URL } from "../api/apiurl"
import { useUser } from "../../context/UserContext"

interface PostgresConnectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function PostgresConnectionDialog({ open, onOpenChange, onSuccess }: PostgresConnectionDialogProps) {
    const { user } = useUser();
    const [connectionString, setConnectionString] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [showString, setShowString] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const handleSave = async () => {
        if (!user) {
            setError("User not found");
            return;
        }
        if (!connectionString.trim()) {
            setError("Connection String is required");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/connections/key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    service: 'postgres',
                    apiKey: isReadOnly
                        ? (connectionString.includes('?')
                            ? `${connectionString}&options=-c%20default_transaction_read_only%3Don`
                            : `${connectionString}?options=-c%20default_transaction_read_only%3Don`)
                        : connectionString,
                    name: name
                })
            });
            const data = await response.json();
            if (data.success) {
                setLoading(false);
                setConnectionString('');
                setName('');
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                setError(data.error || "Failed to save connection");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to save connection");
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Connect PostgreSQL</DialogTitle>
                    <DialogDescription className="sr-only">
                        Enter your PostgreSQL connection string.
                    </DialogDescription>
                </DialogHeader>

                {/* Info box */}
                <div className="rounded-md border bg-muted/50 p-4 text-sm">
                    <div className="flex gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="space-y-2">
                            <p className="font-medium">
                                Connection String Format:
                            </p>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs break-all">
                                postgresql://user:password@host:port/database?sslmode=require
                            </code>
                        </div>
                    </div>
                </div>

                {/* Input */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Label htmlFor="pg-name">Connection Name</Label>
                            <span className="text-red-500">*</span>
                        </div>
                        <Input
                            id="pg-name"
                            type="text"
                            placeholder="e.g. Production DB"
                            value={name}
                            onChange={(e) => setName(e.target.value)} required
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Label htmlFor="pg-string">Connection String</Label>
                            <span className="text-red-500">*</span>
                        </div>
                        <div className="relative">
                            <Input
                                id="pg-string"
                                type={showString ? "text" : "password"}
                                placeholder="postgresql://..."
                                value={connectionString}
                                onChange={(e) => setConnectionString(e.target.value)} required
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowString(!showString)}
                            >
                                {showString ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="read-only"
                            checked={isReadOnly}
                            onCheckedChange={(checked) => setIsReadOnly(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="read-only"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Read-only Connection
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Enforces read-only permissions for all actions using this connection.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter>
                    <Button disabled={loading}
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button disabled={loading} onClick={handleSave}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : 'Connect'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
