import { useRef, useState } from 'react';
import { uploadImage } from '@/services/upload.service';
import { toast } from '@/hooks/useToast';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ProductImageUploader({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadImage({
        file,
        purpose: 'product',
        onProgress: setProgress,
      });
      const url = res.publicUrl || res.objectKey;
      onChange(url);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error((e as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
        Product image
      </span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragging
            ? 'border-brand-400 bg-brand-500/10'
            : 'border-white/10 bg-white/[.02] hover:border-white/20'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {value ? (
          <div className="relative aspect-square w-full max-w-[240px]">
            <img
              src={value}
              alt="Product"
              className="h-full w-full rounded-xl object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/70 text-sm text-white backdrop-blur transition hover:bg-black/90"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="text-3xl">🖼️</span>
            <p className="text-[12.5px] font-bold text-white">
              {uploading ? `Uploading… ${progress}%` : 'Click or drag to upload'}
            </p>
            <p className="text-[11px] font-medium text-ink-500">
              JPG, PNG, WebP · max 5MB
            </p>
          </div>
        )}

        {/* Upload progress overlay */}
        {uploading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-48">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {/* Manual URL fallback */}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="…or paste an image URL directly"
        disabled={disabled || uploading}
        className="mt-2 w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[12px] font-mono text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
      />
    </div>
  );
}
