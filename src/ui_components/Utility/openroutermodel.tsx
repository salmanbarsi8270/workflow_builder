import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { API_URL } from "../api/apiurl"
import { useUser } from "../../context/UserContext"

interface AddAIProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function OpenRouterModel({open, onOpenChange, onSuccess}: AddAIProviderDialogProps) {
    const { user } = useUser();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    const handleSave = async () => {
        if (!user) {
            setError("User not found");
            return;
        }
        if (!apiKey.trim()) {
            setError("API Key is required");
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
                    service: 'openrouter',
                    apiKey: apiKey,
                    name: name
                })
            });
            const data = await response.json();
            if (data.success) {
                setLoading(false);
                setApiKey(''); // Clear key
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                setError(data.error || "Failed to save key");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to save key");
            setLoading(false);
        }
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add AI Provider</DialogTitle>
          <DialogDescription className="sr-only">
            Add your OpenRouter API key to connect your AI provider.
          </DialogDescription>
        </DialogHeader>

        {/* Info box */}
        <div className="rounded-md border bg-muted/50 p-4 text-sm">
          <div className="flex gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium">
                Follow these instructions to get your OpenRouter API Key:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Visit{" "}
                  <a
                    href="https://openrouter.ai/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    https://openrouter.ai/settings/keys
                  </a>
                </li>
                <li>
                  Create and copy your OpenRouter API Key.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2 relative">
            <div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="name">Name</Label>
                    <span className="text-red-500">*</span>
                </div>
                <Input
                    id="name"
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)} required
                    className="pr-10"
                />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <span className="text-red-500">*</span>
                </div>
            </div>
          <div className="relative">
            <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="sk-************************"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)} required
                className="pr-10"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
            >
                {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                )}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
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
              ) : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
