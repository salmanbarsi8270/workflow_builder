import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ConnectionSelector from "./ConnectionSelector";
import { API_URL } from "../api/apiurl";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast as sonner } from "sonner";
import { useUser } from "@/context/UserContext";
import { type Node } from "@xyflow/react";
import { VariablePicker } from "../Automation/GenericActionForm";

interface GitHubFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    disabled?: boolean;
    nodes: Node[];
    nodeId?: string;
}

export default function GitHubForm({ data, params, onChange, disabled, nodes, nodeId }: GitHubFormProps) {
    const { user } = useUser();
    const [repositories, setRepositories] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [issues, setIssues] = useState<any[]>([]);
    const [isLoadingIssues, setIsLoadingIssues] = useState(false);

    const actionId = data.actionId;
    const needsIssueSelection = ['updateIssue', 'closeIssue', 'reOpenIssue', 'lock_issue', 'unlock_issue'].includes(actionId);

    useEffect(() => {
        if (params.authId && user?.id) {
            fetchRepositories();
        } else if (!params.authId) {
            setRepositories([]);
            setIssues([]);
        }
    }, [params.authId, user?.id]);

    useEffect(() => {
        if (params.repository && user?.id && needsIssueSelection) {
            let state: 'open' | 'closed' | 'all' = 'all';
            if (actionId === 'closeIssue') state = 'open';
            if (actionId === 'reOpenIssue') state = 'closed';

            // For lock/unlock, we might want open issues generally, but the internal filter handles the 'locked' boolean
            fetchIssues(state);
        } else if (!params.repository) {
            setIssues([]);
        }
    }, [params.repository, user?.id, actionId, needsIssueSelection]);

    const fetchRepositories = async () => {
        if (!params.authId || !user?.id) return;

        setIsLoadingRepos(true);
        try {
            const response = await fetch(`${API_URL}/api/github/repos?userId=${user.id}&connectionId=${params.authId}`);
            const result = await response.json();

            if (response.ok) {
                const repoList = (Array.isArray(result) ? result : (result.data || [])) as any[];
                setRepositories([...repoList].sort((a, b) => a.full_name.localeCompare(b.full_name)));
            } else {
                console.error("Failed to fetch repositories", result.error);
                sonner.error("Failed to load repositories");
            }
        } catch (error) {
            console.error("Error fetching repositories:", error);
            sonner.error("Error connecting to GitHub API");
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const fetchIssues = async (state: 'open' | 'closed' | 'all' = 'all') => {
        if (!params.repository || !user?.id) return;

        setIsLoadingIssues(true);
        try {
            const response = await fetch(`${API_URL}/api/github/issues?userId=${user.id}&repository=${params.repository}&state=${state}`);
            const result = await response.json();

            if (response.ok) {
                let issueList = (Array.isArray(result) ? result : (result.data || [])) as any[];

                // Client-side safety filter to match requested state Precisely
                if (state === 'open') {
                    issueList = issueList.filter(i => i.state === 'open');
                } else if (state === 'closed') {
                    issueList = issueList.filter(i => i.state === 'closed');
                }

                // Additional filtering for Lock/Unlock status
                if (actionId === 'lock_issue') {
                    issueList = issueList.filter(i => i.locked === false);
                } else if (actionId === 'unlock_issue') {
                    issueList = issueList.filter(i => i.locked === true);
                }

                setIssues(issueList);
            } else {
                console.error("Failed to fetch issues", result.error);
                sonner.error("Failed to load issues");
            }
        } catch (error) {
            console.error("Error fetching issues:", error);
            sonner.error("Error connecting to GitHub API");
        } finally {
            setIsLoadingIssues(false);
        }
    };

    const handleIssueSelect = (issueNumber: string) => {
        const selectedIssue = issues.find(i => String(i.number) === issueNumber);
        if (selectedIssue) {
            onChange({
                ...params,
                issueNumber: selectedIssue.number,
                title: selectedIssue.title || params.title,
                body: selectedIssue.body || params.body,
                state: selectedIssue.state || params.state || 'open'
            });
        } else {
            handleChange('issueNumber', issueNumber);
        }
    };

    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const handleVariableSelect = (field: string, variable: string) => {
        const currentValue = params[field] || '';
        handleChange(field, currentValue + variable);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Connection Selector */}
            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    GitHub Connection <span className="text-red-500">*</span>
                </Label>
                <ConnectionSelector
                    appName="GitHub"
                    value={params.authId || ''}
                    onChange={(val) => handleChange('authId', val)}
                    disabled={disabled}
                />
            </div>

            {/* Repository Dropdown */}
            {actionId !== 'create_repository' && actionId !== 'createRepository' && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                                Repository <span className="text-red-500">*</span>
                            </Label>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={fetchRepositories}
                            disabled={!params.connection || isLoadingRepos || disabled}
                        >
                            <RefreshCw className={`h-3 w-3 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <Select
                        value={params.repository || ''}
                        onValueChange={(val) => handleChange('repository', val)}
                        disabled={disabled || !params.connection || isLoadingRepos}
                    >
                        <SelectTrigger className="w-full">
                            {isLoadingRepos ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm">Loading repositories...</span>
                                </div>
                            ) : (
                                <SelectValue placeholder="Select a repository" />
                            )}
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]" position="popper">
                            {repositories.length > 0 ? (
                                repositories.map(repo => (
                                    <SelectItem key={repo.id || repo.full_name} value={repo.full_name}>
                                        {repo.full_name}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-center text-xs text-muted-foreground italic">
                                    {params.connection ? "No repositories found" : "Select connection first"}
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Warning for Delete Repository */}
            {actionId === 'delete_repository' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-tight">Destructive Action</p>
                        <p className="text-[11px] text-red-500/80 leading-relaxed">
                            Deleting a repository is <strong>permanent</strong> and cannot be undone.
                            Ensure you have selected the correct repository before proceeding.
                        </p>
                    </div>
                </div>
            )}

            {/* Issue Selection Dropdown - for actions that need an existing issue */}
            {needsIssueSelection && params.repository && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            Select Issue <span className="text-red-500">*</span>
                        </Label>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => {
                                let state: 'open' | 'closed' | 'all' = 'all';
                                if (actionId === 'closeIssue') state = 'open';
                                if (actionId === 'reOpenIssue') state = 'closed';
                                fetchIssues(state);
                            }}
                            disabled={isLoadingIssues || disabled}
                        >
                            <RefreshCw className={`h-3 w-3 ${isLoadingIssues ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <Select
                        value={String(params.issueNumber || '')}
                        onValueChange={handleIssueSelect}
                        disabled={disabled || isLoadingIssues}
                    >
                        <SelectTrigger className="w-full">
                            {isLoadingIssues ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm">Loading issues...</span>
                                </div>
                            ) : (
                                <SelectValue placeholder="Select an issue to edit/close" />
                            )}
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]" position="popper">
                            {issues.length > 0 ? (
                                issues.map(issue => (
                                    <SelectItem key={issue.id} value={String(issue.number)}>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs">#{issue.number} {issue.title}</span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-center text-xs text-muted-foreground italic">
                                    No open issues found
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Issue Number - for update/close/etc. */}
            {(actionId === 'updateIssue' || actionId === 'closeIssue' || actionId === 'reOpenIssue' || actionId === 'lock_issue' || actionId === 'unlock_issue') && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            Issue Number <span className="text-red-500">*</span>
                        </Label>
                        <VariablePicker
                            nodes={nodes}
                            onSelect={(v) => handleVariableSelect('issueNumber', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Input
                        type="text"
                        value={params.issueNumber || ''}
                        onChange={(e) => handleChange('issueNumber', e.target.value)}
                        placeholder="e.g. 123"
                        disabled={disabled}
                    />
                </div>
            )}

            {/* Title - common for issue actions */}
            {(actionId === 'createIssue' || actionId === 'updateIssue') && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            Title <span className="text-red-500">*</span>
                        </Label>
                        <VariablePicker
                            nodes={nodes}
                            onSelect={(v) => handleVariableSelect('title', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Input
                        value={params.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Enter issue title"
                        disabled={disabled}
                    />
                </div>
            )}

            {/* State - for updateIssue */}
            {actionId === 'updateIssue' && (
                <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        State
                    </Label>
                    <Select
                        value={params.state || 'open'}
                        onValueChange={(val) => handleChange('state', val)}
                        disabled={disabled}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Body - for issue actions */}
            {(actionId === 'createIssue' || actionId === 'updateIssue') && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            Body
                        </Label>
                        <VariablePicker
                            nodes={nodes}
                            onSelect={(v) => handleVariableSelect('body', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Textarea
                        value={params.body || ''}
                        onChange={(e) => handleChange('body', e.target.value)}
                        placeholder="Enter issue description"
                        className="min-h-[100px]"
                        disabled={disabled}
                    />
                </div>
            )}

            {/* Fields for Create Repository */}
            {(actionId === 'create_repository' || actionId === 'createRepository') && (
                <>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <VariablePicker
                                nodes={nodes}
                                onSelect={(v) => handleVariableSelect('name', v)}
                                currentNodeId={nodeId}
                            />
                        </div>
                        <Input
                            value={params.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g. my-awesome-repo"
                            disabled={disabled}
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                                Description
                            </Label>
                            <VariablePicker
                                nodes={nodes}
                                onSelect={(v) => handleVariableSelect('description', v)}
                                currentNodeId={nodeId}
                            />
                        </div>
                        <Textarea
                            value={params.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Optional description"
                            className="h-20"
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                                Private Repository
                            </Label>
                            <p className="text-[10px] text-muted-foreground">Make this repository visible only to you.</p>
                        </div>
                        <Switch
                            checked={params.private || false}
                            onCheckedChange={(val) => handleChange('private', val)}
                            disabled={disabled}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
