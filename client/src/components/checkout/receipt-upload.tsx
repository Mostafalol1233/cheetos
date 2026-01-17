import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReceiptUploadProps {
    onUpload: (file: File) => void;
    onRemove: () => void;
    currentFile?: File | null;
    className?: string;
}

export function ReceiptUpload({ onUpload, onRemove, currentFile, className }: ReceiptUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            onUpload(file);
        }
    }, [onUpload]);

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        onRemove();
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
        multiple: false
    });

    return (
        <div className={cn("w-full", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out cursor-pointer overflow-hidden group min-h-[200px] flex items-center justify-center",
                    isDragActive ? "border-cyber-blue bg-cyber-blue/5" : "border-muted-foreground/20 hover:border-cyber-blue/50 hover:bg-muted/50",
                    preview ? "border-solid border-cyber-blue/50" : ""
                )}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {preview ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full h-full flex flex-col items-center"
                        >
                            <div className="relative max-w-full max-h-[300px] rounded-lg overflow-hidden shadow-lg border border-white/10">
                                <img
                                    src={preview}
                                    alt="Receipt preview"
                                    className="max-w-full h-auto object-contain"
                                />

                                {/* Overlay Actions */}
                                <div className="absolute top-2 right-2">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
                                        onClick={removeFile}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 flex items-center justify-center gap-2 text-white text-sm">
                                    <CheckCircle className="w-4 h-4 text-electric-green" />
                                    Receipt Uploaded
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground text-center">
                                Click or drag to replace
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors",
                                isDragActive ? "bg-cyber-blue/20 text-cyber-blue" : "bg-muted text-muted-foreground group-hover:bg-cyber-blue/10 group-hover:text-cyber-blue"
                            )}>
                                {isDragActive ? (
                                    <Upload className="w-8 h-8 animate-bounce" />
                                ) : (
                                    <ImageIcon className="w-8 h-8" />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">
                                Upload Payment Receipt
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-[240px] mx-auto mb-4">
                                Drag & drop your Screenshot/Photo here, or click to browse
                            </p>
                            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-white/5">
                                <FileText className="w-3 h-3" />
                                Supports JPG, PNG, WebP
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
