import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";
import type { Agent } from './types';

interface PublishSettingsProps {
    agent: Agent;
    onUpdate: (updates: Partial<Agent>) => void;
    isUpdating?: boolean;
}

export function PublishSettings({ agent, onUpdate, isUpdating = false }: PublishSettingsProps) {
    const [isPublished, setIsPublished] = useState(agent.is_published || false);
    const [urlSlug, setUrlSlug] = useState(agent.public_url_slug || '');
    const [copied, setCopied] = useState(false);

    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/chat/${urlSlug}`;

    const handlePublishToggle = (checked: boolean) => {
        setIsPublished(checked);
        onUpdate({ is_published: checked });
    };

    const handleSlugChange = (value: string) => {
        setUrlSlug(value);
    };

    const handleSlugBlur = () => {
        // Save slug when user leaves the field
        onUpdate({ public_url_slug: urlSlug });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="publish-switch" className="text-base font-semibold">
                            Publish Agent
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Make this agent accessible via public URL
                        </p>
                    </div>
                    <Switch
                        id="publish-switch"
                        checked={isPublished}
                        onCheckedChange={handlePublishToggle}
                        disabled={isUpdating}
                    />
                </div>

                {isPublished && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="public-url">Public URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="public-url"
                                    value={publicUrl}
                                    readOnly
                                    className="flex-1 bg-muted"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(publicUrl)}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url-slug">URL Slug</Label>
                            <Input
                                id="url-slug"
                                value={urlSlug}
                                onChange={(e) => handleSlugChange(e.target.value)}
                                onBlur={handleSlugBlur}
                                placeholder="my-agent-slug"
                                disabled={isUpdating}
                            />
                            <p className="text-xs text-muted-foreground">
                                Customize the URL for your agent (only lowercase letters, numbers, and hyphens)
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
