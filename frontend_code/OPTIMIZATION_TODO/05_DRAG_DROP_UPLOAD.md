# TODO #5: Drag & Drop File Upload

**Priority:** MEDIUM | **Effort:** Medium (2-3 weeks) | **Impact:** Modern file upload UX across modules

---

## 🎯 Objective
Implement drag-and-drop file upload with progress, validation, preview, and multi-file support across all modules.

---

## 📍 Current State

### Current Upload Components
| Module | Component | Current State |
|--------|-----------|---------------|
| **documents** | `UploadButton` | Basic click-to-upload |
| **projects** | `UploadButton` in DocumentsPage | Basic click-to-upload |
| **profile** | Avatar upload | Hidden input + click |
| **sales** | Client attachments | Not implemented |
| **admin** | Organization logo | Hidden input + click |

**All uploads use basic `<input type="file">` with click trigger. No drag-drop, no progress, no multi-file.**

---

## 📂 Where to Implement

### 1. Shared Upload Components
```
src/shared/components/upload/
├── DropZone.tsx               # Main drag-drop zone
├── FilePreview.tsx            # File preview (image/pdf/office)
├── UploadQueue.tsx            # Upload queue with progress
├── FileList.tsx               # Uploaded files list
├── useFileUpload.ts           # Upload logic hook
├── useDragDrop.ts             # Drag-drop logic
└── types.ts                   # Upload types
```

### 2. Module Integration Points
```
src/modules/*/components/
├── documents/
│   └── DocumentUpload.tsx     # Replace UploadButton
├── profile/
│   └── AvatarUpload.tsx       # Replace hidden input
├── projects/
│   └── DocumentUpload.tsx     # Replace UploadButton
├── sales/
│   └── ClientAttachments.tsx  # New component
└── admin/
    └── LogoUpload.tsx         # New component
```

---

## 🔧 What Should Be Done

### 1. Core Types
```typescript
// src/shared/components/upload/types.ts
interface UploadFile {
  id: string;
  file: File;
  preview?: string; // Object URL for images
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number; // 0-100
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // for video/audio
  };
}

interface UploadConfig {
  accept?: string; // MIME types
  maxFiles?: number;
  maxSize?: number; // bytes
  minSize?: number;
  multiple?: boolean;
  directory?: boolean; // allow folder upload
}

interface UploadResult {
  id: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}
```

### 2. Drag-Drop Hook
```typescript
// src/shared/components/upload/useDragDrop.ts
interface UseDragDropOptions {
  onFilesDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function useDragDrop({
  onFilesDrop,
  accept,
  multiple = true,
  disabled = false,
}: UseDragDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    // Filter by accept
    const validFiles = accept 
      ? files.filter(f => accept.split(',').some(a => f.type.match(a.trim())))
      : files;
    
    if (validFiles.length > 0) {
      onFilesDrop(validFiles);
    }
  }, [disabled, accept, onFilesDrop]);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('drop', handleDrop);
    
    return () => {
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return { dropRef, isDragOver };
}
```

### 3. File Upload Hook
```typescript
// src/shared/components/upload/useFileUpload.ts
interface UseFileUploadOptions {
  endpoint: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  getAuthToken?: () => string;
  onProgress?: (fileId: string, progress: number) => void;
  onComplete?: (fileId: string, result: UploadResult) => void;
  onError?: (fileId: string, error: Error) => void;
  concurrency?: number; // parallel uploads
  autoUpload?: boolean;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [queue, setQueue] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending',
      progress: 0,
    }));
    
    setQueue(prev => [...prev, ...newFiles]);
    
    if (options.autoUpload) {
      uploadAll(newFiles.map(f => f.id));
    }
  }, [options.autoUpload]);

  const removeFile = useCallback((id: string) => {
    setQueue(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const uploadFile = useCallback(async (file: UploadFile) => {
    setQueue(prev => prev.map(f => f.id === file.id ? { ...f, status: 'uploading' } : f));
    
    const formData = new FormData();
    formData.append('file', file.file);
    
    try {
      const response = await fetchWithProgress(options.endpoint, {
        method: options.method ?? 'POST',
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${options.getAuthToken?.() ?? ''}`,
        },
        body: formData,
        onProgress: (progress) => {
          setQueue(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
          options.onProgress?.(file.id, progress);
        },
      });
      
      const result = await response.json();
      
      setQueue(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
      ));
      
      options.onComplete?.(file.id, result);
      return result;
    } catch (error) {
      setQueue(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'error', error: error.message } : f
      ));
      options.onError?.(file.id, error);
      throw error;
    }
  }, [options]);

  const uploadAll = useCallback(async (ids: string[]) => {
    setUploading(true);
    const queue = ids.map(id => queue.find(f => f.id === id)).filter(Boolean) as UploadFile[];
    
    // Concurrency control
    const concurrency = options.concurrency ?? 3;
    for (let i = 0; i < queue.length; i += concurrency) {
      const batch = queue.slice(i, i + concurrency);
      await Promise.all(batch.map(uploadFile));
    }
    
    setUploading(false);
  }, [queue, options]);

  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(f => f.status !== 'completed'));
  }, []);

  const retry = useCallback((id: string) => {
    const file = queue.find(f => f.id === id);
    if (file?.status === 'error') {
      uploadFile({ ...file, status: 'pending', progress: 0, error: undefined });
    }
  }, [queue, uploadFile]);

  return {
    queue,
    uploading,
    addFiles,
    removeFile,
    uploadFile,
    uploadAll,
    clearCompleted,
    retry,
  };
}

