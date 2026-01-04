import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Node } from '@xyflow/react';
import { toast as sonner } from "sonner";
import GenericActionForm from "./GenericActionForm";
import { APP_DEFINITIONS } from "../metadata";
import ScheduleForm from "../../Utility/ScheduleForm";
import HTTPForm from "../../Utility/HTTPForm";
import GitHubForm from "../../Connections/GitHubForm";
import { Save, Trash2, X, Settings, Info, HelpCircle, ExternalLink, Copy, RefreshCw, ChevronLeft, ChevronRight, Sparkles, Shield, Zap, AlertCircle } from "lucide-react";
import { AppLogoMap } from "../utils/Applogo";
import { cn } from "@/lib/utils";
import { usePiecesMetadata } from "../hooks/usePiecesMetadata";
import { getServices } from "../../api/connectionlist";
import { useUser } from "@/context/UserContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const SpecificForms: Record<string, any> = {
    'Schedule': ScheduleForm,
    'GitHub': GitHubForm,
};

interface RightGenericSidebarProps {
    selectedNode: Node | undefined;
    nodes: Node[]; // Added this
    onUpdateNode: (label: string, data?: any, immediate?: boolean) => void;
    onDeleteNode: () => void;
    onClose: () => void;
    nodeStatus?: 'pending' | 'running' | 'success' | 'error' | 'warning';
    isLocked?: boolean;
}

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'running': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
        case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
        case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        default: return 'text-muted-foreground bg-muted border-border';
    }
};

const getInitialParams = (node: Node) => {
    const nodeData = node.data as any;
    const migratedParams = { ...(nodeData.params || {}) } as any;

    // Support migration from old top-level fields to nested params
    const legacyFields = [
        'to', 'subject', 'body',
        'spreadsheetId', 'spreadsheet_id', 'sheetName', 'sheet_name', 'range', 'values',
        'fileId', 'file_id', 'title', 'documentId', 'document_id', 'text',
        'intervalMinutes', 'intervalSeconds', 'intervalHours', 'intervalDay', 'intervalType',
        'connection'
    ];

    legacyFields.forEach(field => {
        if (nodeData[field] !== undefined && (migratedParams[field] === undefined || migratedParams[field] === '')) {
            migratedParams[field] = nodeData[field];
        }
    });

    // Ensure defaults are populated from Action Definitions
    const appName = nodeData.appName as string;
    const actionId = nodeData.actionId as string;
    const appDef = APP_DEFINITIONS.find(a => a.name === appName || a.id === nodeData.icon);
    const actionDef = appDef?.actions.find(a => a.id === actionId);

    // Special Case: Google Sheets sheetName -> range migration
    if ((nodeData.sheetName || nodeData.sheet_name) && (migratedParams.range === undefined || migratedParams.range === '')) {
        migratedParams.range = nodeData.sheetName || nodeData.sheet_name;
    }

    // Special Case: GitHub createRepository/createIssue title -> name/repository migration
    if (appName === 'GitHub' || nodeData.icon === 'github') {
        // Create Repository needs 'name'
        if (actionId === 'createRepository' || actionId === 'create_repository') {
            if (migratedParams.title && (migratedParams.name === undefined || migratedParams.name === '')) {
                migratedParams.name = migratedParams.title;
            }
        }
    }

    if (actionDef?.parameters) {
        actionDef.parameters.forEach(p => {
            if (p.default !== undefined && (migratedParams[p.name] === undefined || migratedParams[p.name] === '')) {
                migratedParams[p.name] = p.default;
            }
        });
    }

    return migratedParams;
};

