import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { FileIcon, Trash2, Upload, Download, Loader2, Image as ImageIcon, FileText, Database, Search, Edit3, LayoutGrid, Plus, Lightbulb, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '@/ui_components/api/apiurl';
import { useTheme } from '@/components/theme-provider';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface AppFile {
    id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    created_at: string;
    chunk_count: number;
}

interface Chunk {
    id: string;
    chunk_index: number;
    content: string;
    created_at: string;
    similarity?: number;
}



export default function FileManager() {
    const { user } = useUser();
    const { accentColor } = useTheme();
    const [files, setFiles] = useState<AppFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // State for Dialogs
    const [previewFile, setPreviewFile] = useState<AppFile | null>(null);
    const [exploringFile, setExploringFile] = useState<AppFile | null>(null);

    const fetchFiles = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data } = await axios.get(`${API_URL}/api/v1/files?userId=${user.id}`);
            setFiles(data);
        } catch (error) {
            console.error('Failed to fetch files:', error);
            toast.error('Failed to load files');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setSelectedFiles(acceptedFiles);
    }, []);

    const handleConfirmUpload = async () => {
        if (!user?.id || selectedFiles.length === 0) return;
        setUploading(true);

        for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.id);

            try {
                const { data } = await axios.post(`${API_URL}/api/v1/files`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (data.duplicate) {
                    toast.info(`File "${file.name}" already exists.`);
                } else {
                    toast.success(`Uploaded ${file.name}`);
                }
            } catch (error) {
                console.error('Upload failed:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        setUploading(false);
        setSelectedFiles([]);
        fetchFiles();
    };

    const handleCancelUpload = () => {
        setSelectedFiles([]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const deleteFile = async (id: string, name: string) => {
        if (!user?.id) return;
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            await axios.delete(`${API_URL}/api/v1/files/${id}?userId=${user.id}`);
            toast.success('File deleted');
            setFiles(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete file');
        }
    }

    const downloadFile = (id: string, name: string) => {
        // Direct download link
        const link = document.createElement('a');
        link.href = `${API_URL}/api/v1/files/${id}/content`;
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mime: string) => {
        if (mime.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
        if (mime === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    };

    return (
        <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

            <div className="relative w-full max-w-[90%] mx-auto z-10 p-8 h-full flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex-1">
                        <div className="mb-6">
                            <div className="items-center gap-4 mb-3">
                                <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                                    File Manager
                                </h1>
                                <div 
                                    className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                                    style={{ backgroundColor: accentColor }}
                                />
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                            Manage your uploaded assets and documents. These files are processed into vector chunks for your AI agents to use for precise context retrieval.
                        </p>
                    </div>
                </div>

                {/* Upload Area */}
                {selectedFiles.length > 0 ? (
                    <div className="relative group border-2 border-dashed border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-[32px] p-8 md:p-10 flex flex-col items-center justify-center gap-6 transition-all duration-500">
                        <div className="text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <FileIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''} Selected
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ready to upload</p>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                                {selectedFiles.map((f, i) => (
                                    <span key={i} className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                                        {f.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-2">
                             <Button 
                                onClick={handleCancelUpload}
                                variant="ghost"
                                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirmUpload}
                                disabled={uploading}
                                className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] text-white shadow-xl hover:scale-105 transition-all"
                                style={{ backgroundColor: accentColor, boxShadow: `${accentColor}40 0px 10px 20px` }}
                            >
                                {uploading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                                {uploading ? 'Uploading...' : 'Confirm Upload'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "relative group border-2 border-dashed rounded-[32px] p-8 md:p-10 flex flex-col items-center justify-center gap-4 transition-all duration-500 cursor-pointer",
                            isDragActive 
                            ? "border-primary-color bg-primary-color/5" 
                            : "border-slate-200 dark:border-white/10"
                        )}
                        >
                        <input {...getInputProps()} />
                        
                        <div 
                            className="h-14 w-14 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-110 duration-500"
                            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                        >
                            {uploading ? <Loader2 className="animate-spin h-6 w-6" /> : <Upload className="h-5 w-5" />}
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Click to upload or drag and drop</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                SVG, PNG, JPG or PDF <span className="mx-2">•</span> Max. 10MB
                            </p>
                        </div>

                        <Button 
                            className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 mt-2"
                            style={{ 
                                backgroundColor: accentColor,
                                boxShadow: `${accentColor}40 0px 8px 24px`
                            }}
                        >
                            Browse Files
                        </Button>
                    </div>
                )}

                {/* Files Grid */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
                            {files.map(file => (
                                <Card key={file.id} className="group relative overflow-hidden rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                                    <CardContent className="p-6 flex flex-col gap-6 h-full">
                                        {/* Action Buttons & Icon */}
                                        <div className="flex items-center justify-between">
                                            <div 
                                                className="h-11 w-11 rounded-[12px] flex items-center justify-center shadow-sm"
                                                style={{ backgroundColor: file.mime_type === 'application/pdf' ? '#fff1f1' : '#f1f5ff' }}
                                            >
                                                {getFileIcon(file.mime_type)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => downloadFile(file.id, file.original_name)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                {file.chunk_count > 0 && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={() => setExploringFile(file)}>
                                                        <LayoutGrid className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteFile(file.id, file.original_name)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* File Info */}
                                        <div className="space-y-3 flex-1">
                                            <h3 className="font-black text-slate-900 dark:text-white truncate text-lg tracking-tight" title={file.original_name}>
                                                {file.original_name}
                                            </h3>
                                            
                                            <div>
                                                {file.chunk_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                                                        <div className="h-1 w-1 rounded-full bg-current" />
                                                        PROCESSED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest">
                                                        <div className="h-1 w-1 rounded-full bg-current animate-pulse" />
                                                        INDEXING
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Retrieval Data Stats */}
                                        <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Retrieval Data</span>
                                                <span 
                                                    className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter"
                                                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                                                >
                                                    {file.chunk_count} Chunks
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Size</p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatSize(file.size)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uploaded</p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {new Date(file.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Bottom Decorative Underline */}
                                        <div 
                                            className="absolute bottom-0 left-0 h-1 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ backgroundColor: accentColor }}
                                        />
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Upload New Asset Card */}
                            <div 
                                {...getRootProps()}
                                className="group relative h-full min-h-[300px] rounded-[24px] border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/2 flex flex-col items-center justify-center gap-4 transition-all duration-500 cursor-pointer"
                            >
                                <input {...getInputProps()} />
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors shadow-sm">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload New Asset</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Help Callout */}
                <div className="mt-12 p-6 rounded-[24px] bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shadow-sm">
                            <Lightbulb className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-black text-slate-900 dark:text-white tracking-tight">Need help organizing?</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Read our documentation on how to optimize PDF structure for better AI chunking.</p>
                        </div>
                    </div>
                    <Button variant="link" className="font-black uppercase tracking-widest text-[11px] h-auto p-0 group-hover:translate-x-1 transition-transform" style={{ color: accentColor }}>
                        Learn more
                    </Button>
                </div>

                {/* PREVIEW DIALOG */}
                <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                    <DialogContent className="w-full max-w-5xl h-[85vh] p-0 gap-0 flex flex-col overflow-hidden rounded-[24px] border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900">
                        <DialogHeader className="p-6 border-b border-slate-100 dark:border-white/5 space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white truncate">
                                    {previewFile?.original_name}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-5">
                                Read Only Preview
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50 p-6 flex items-center justify-center relative" onContextMenu={(e) => e.preventDefault()}>
                            {previewFile?.mime_type.startsWith('image/') ? (
                                <img src={`${API_URL}/api/v1/files/${previewFile.id}/content`} alt={previewFile.original_name} className="max-w-full max-h-full object-contain shadow-2xl pointer-events-none select-none rounded-xl" />
                            ) : previewFile?.mime_type === 'application/pdf' ? (
                                <iframe
                                    src={`${API_URL}/api/v1/files/${previewFile.id}/content#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-full bg-white border-none shadow-2xl rounded-xl"
                                    title="File Preview"
                                />
                            ) : previewFile ? (
                                <FileContentPreview file={previewFile} />
                            ) : null}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* RAG EXPLORER DIALOG */}
                <Dialog open={!!exploringFile} onOpenChange={(open) => !open && setExploringFile(null)}>
                    <DialogContent className="w-full max-w-[95vw] lg:max-w-7xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-[32px] border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900">
                        <DialogHeader className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm">
                                    <Database className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <DialogTitle className="text-xl font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                        RAG Explorer: {exploringFile?.original_name}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                        Semantic Debugger & Chunk Manager
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden">
                            {exploringFile && <RAGExplorer file={exploringFile} onClose={() => setExploringFile(null)} />}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

function RAGExplorer({ file }: { file: AppFile, onClose: () => void }) {
    const { user } = useUser();
    const { accentColor } = useTheme();
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [loading, setLoading] = useState(true);
    const [testQuery, setTestQuery] = useState('');
    const [testResults, setTestResults] = useState<Chunk[]>([]);
    const [testing, setTesting] = useState(false);
    const [editingChunk, setEditingChunk] = useState<Chunk | null>(null);

    const fetchChunks = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/v1/ai/files/${file.id}/chunks?userId=${user?.id}`);
            setChunks(data);
        } catch (e) {
            toast.error("Failed to load chunks");
        } finally {
            setLoading(false);
        }
    }, [file.id, user?.id]);

    useEffect(() => {
        fetchChunks();
    }, [fetchChunks]);

    const runTest = async () => {
        if (!testQuery.trim() || !user?.id) return;
        setTesting(true);
        try {
            const { data } = await axios.post(`${API_URL}/api/v1/ai/files/${file.id}/test-query`, {
                query: testQuery,
                userId: user.id,
                limit: 5
            });
            setTestResults(data.results);
        } catch (e) {
            toast.error("Semantic search failed");
        } finally {
            setTesting(false);
        }
    };

    const deleteChunk = async (id: string) => {
        if (!confirm("Are you sure? This will remove this specific memory from the agent.")) return;
        try {
            await axios.delete(`${API_URL}/api/v1/ai/chunks/${id}?userId=${user?.id}`);
            toast.success("Chunk deleted");
            setChunks(prev => prev.filter(c => c.id !== id));
            setTestResults(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            toast.error("Failed to delete chunk");
        }
    }

    const saveChunk = async () => {
        if (!editingChunk || !user?.id) return;
        try {
            await axios.patch(`${API_URL}/api/v1/ai/chunks/${editingChunk.id}`, {
                content: editingChunk.content,
                userId: user.id
            });
            toast.success("Chunk updated");
            setChunks(prev => prev.map(c => c.id === editingChunk.id ? editingChunk : c));
            setTestResults(prev => prev.map(c => c.id === editingChunk.id ? editingChunk : c));
            setEditingChunk(null);
        } catch (e) {
            toast.error("Failed to update chunk");
        }
    }

    return (
        <div className="flex h-full divide-x dark:divide-slate-800">
            {/* Left: Chunk List */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Knowledge Base Chunks ({chunks.length})</span>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
                    ) : chunks.map(chunk => (
                        <div key={chunk.id} className="group p-3 rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono text-slate-400">INDEX #{chunk.chunk_index}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon-xs" variant="ghost" onClick={() => setEditingChunk(chunk)}><Edit3 className="h-3 w-3" /></Button>
                                    <Button size="icon-xs" variant="ghost" className="text-red-500" onClick={() => deleteChunk(chunk.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">{chunk.content}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Debugger */}
            <div className="w-[400px] flex flex-col bg-slate-50/30 dark:bg-slate-900/30">
                <div className="p-4 border-b dark:border-slate-800">
                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                        <Search className="h-4 w-4 text-blue-500" />
                        Semantic Search Test
                    </h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a query to test retrieval..."
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && runTest()}
                            className="flex-1 text-xs bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-md px-3 py-2 outline-none focus:ring-2 ring-blue-500/20"
                        />
                        <Button size="sm" onClick={runTest} disabled={testing}>
                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {testResults.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                            <Search className="h-8 w-8 mb-2" />
                            <p className="text-xs">No test results yet.<br/>Type above to see which chunks<br/>match your query.</p>
                        </div>
                    ) : (
                        testResults.map((result, idx) => (
                            <div key={result.id} className="p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 relative">
                                <div className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {idx + 1}
                                </div>
                                <div className="flex items-center justify-between mb-1 ml-4">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">SIMILARITY: {(result.similarity! * 100).toFixed(1)}%</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal line-clamp-3">{result.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CHUNK EDITOR MODAL */}
            <Dialog open={!!editingChunk} onOpenChange={(open) => !open && setEditingChunk(null)}>
                <DialogContent className="w-full max-w-2xl rounded-[32px] border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 p-0 overflow-hidden">
                    <div className="p-10 space-y-8">
                        <DialogHeader className="space-y-1.5 text-left">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                                    Edit Chunk #{editingChunk?.chunk_index}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-5">
                                Modify vector memory content directly
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <textarea
                                className="w-full h-80 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-primary-color/20 transition-all outline-none"
                                value={editingChunk?.content || ''}
                                onChange={(e) => editingChunk && setEditingChunk({ ...editingChunk, content: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4">
                            <Button 
                                variant="ghost" 
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-400" 
                                onClick={() => setEditingChunk(null)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all text-white border-none"
                                style={{ 
                                    backgroundColor: accentColor, 
                                    boxShadow: `${accentColor}40 0px 12px 32px` 
                                }}
                                onClick={saveChunk}
                            >
                                <Save className="h-5 w-5 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-component for fetching and displaying text content
function FileContentPreview({ file }: { file: AppFile }) {
    const [content, setContent] = useState<string>('Loading content...');

    useEffect(() => {
        const loadContent = async () => {
            try {
                // If it's a known text type, fetch text. Otherwise show placeholder.
                if (file.mime_type.startsWith('text/') || file.mime_type.includes('json') || file.mime_type.includes('javascript') || file.mime_type.includes('xml')) {
                    const response = await fetch(`${API_URL}/api/v1/files/${file.id}/content`);
                    const text = await response.text();
                    setContent(text);
                } else {
                    setContent(`Preview not available for ${file.mime_type}. \nBut don't worry, it's safe in the database.`);
                }
            } catch (e) {
                setContent('Failed to load file content.');
            }
        };
        loadContent();
    }, [file]);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 overflow-auto">
            <pre className="font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-300 whitespace-pre-wrap select-text">
                {content}
            </pre>
        </div>
    );
}
