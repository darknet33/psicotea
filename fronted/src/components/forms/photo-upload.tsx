"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/api/uploads";
import { getErrorMessage, resolveMediaUrl } from "@/lib/axios";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }

      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("No se pudo comprimir la imagen"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen"));
    };

    image.src = objectUrl;
  });
}

interface PhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  invalid?: boolean;
}

export function PhotoUpload({ value, onChange, invalid = false }: PhotoUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const preview = localPreview ?? (value ? resolveMediaUrl(value) : null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    const video = videoRef.current;
    if (cameraOpen && video && streamRef.current) {
      video.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("El archivo debe ser una imagen JPG, PNG o WEBP");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("La imagen supera el tamaño máximo permitido (5 MB)");
        return;
      }

      setUploading(true);

      try {
        const compressed = await compressImage(file);
        const url = await uploadImage(
          new File([compressed], "photo.jpg", { type: "image/jpeg" }),
        );
        onChange(url);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  function handleSelectFile(file: File | undefined) {
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    void handleUpload(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleSelectFile(event.dataTransfer.files?.[0]);
  }

  async function handleOpenCamera() {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      captureInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("No se pudo acceder a la cámara. Usando la cámara del dispositivo.");
      captureInputRef.current?.click();
    }
  }

  function handleCaptureFromVideo() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0);
    stopCamera();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("No se pudo capturar la foto");
          return;
        }
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        handleSelectFile(file);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  }

  function handleClear() {
    setLocalPreview(null);
    setError(null);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona para soltar o seleccionar la foto del niño"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          isDragging ? "border-primary bg-muted" : "border-input",
          invalid && "border-destructive",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Previsualización de la foto del niño"
            className="max-h-48 rounded-md object-contain"
          />
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arrastra una imagen o haz clic para buscar
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG o WEBP (máx. 5 MB)</p>
          </>
        )}
        {uploading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Subiendo foto...
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          handleSelectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          handleSelectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => void handleOpenCamera()}
        >
          <Camera className="size-4" />
          Usar cámara
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={handleClear}
          >
            <X className="size-4" />
            Quitar
          </Button>
        )}
      </div>

      {cameraOpen && (
        <div className="space-y-2 rounded-lg border p-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-md"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCaptureFromVideo}>
              Capturar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {cameraError && <p className="text-sm text-error">{cameraError}</p>}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