export default function RightGenericSidebar({ selectedNode, nodes, onUpdateNode, onDeleteNode, onClose, nodeStatus = 'pending', isLocked = false }: RightGenericSidebarProps) {
    const [localLabel, setLocalLabel] = useState(selectedNode?.data.label as string || '');
    const [localParams, setLocalParams] = useState(() => selectedNode ? getInitialParams(selectedNode) : {});
    const [activeTab, setActiveTab] = useState("configuration");
    const tabsListRef = useRef<HTMLDivElement>(null);
    const [canScroll, setCanScroll] = useState({ left: false, right: false });

    useEffect(() => {
        const checkScroll = () => {
            if (tabsListRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
                setCanScroll({
                    left: scrollLeft > 0,
                    right: scrollLeft < scrollWidth - clientWidth - 2 // 2px buffer
                });
            }
        };

        checkScroll();
        const el = tabsListRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            const resizeObserver = new ResizeObserver(checkScroll);
            resizeObserver.observe(el);
            return () => {
                el.removeEventListener('scroll', checkScroll);
                resizeObserver.disconnect();
            };
        }
    }, [selectedNode]);

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsListRef.current) {
            const amount = 200;
            tabsListRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth'
            });
        }
    };
    const [isDirty, setIsDirty] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const { pieces, loading: metadataLoading } = usePiecesMetadata();
    const { user } = useUser();
    const [allConnections, setAllConnections] = useState<any[]>([]);

    useEffect(() => {
        const fetchAllConnections = async () => {
            if (user?.id) {
                try {
                    const data = await getServices(user.id);
                    const services = data.data || [];

                    // Flatten all accounts from all services
                    const allAccounts: any[] = [];
                    services.forEach((svc: any) => {
                        if (svc.accounts && Array.isArray(svc.accounts)) {
                            svc.accounts.forEach((acc: any) => {
                                allAccounts.push({
                                    id: acc.id,
                                    name: acc.username, // Map username to name for display
                                    externalId: acc.externalId,
                                    service: svc.id,
                                    serviceName: svc.name,
                                    // Preserve other fields
                                    ...acc
                                });
                            });
                        }
                    });

                    setAllConnections(allAccounts);
                } catch (error) {
                    console.error("Failed to fetch connections for sidebar", error);
                }
            }
        };
        fetchAllConnections();
    }, [user?.id]);

    const activeConnectionInfo = useMemo(() => {
        const connectionId = localParams.authId;
        if (!connectionId) return null;
        return allConnections.find(c => c.id === connectionId);
    }, [allConnections, localParams.authId]);

    useEffect(() => {
        if (selectedNode) {
            const currentLabel = selectedNode.data.label as string || '';
            const migrated = getInitialParams(selectedNode);

            // Check if data has changed
            const paramsChanged = JSON.stringify(migrated) !== JSON.stringify(localParams);
            const labelChanged = currentLabel !== localLabel;

            if (paramsChanged) setLocalParams(migrated);
            if (labelChanged) setLocalLabel(currentLabel);

            setIsDirty(false);
            setValidationErrors({});
        }
    }, [selectedNode?.id, JSON.stringify(selectedNode?.data)]); // Sync whenever ID or data content changes

    if (!selectedNode) return null;

    const appName = selectedNode.data.appName as string;
    const actionId = selectedNode.data.actionId as string;
    const actionName = selectedNode.data.actionName as string;
    const actionIcon = selectedNode.data.icon as string;

    const appDef = APP_DEFINITIONS.find(a => a.name === appName || a.id === selectedNode.data.icon);
    const actionDef: any = appDef?.actions.find(a => a.id === actionId);

    const FormComponent = useMemo(() => {
        if (SpecificForms[appName]) {
            return SpecificForms[appName];
        }

        switch (selectedNode.data.icon) {
            case 'sheets':
            case 'docs':
            case 'drive':
                return GenericActionForm;
            case 'http':
                return HTTPForm;
            default:
                return GenericActionForm;
        }
    }, [actionDef?.id, selectedNode.data.icon, appName]);

    const validateParams = () => {
        const errors: Record<string, string> = {};

        if (!localLabel.trim()) {
            errors.label = "Step label is required";
        }

        if (actionDef?.parameters) {
            actionDef.parameters.forEach((param: any) => {
                let isVisible = true;
                if (param.dependsOn) {
                    const dependentValue = localParams[param.dependsOn.field];
                    if (dependentValue !== param.dependsOn.value) {
                        isVisible = false;
                    }
                }

                if (isVisible && param.required && !localParams[param.name]) {
                    errors[param.name] = `${param.label} is required`;
                }
            });
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleDelete = () => {
        sonner.success("Step deleted successfully");
        onDeleteNode();
    };

    const handleSave = () => {
        if (!validateParams()) {
            sonner.error("Please fix validation errors");
            return;
        }

        let filteredParams = { ...localParams };

        // Filter out inactive parameters
        if (actionDef?.parameters) {
            const activeParamNames = new Set<string>();

            actionDef.parameters.forEach((param: any) => {
                let isVisible = true;
                if (param.dependsOn) {
                    const dependentValue = localParams[param.dependsOn.field];
                    if (dependentValue !== param.dependsOn.value) {
                        isVisible = false;
                    }
                }

                if (isVisible) {
                    activeParamNames.add(param.name);
                } else {
                    delete filteredParams[param.name];
                }
            });
        }

        onUpdateNode(localLabel, { ...selectedNode.data, label: localLabel, params: filteredParams }, true);

        setIsDirty(false);
        sonner.success("Changes saved successfully");
    };

    const handleParamChange = (newParams: any) => {
        setLocalParams(newParams);
        setIsDirty(true);
        // Clear validation errors for changed fields
        setValidationErrors({});
    };

    const handleCopyNodeId = () => {
        navigator.clipboard.writeText(selectedNode.id);
        sonner.info("Node ID copied to clipboard");
    };

    const handleTestConnection = () => {
        sonner.info("Testing connection...");
        // Add your connection test logic here
    };

    return (
        <TooltipProvider>
            <div className="w-96 border-l bg-linear-to-b from-background to-background/95 backdrop-blur-sm flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="border-b p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center relative", getStatusColor(nodeStatus).split(' ')[1])}>
                                {AppLogoMap[actionIcon] ? <img src={AppLogoMap[actionIcon]} className="w-6 h-6" alt={appName} /> : <Zap className="h-5 w-5" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold leading-none flex items-center gap-2">
                                    {actionName}
                                    {actionDef?.category === 'ai' && (<Sparkles className="h-4 w-4 text-purple-500" />)}
                                </h2>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    {appName}
                                    <ChevronRight className="h-3 w-3" />
                                    {actionDef?.type || 'action'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X className="h-4 w-4" /></Button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-normal">
                                ID: {selectedNode.id}
                            </Badge>
                            {activeConnectionInfo && (
                                <Badge variant="outline" className="flex items-center gap-1 border-green-500/30 bg-green-500/5 text-green-600">
                                    <Shield className="h-3 w-3" />
                                    {activeConnectionInfo.externalId || activeConnectionInfo.name || 'Connected'}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyNodeId}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy Node ID</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleTestConnection}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Test Connection</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 container-flex">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <div className="border-b px-2 relative group flex items-center">
                            {canScroll.left && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-0 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
                                    onClick={() => scrollTabs('left')}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            )}

                            <TabsList
                                ref={tabsListRef}
                                className="
                                    w-full h-12 bg-transparent
                                    flex justify-start
                                    overflow-x-auto overflow-y-hidden
                                    whitespace-nowrap
                                    no-scrollbar
                                    px-4
                                "
                            >
                                <TabsTrigger
                                    value="configuration"
                                    className="shrink-0 rounded-none h-12 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configuration
                                </TabsTrigger>

                                <TabsTrigger
                                    value="outputs"
                                    className="shrink-0 rounded-none h-12 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Outputs
                                </TabsTrigger>

                                <TabsTrigger
                                    value="preview"
                                    className="shrink-0 rounded-none h-12 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Preview
                                </TabsTrigger>

                                <TabsTrigger
                                    value="info"
                                    className="shrink-0 rounded-none h-12 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <Info className="h-4 w-4 mr-2" />
                                    Info
                                </TabsTrigger>
                            </TabsList>

                            {canScroll.right && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
                                    onClick={() => scrollTabs('right')}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>


                        <div className="p-6 overflow-y-auto">
                            {/* Configuration Tab */}
                            <TabsContent value="configuration" className="space-y-6 m-0">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                Step Label
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        A descriptive name for this step in your workflow
                                                    </TooltipContent>
                                                </Tooltip>
                                            </Label>
                                            {validationErrors.label && (
                                                <span className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {validationErrors.label}
                                                </span>
                                            )}
                                        </div>
                                        <Input 
                                            value={localLabel} 
                                            onChange={(e) => {
                                                setLocalLabel(e.target.value);
                                                setIsDirty(true);
                                            }} 
                                            placeholder="Enter step label" 
                                            className={cn("transition-all duration-200", validationErrors.label && "border-red-500 focus-visible:ring-red-500")}
                                            disabled={isLocked}
                                        />
                                    </div>

                                    <Separator />

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-medium">Parameters</Label>
                                            {Object.keys(localParams).length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {Object.keys(localParams).length} parameters
                                                </Badge>
                                            )}
                                        </div>

                                        {FormComponent ? (
                                            <div className="space-y-4">
                                                <FormComponent data={selectedNode.data} params={localParams} onChange={handleParamChange} parameters={actionDef?.parameters || []} errors={validationErrors} nodes={nodes} nodeId={selectedNode.id} disabled={isLocked} />
                                            </div>
                                        ) : (
                                            <div className="p-8 border border-dashed rounded-lg text-center space-y-3">
                                                <Settings className="h-12 w-12 mx-auto text-muted-foreground/30" />
                                                <div>
                                                    <p className="font-medium text-muted-foreground">No configuration needed</p>
                                                    <p className="text-sm text-muted-foreground/70 mt-1">
                                                        This action doesn't require additional configuration
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Outputs Tab */}
                            <TabsContent value="outputs" className="space-y-6 m-0">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            Step Outputs
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    Data provided by this step for use in subsequent steps
                                                </TooltipContent>
                                            </Tooltip>
                                        </Label>
                                    </div>

                                    {(() => {
                                        const service = selectedNode.data.icon as string;
                                        const piece = pieces[service];
                                        const actionType = actionDef?.type === 'trigger' ? 'triggers' : 'actions';
                                        const schema = piece?.metadata?.[actionType]?.[actionId]?.outputSchema;

                                        if (metadataLoading) {
                                            return <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading schema...</div>;
                                        }

                                        if (!schema || schema.length === 0) {
                                            return (
                                                <div className="p-8 border border-dashed rounded-lg text-center space-y-3">
                                                    <Zap className="h-12 w-12 mx-auto text-muted-foreground/30" />
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">No output schema defined</p>
                                                        <p className="text-sm text-muted-foreground/70 mt-1">
                                                            This step may not provide structured output or the schema is currently unavailable.
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="rounded-lg border bg-card overflow-hidden">
                                                <div className="bg-muted/30 px-4 py-2 border-b text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                    Available Properties
                                                </div>
                                                <div className="divide-y">
                                                    {schema.map((prop: any) => {
                                                        const variablePath = `{{steps.${selectedNode.id === '1' ? 'trigger' : selectedNode.id}.data.${prop.name}}}`;

                                                        return (
                                                            <div key={prop.name} className="p-4 hover:bg-muted/10 transition-colors group">
                                                                <div className="flex items-start justify-between mb-1">
                                                                    <div className="flex flex-col gap-1">
                                                                        <code className="text-xs font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded w-fit">
                                                                            {prop.name}
                                                                        </code>
                                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase w-fit">
                                                                            {prop.type}
                                                                        </Badge>
                                                                    </div>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={() => {
                                                                                    navigator.clipboard.writeText(variablePath);
                                                                                    sonner.success("Variable path copied!");
                                                                                }}
                                                                            >
                                                                                <Copy className="h-3 w-3" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Copy {variablePath}</TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                {prop.description && (
                                                                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                                                        {prop.description}
                                                                    </p>
                                                                )}
                                                                {prop.properties && prop.properties.length > 0 && (
                                                                    <div className="mt-2 pl-4 border-l-2 border-muted space-y-2">
                                                                        {prop.properties.map((subProp: any) => (
                                                                            <div key={subProp.name} className="text-[11px] flex items-center justify-between group/sub">
                                                                                <div>
                                                                                    <span className="font-semibold text-muted-foreground">{subProp.name}</span>
                                                                                    <span className="mx-1 text-muted-foreground/50">·</span>
                                                                                    <span className="text-muted-foreground/70">{subProp.type}</span>
                                                                                </div>
                                                                                <button
                                                                                    className="text-[10px] text-primary hover:underline opacity-0 group-hover/sub:opacity-100"
                                                                                    onClick={() => {
                                                                                        const subPath = `{{steps.${selectedNode.id === '1' ? 'trigger' : selectedNode.id}.data.${prop.name}.${subProp.name}}}`;
                                                                                        navigator.clipboard.writeText(subPath);
                                                                                        sonner.success("Sub-property copied!");
                                                                                    }}
                                                                                >
                                                                                    Copy
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 flex gap-3">
                                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-600/80 leading-normal">
                                            Use these properties in later steps using the syntax: <br />
                                            <code className="font-mono bg-blue-500/10 px-1 rounded text-blue-700">
                                                {"{{"}steps.{selectedNode.id}.data.property_name{"}}"}
                                            </code>
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Preview Tab */}
                            <TabsContent value="preview" className="space-y-4 m-0">
                                <div className="rounded-lg border bg-card p-4">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4" />
                                        Action Preview
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-muted-foreground">App:</div>
                                            <div className="font-medium">{appName}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-muted-foreground">Action:</div>
                                            <div className="font-medium">{actionName}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-muted-foreground">Label:</div>
                                            <div className="font-medium">{localLabel || 'Not set'}</div>
                                        </div>
                                        {actionDef?.description && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <div className="text-muted-foreground mb-1">Description:</div>
                                                    <p className="text-sm">{actionDef.description}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-card p-4">
                                    <h4 className="font-medium mb-3">Parameters Preview</h4>
                                    {Object.keys(localParams).length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(localParams).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-start text-sm">
                                                    <span className="text-muted-foreground">{key}:</span>
                                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                                        {String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No parameters configured
                                        </p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Info Tab */}
                            <TabsContent value="info" className="space-y-4 m-0">
                                <div className="space-y-4">
                                    <div className="rounded-lg border bg-card p-4">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            Step Information
                                        </h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-muted-foreground">Node ID:</div>
                                                <div className="font-mono text-xs">{selectedNode.id}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-muted-foreground">Type:</div>
                                                <div className="font-medium">{selectedNode.type}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-muted-foreground">Position:</div>
                                                <div className="font-medium">
                                                    X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-muted-foreground">Created:</div>
                                                <div className="font-medium">
                                                    {(selectedNode.data as any).createdAt || 'Not specified'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {actionDef?.documentation && (
                                        <div className="rounded-lg border bg-card p-4">
                                            <h4 className="font-medium mb-3">Documentation</h4>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {actionDef.documentation}
                                            </p>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                                View Full Documentation
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-linear-to-t from-background to-background/95">
                    <div className="space-y-4">
                        {isDirty && (
                            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <span>You have unsaved changes</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                variant="outline" 
                                onClick={handleDelete} 
                                className="h-11 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={isLocked}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={isLocked || (!isDirty && localLabel === selectedNode.data.label)} 
                                className="h-11"
                            >
                                {<Save className="h-4 w-4 mr-2" />}Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}