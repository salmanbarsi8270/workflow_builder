import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { FileIcon, Trash2, Upload, Download, Loader2, Image as ImageIcon, FileText, Database, Search, Edit3, X as CloseIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '@/ui_components/api/apiurl';

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
    const [files, setFiles] = useState<AppFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

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

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!user?.id) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('userId', user.id);

        // Upload one by one for now to handle errors individually
        for (const file of acceptedFiles) {
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
        fetchFiles();
    }, [user?.id, fetchFiles]);

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
        <div className="p-8 h-full flex flex-col gap-6 w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">FILE MANAGER</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your uploaded assets and documents.</p>
            </div>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                </div>
                <div className="text-center">
                    <p className="font-bold text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-500">SVG, PNG, JPG or PDF (max. 10MB)</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
            ) : files.length === 0 ? (
                <div className="text-center p-12 text-slate-400 font-medium">No files uploaded yet.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                    {files.map(file => (
                        <Card key={file.id} className="group overflow-hidden hover:shadow-lg transition-all dark:bg-slate-900/50 dark:border-slate-800">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className="shrink-0 pt-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewFile(file)}>
                                    {getFileIcon(file.mime_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate cursor-pointer hover:text-blue-500 transition-colors" title={file.original_name} onClick={() => setPreviewFile(file)}>{file.original_name}</p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <span>{formatSize(file.size)}</span>
                                        <span>•</span>
                                        <span title={new Date(file.created_at).toLocaleString()}>{new Date(file.created_at).toLocaleString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                        {file.chunk_count > 0 && (
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-[4px] font-bold text-[10px]">
                                                CHUNKS: {file.chunk_count}
                                            </span>
                                        )}
                                    </p>

                                    <div className="flex items-center gap-1 mt-4 flex-wrap">
                                        <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-blue-500 ml-auto" onClick={() => downloadFile(file.id, file.original_name)}>
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                        {file.chunk_count > 0 && (
                                            <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-amber-500" onClick={() => setExploringFile(file)} title="Explore RAG Chunks">
                                                <Database className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteFile(file.id, file.original_name)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* PREVIEW DIALOG */}
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPreviewFile(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="font-bold truncate">{previewFile.original_name}</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Read Only Preview</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setPreviewFile(null)}><CloseIcon className="h-4 w-4" /></Button>
                        </div>
                        {/* Block Right Click to discourage saving */}
                        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center relative" onContextMenu={(e) => e.preventDefault()}>
                            {previewFile.mime_type.startsWith('image/') ? (
                                <img src={`${API_URL}/api/v1/files/${previewFile.id}/content`} alt={previewFile.original_name} className="max-w-full max-h-full object-contain shadow-lg pointer-events-none select-none" />
                            ) : previewFile.mime_type === 'application/pdf' ? (
                                <iframe
                                    src={`${API_URL}/api/v1/files/${previewFile.id}/content#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-full bg-white border-none shadow-lg rounded-md"
                                    title="File Preview"
                                />
                            ) : (
                                /* Text/Code Preview - Fetch and Render */
                                <FileContentPreview file={previewFile} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* RAG EXPLORER DIALOG */}
            {exploringFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setExploringFile(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold truncate">RAG EXPLORER: {exploringFile.original_name}</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Semantic Debugger & Chunk Manager</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setExploringFile(null)}><CloseIcon className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <RAGExplorer file={exploringFile} onClose={() => setExploringFile(null)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RAGExplorer({ file, onClose }: { file: AppFile, onClose: () => void }) {
    const { user } = useUser();
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
            {editingChunk && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold">Edit Chunk #{editingChunk.chunk_index}</h3>
                            <Button size="sm" variant="ghost" onClick={() => setEditingChunk(null)}><CloseIcon className="h-4 w-4" /></Button>
                        </div>
                        <div className="p-6">
                            <textarea
                                className="w-full h-64 p-4 text-sm bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg outline-none focus:ring-2 ring-blue-500/20 resize-none font-mono"
                                value={editingChunk.content}
                                onChange={(e) => setEditingChunk({ ...editingChunk, content: e.target.value })}
                            />
                        </div>
                        <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                            <Button variant="outline" onClick={() => setEditingChunk(null)}>Cancel</Button>
                            <Button onClick={saveChunk}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}
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