// Helper for fetch with progress
async function fetchWithProgress(url: string, options: RequestInit & { onProgress?: (progress: number) => void }) {
  const response = await fetch(url, options);
  
  if (!response.body) return response;
  
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;
  
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.length;
        controller.enqueue(value);
        options.onProgress?.(total > 0 ? Math.round((loaded / total) * 100) : 0);
      }
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}
```

---

## 🎨 DropZone Component
```tsx
// src/shared/components/upload/DropZone.tsx
interface DropZoneProps {
  files: UploadFile[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onFileRetry: (id: string) => void;
  config?: UploadConfig;
  showPreview?: boolean;
  compact?: boolean;
  className?: string;
  dropZoneLabel?: string;
  dropZoneIcon?: React.ReactNode;
}

export function DropZone({
  files,
  onFilesAdd,
  onFileRemove,
  onFileRetry,
  config = {},
  showPreview = true,
  compact = false,
  className,
  dropZoneLabel = 'Drag & drop files here, or click to browse',
  dropZoneIcon,
}: DropZoneProps) {
  const { dropRef, isDragOver } = useDragDrop({
    onFilesAdd,
    accept: config.accept,
    multiple: config.multiple,
    disabled: config.maxFiles && files.length >= (config.maxFiles ?? Infinity),
  });

  const validFiles = files.filter(f => f.status !== 'completed' || showPreview);

  return (
    <div
      ref={dropRef}
      className={cn(
        'relative rounded-xl border-2 transition-colors',
        'border-dashed border-outline-variant',
        'bg-surface-container-lowest',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
        isDragOver && 'border-secondary bg-secondary/5',
        'cursor-pointer'
      )}
      onClick={() => !dropRef.current?.querySelector('input')?.click()}
      tabIndex={0}
      role="button"
      aria-label={dropZoneLabel}
      onKeyDown={(e) => e.key === 'Enter' && dropRef.current?.querySelector('input')?.click()}
    >
      <input
        type="file"
        multiple={config.multiple}
        accept={config.accept}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => e.target.files && onFilesAdd(Array.from(e.target.files))}
        onClick={(e) => e.stopPropagation()}
        disabled={config.maxFiles && files.length >= (config.maxFiles ?? Infinity)}
      />
      
      <div className="p-8 text-center">
        {dropZoneIcon || (
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
            cloud_upload
          </span>
        )}
        <p className="text-body-md text-on-surface">{dropZoneLabel}</p>
        <p className="text-body-sm text-on-surface-variant mt-1">
          {config.accept ? `Accepted: ${config.accept}` : 'All file types'}
          {config.maxSize && ` · Max ${formatFileSize(config.maxSize)}`}
          {config.maxFiles && ` · Max ${config.maxFiles} files`}
        </p>
      </div>

      {!compact && files.length > 0 && (
        <FileList
          files={files}
          onRemove={onFileRemove}
          onRetry={onFileRetry}
          showPreview={showPreview}
        />
      )}
    </div>
  );
}
```

---

## 🎨 FileList & Preview Components

### FileList Component
```tsx
// src/shared/components/upload/FileList.tsx
interface FileListProps {
  files: UploadFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  showPreview?: boolean;
  compact?: boolean;
}

