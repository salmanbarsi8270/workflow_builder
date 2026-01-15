import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, Check, Code } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Agent } from './types';

interface PublishSettingsProps {
    agent: Agent;
    onUpdate: (updates: Partial<Agent>) => void;
}

export function PublishSettings({ agent, onUpdate }: PublishSettingsProps) {
    const [isPublished, setIsPublished] = useState(agent.is_published || false);
    const [urlSlug, setUrlSlug] = useState(agent.public_url_slug || '');
    const [visibility, setVisibility] = useState<'public' | 'private'>(agent.visibility || 'private');
    const [copied, setCopied] = useState(false);
    const [showEmbedDialog, setShowEmbedDialog] = useState(false);
    const [embedCode, setEmbedCode] = useState('');

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

    const handleVisibilityChange = (value: 'public' | 'private') => {
        setVisibility(value);
        onUpdate({ visibility: value });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateEmbedCode = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`/api/v1/agents/${agent.id}/embed-code?userId=${userId}`);
            const data = await response.json();
            setEmbedCode(data.embedCode);
            setShowEmbedDialog(true);
        } catch (error) {
            console.error('Failed to generate embed code:', error);
        }
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
                            />
                            <p className="text-xs text-muted-foreground">
                                Customize the URL for your agent (only lowercase letters, numbers, and hyphens)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Visibility</Label>
                            <RadioGroup value={visibility} onValueChange={handleVisibilityChange}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="public" id="r1" />
                                    <Label htmlFor="r1" className="font-normal cursor-pointer">
                                        Public - Anyone with the link can access
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="private" id="r2" />
                                    <Label htmlFor="r2" className="font-normal cursor-pointer">
                                        Private - Requires authentication
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={generateEmbedCode}
                        >
                            <Code className="mr-2 h-4 w-4" />
                            Generate Embed Code
                        </Button>
                    </>
                )}
            </div>

            <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Embed Code</DialogTitle>
                        <DialogDescription>
                            Copy this code to embed the chatbot on your website
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{embedCode}</code>
                            </pre>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(embedCode)}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
