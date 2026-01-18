const fs = require('fs');
const path = 'd:/desktop folders/workflow/workflow_builder/src/ui_components/Automation/components/GenericActionForm.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    
    // Find the nested block start
    const nestedStart = lines.findIndex(l => l.includes('// New Props Interface') && l.startsWith('        '));
    
    if (nestedStart === -1) {
        console.log('Nested block not found!');
        process.exit(1);
    }

    // Find the end of the nested block (before DynamicSelect)
    const dynamicSelectIndex = lines.findIndex(l => l.includes('const DynamicSelect = ({'));
    
    // The nested block ends before DynamicSelect, usually at dynamicSelectIndex - (some empty lines)
    // Actually, looking at the file view, the nested block ends at line 323, DynamicSelect starts at 338.
    // The previous block (old DictionaryInput) ends at line 152?
    // Wait, I messed up the file so bad.
    
    // Let's just remove the lines that are clearly nested duplicates.
    // We look for the 8-space indented 'const DictionaryInput'
    
    const newLines = lines.filter(line => {
        // Filter out the nested interface and component definition
        // Identified by 8-space indent and content matching the duplicate
        if (line.startsWith('        interface DictionaryInputProps')) return false;
        if (line.startsWith('        const DictionaryInput = (')) return false;
        if (line.trim() === '// New Props Interface' && line.startsWith('        ')) return false;
        
        // This is risky if I don't catch the *body* of the nested function.
        return true;
    });
    
    // BETTER APPROACH:
    // Read the file.
    // Keep lines 0 to nestedStart.
    // Skip lines from nestedStart UNTIL we see 'const DynamicSelect' ?
    // No, because 'const DynamicSelect' is NOT part of the bad block.
    // The bad block is INSIDE the old DictionaryInput.
    // So if I delete the bad block, I am still left with the OLD DictionaryInput.
    
    // I want to replace the whole `const DictionaryInput ...` block with the NEW code.
    // The NEW code is NOT nested.
    
    // Let's find the start of DictionaryInput (line 140 approx)
    const dictStart = lines.findIndex(l => l.startsWith('const DictionaryInput = ({'));
    
    // Find start of DynamicSelect
    const dynamicStart = lines.findIndex(l => l.startsWith('const DynamicSelect = ({') || l.startsWith('        const DynamicSelect = ({')); // It might be indented depending on file structure
    
    if (dictStart !== -1 && dynamicStart !== -1) {
        const keptBefore = lines.slice(0, dictStart);
        const keptAfter = lines.slice(dynamicStart);
        
        const newCode = `// New Props Interface
interface DictionaryInputProps {
    value?: Record<string, string>;
    onChange: (val: Record<string, string>) => void;
    placeholder?: string;
    disabled?: boolean;
    nodes: Node[];
    edges?: any[];
    nodeId?: string;
    suggestions?: string[];
}

const DictionaryInput = ({ value, onChange, placeholder, disabled, nodes, edges, nodeId, suggestions = [] }: DictionaryInputProps) => {
    const parseValue = (val: any) => {
        try {
            if (typeof val === 'string') return Object.entries(JSON.parse(val)).map(([k, v]) => ({ key: k, value: String(v) }));
            if (typeof val === 'object' && val !== null) {
                return Object.entries(val).map(([k, v]) => ({ key: k, value: String(v) }));
            }
        } catch { }
        return [];
    };

    const [items, setItems] = useState<{ key: string, value: string }[]>(parseValue(value));
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync from parent props if changed externally
    useEffect(() => {
        if (containerRef.current?.contains(document.activeElement)) return;

        const parsed = parseValue(value);
        if (JSON.stringify(parsed) !== JSON.stringify(items)) {
            setItems(parsed);
        }
    }, [value]);

    const handleUpdate = (newItems: { key: string, value: string }[]) => {
        setItems(newItems);
        // Serialize to object
        const obj: Record<string, string> = {};
        newItems.forEach(item => {
            if (item.key) obj[item.key] = item.value;
        });
        onChange(obj);
    };

    const addItem = (key: string = '', val: string = '') => {
        handleUpdate([...items, { key, value: val }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        handleUpdate(newItems);
    };

    const updateItem = (index: number, field: 'key' | 'value', val: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: val };
        handleUpdate(newItems);
    };

    const handleVariableSelect = (index: number, v: string) => {
        const currentVal = items[index].value || '';
        updateItem(index, 'value', currentVal + v);
    };

    const availableSuggestions = React.useMemo(() => {
        if (!suggestions || suggestions.length === 0) return [];
        const existingKeys = new Set(items.map(i => i.key));
        return suggestions.filter(s => !existingKeys.has(s));
    }, [suggestions, items]);

    return (
        <div className="flex flex-col gap-2" ref={containerRef}>
            <div className="border rounded-md overflow-hidden bg-background/50">
                
                {/* Suggestions / Quick Add */}
                {availableSuggestions.length > 0 && (
                    <div className="p-2 border-b bg-primary/5 flex flex-wrap gap-1.5 animate-in slide-in-from-top-1 duration-200">
                        <span className="text-[10px] font-medium text-muted-foreground w-full mb-0.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            Suggested Properties
                        </span>
                        {availableSuggestions.map(s => (
                            <button
                                key={s}
                                onClick={() => addItem(s)}
                                className="px-2 py-0.5 text-[10px] font-medium bg-background border rounded-full hover:border-primary hover:text-primary transition-colors flex items-center gap-1 shadow-xs"
                                disabled={disabled}
                            >
                                {s}
                                <Plus className="h-2 w-2 opacity-50" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Items */}
                <div className="divide-y max-h-[300px] overflow-auto">
                    {items.length === 0 && availableSuggestions.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-[10px] italic">
                            No properties defined. Click add below.
                        </div>
                    )}
                    {items.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 p-3 group hover:bg-muted/20 transition-colors bg-card/30">
                            {/* Key Row */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70 w-8">Key</span>
                                <Input
                                    value={item.key}
                                    onChange={(e) => updateItem(index, 'key', e.target.value)}
                                    placeholder="key_name"
                                    className="flex-1 h-7 text-xs font-medium font-mono border shadow-sm bg-background/50 focus:bg-background"
                                    disabled={disabled}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground/50 hover:text-red-500 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => removeItem(index)}
                                    disabled={disabled}
                                    title="Remove Property"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {/* Value Row */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70 w-8">Val</span>
                                <div className="flex-1 flex items-center gap-1">
                                    <Input
                                        value={item.value}
                                        onChange={(e) => updateItem(index, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="flex-1 h-7 text-xs border shadow-sm bg-background/50 focus:bg-background min-w-0"
                                        disabled={disabled}
                                    />
                                    <VariablePicker
                                        nodes={nodes}
                                        edges={edges}
                                        onSelect={(v) => handleVariableSelect(index, v)}
                                        currentNodeId={nodeId}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer/Add Action */}
                <div className="p-2 border-t bg-muted/20">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs gap-2 text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => addItem()}
                        disabled={disabled}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Property
                    </Button>
                </div>
            </div>

            {placeholder && (
                <p className="text-[10px] text-muted-foreground italic px-1">
                    {placeholder}
                </p>
            )}
        </div>
    );
};
`;

        const finalContent = [...keptBefore, newCode, ...keptAfter].join('\n');
        fs.writeFileSync(path, finalContent);
        console.log('Fixed file successfully!');
    } else {
        console.log('Could not find start/end markers.' + dictStart + ' ' + dynamicStart);
    }

} catch(e) {
    console.error(e);
}