export function FileList({ files, onRemove, onRetry, showPreview = true, compact = false }) {
  return (
    <div className={cn('mt-4 space-y-2', compact && 'space-y-1')}>
      {files.map(file => (
        <FileRow
          key={file.id}
          file={file}
          onRemove={() => onRemove(file.id)}
          onRetry={() => onRetry(file.id)}
          showPreview={showPreview}
          compact={compact}
        />
      ))}
    </div>
  );
}

function FileRow({ file, onRemove, onRetry, showPreview, compact }) {
  const isImage = file.file.type.startsWith('image/');
  const isPdf = file.file.type === 'application/pdf';
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-lowest',
      compact && 'py-2 px-2 text-sm',
      file.status === 'error' && 'border-error/30 bg-error/5',
      file.status === 'uploading' && 'border-secondary/30 bg-secondary/5'
    )}>
      {showPreview && isImage && file.preview && (
        <img src={file.preview} alt={file.file.name} className="w-12 h-12 rounded object-cover" />
      )}
      {showPreview && !isImage && (
        <div className="w-12 h-12 rounded flex items-center justify-center bg-surface-container">
          <span className="material-symbols-outlined text-secondary">
            {isImage ? 'image' : isPdf ? 'picture_as_pdf' : 'insert_drive_file'}
          </span>
        )}
      }
      
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', compact && 'text-sm')}>{file.file.name}</p>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
          <span>{formatFileSize(file.file.size)}</span>
          {file.status === 'uploading' && (
            <>
              <ProgressBar value={file.progress} className="w-24" />
              <span>{file.progress}%</span>
            </>
          }
          {file.status === 'error' && (
            <span className="text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {file.error}
            </span>
          )}
          {file.status === 'completed' && (
            <span className="text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Done
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {file.status === 'error' && (
          <button onClick={onRetry} className="p-1.5 rounded hover:bg-surface-container text-error" aria-label="Retry">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        )}
        <button onClick={onRemove} className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" aria-label="Remove">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}
```

### ProgressBar Component
```tsx
// src/shared/components/upload/ProgressBar.tsx
interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'secondary' | 'error';
}

export function ProgressBar({ value, className, showLabel, color = 'primary' }: ProgressBarProps) {
  return (
    <div className={cn('relative h-1.5 rounded-full bg-surface-container overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-out',
          color === 'primary' && 'bg-secondary',
          color === 'secondary' && 'bg-primary',
          color === 'error' && 'bg-error'
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-on-primary">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
```

---

## 📂 Module Integration Examples

### 1. Documents Module
```tsx
// src/modules/documents/components/DocumentUpload.tsx
export function DocumentUpload({ onUpload, ...props }) {
  const { queue, addFiles, removeFile, uploadFile, uploading } = useFileUpload({
    endpoint: '/api/documents/upload',
    getAuthToken: () => getAuthToken(),
    autoUpload: true,
    concurrency: 3,
    onComplete: (id, result) => onUpload?.(result),
  });

  return (
    <DropZone
      files={queue}
      onFilesAdd={addFiles}
      onFileRemove={removeFile}
      onFileRetry={(id) => uploadFile(queue.find(f => f.id === id)!)}
      config={{
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
        maxFiles: 10,
        maxSize: 50 * 1024 * 1024, // 50MB
        multiple: true,
      }}
      dropZoneLabel="Drag & drop documents, or click to browse"
      dropZoneIcon={<span className="material-symbols-outlined text-4xl text-secondary">description</span>}
    />
  );
}
```

### 2. Profile Avatar Upload
```tsx
// src/modules/profile/components/AvatarUpload.tsx
export function AvatarUpload({ onUpload, currentAvatar, ...props }) {
  const { queue, addFiles, removeFile, uploadFile } = useFileUpload({
    endpoint: '/api/profile/avatar',
    getAuthToken: () => getAuthToken(),
    autoUpload: true,
    maxFiles: 1,
    onComplete: (id, result) => onUpload?.(result),
  });

  return (
    <div className="relative">
      {queue[0]?.preview ? (
        <img src={queue[0].preview} className="w-28 h-28 rounded-full" />
      ) : currentAvatar ? (
        <img src={currentAvatar} className="w-28 h-28 rounded-full" />
      ) : (
        <div className="w-28 h-28 rounded-full bg-secondary/15 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-secondary">person</span>
        </div>
      )}
      
      <DropZone
        files={queue}
        onFilesAdd={addFiles}
        onFileRemove={removeFile}
        config={{
          accept: 'image/*',
          maxFiles: 1,
          maxSize: 5 * 1024 * 1024,
        }}
        dropZoneLabel="Drag & drop photo, or click to browse"
        compact
        showPreview={false}
      />
    </div>
  );
}
```

### 3. Sales Client Attachments
```tsx
// src/modules/sales/components/ClientAttachments.tsx
export function ClientAttachments({ clientId, ...props }) {
  const { queue, addFiles, removeFile, uploadFile, uploading } = useFileUpload({
    endpoint: `/api/sales/clients/${clientId}/attachments`,
    getAuthToken: () => getAuthToken(),
    autoUpload: true,
    concurrency: 2,
  });

  return (
    <div className="space-y-4">
      <DropZone
        files={queue}
        onFilesAdd={addFiles}
        onFileRemove={removeFile}
        onFileRetry={(id) => uploadFile(queue.find(f => f.id === id)!)}
        config={{
          accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
          maxFiles: 20,
          maxSize: 25 * 1024 * 1024,
          multiple: true,
        }}
        dropZoneLabel="Drag & drop attachments, or click to browse"
      />
      
      {uploading && (
        <div className="text-sm text-on-surface-variant">
          Uploading {queue.filter(f => f.status === 'uploading').length} files...
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Migration Checklist

### Core Components
- [ ] `DropZone.tsx` with drag-drop, click, keyboard
- [ ] `FileList.tsx` + `FileRow` with progress
- [ ] `FilePreview.tsx` (image/pdf/office)
- [ ] `ProgressBar.tsx`
- [ ] `useDragDrop.ts` hook
- [ ] `useFileUpload.ts` hook with progress
- [ ] Type definitions

### Module Integration
- [ ] Documents: Replace `UploadButton` → `DocumentUpload`
- [ ] Profile: Replace avatar input → `AvatarUpload`
- [ ] Projects: Replace `UploadButton` → `DocumentUpload`
- [ ] Sales: New `ClientAttachments` component
- [ ] Admin: New `LogoUpload` component
- [ ] Admin: New `AvatarUpload` for users

### Validation & UX
- [ ] File type validation (MIME + extension)
- [ ] File size limits (per file + total)
- [ ] File count limits
- [ ] Image preview generation
- [ ] PDF thumbnail generation
- [ ] Drag-over visual feedback
- [ ] Keyboard accessibility (Enter/Space to open, Escape to cancel)
- [ ] Screen reader announcements
- [ ] Focus management

### Progress & Error Handling
- [ ] Real-time progress (XHR/Fetch streams)
- [ ] Pause/resume/cancel uploads
- [ ] Retry failed uploads
- [ ] Concurrent upload limit
- [ ] Error display with retry button
- [ ] Auto-retry on network error
- [ ] Cancel all uploads

### Advanced
- [ ] Chunked upload for large files (>100MB)
- [ ] Resume interrupted uploads
- [ ] Folder upload (directory)
- [ ] Paste from clipboard (images)
- [ ] Camera capture (mobile)
- [ ] Image compression before upload
- [ ] Virus scanning integration

---

## 📋 Acceptance Criteria

- [ ] Drag files from desktop → upload starts
- [ ] Click dropzone → file picker opens
- [ ] Multiple files → all added to queue
- [ ] Progress bar updates in real-time
- [ ] Completed files show success state
- [ ] Failed files show error + retry
- [ ] Remove file from queue
- [ ] Retry failed upload
- [ ] Max file size enforced
- [ ] Max file count enforced
- [ ] Accepted types enforced
- [ ] Works on mobile (touch)
- [ ] Keyboard accessible
- [ ] Screen reader compatible

---

## 📝 Future Enhancements

- [ ] Chunked upload for >100MB files
- [ ] Resume interrupted uploads
- [ ] Folder upload (webkitdirectory)
- [ ] Paste from clipboard (Ctrl+V)
- [ ] Camera capture (mobile)
- [ ] Image compression (client-side)
- [ ] OCR for scanned documents
- [ ] Virus scanning webhook