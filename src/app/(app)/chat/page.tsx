"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { processOCRImage } from "@/actions/ocrActions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatProvider = "gemini" | "hf" | "openrouter";

type TextMessagePart = {
  text: string;
  type: "text";
};

function isTextMessagePart(part: unknown): part is TextMessagePart {
  if (!part || typeof part !== "object") {
    return false;
  }

  const candidate = part as { text?: unknown; type?: unknown };
  return candidate.type === "text" && typeof candidate.text === "string";
}

export default function ChatAI() {
  const [inferenceProvider, setInferenceProvider] = useState<ChatProvider>("openrouter");
  const [inputValue, setInputValue] = useState("");
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(
    null,
  );
  const [selectedImageSource, setSelectedImageSource] = useState<"upload" | "camera" | null>(
    null,
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          inferenceProvider,
        },
      }),
    [inferenceProvider],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const isLoading = status !== "ready";

  function clearSelectedImage() {
    setSelectedImage(null);
    setSelectedImageSource(null);
    setOcrError(null);
    setCameraError(null);

    setSelectedImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function setImageAttachment(file: File, source: "upload" | "camera") {
    setSelectedImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(file);
    });

    setSelectedImage(file);
    setSelectedImageSource(source);
    setOcrError(null);
  }

  function stopCamera() {
    const stream = cameraStreamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  async function openCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch (cameraOpenError) {
      setCameraError(
        cameraOpenError instanceof Error
          ? cameraOpenError.message
          : "Could not access camera.",
      );
    }
  }

  async function captureFromCamera() {
    const videoElement = videoRef.current;
    const canvasElement = captureCanvasRef.current;

    if (!videoElement || !canvasElement) {
      setCameraError("Camera is not ready.");
      return;
    }

    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    if (width <= 0 || height <= 0) {
      setCameraError("Camera feed is not ready yet. Try again.");
      return;
    }

    canvasElement.width = width;
    canvasElement.height = height;
    const context = canvasElement.getContext("2d");
    if (!context) {
      setCameraError("Could not capture camera frame.");
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasElement.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setCameraError("Could not capture image from camera.");
      return;
    }

    const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
    const capturedFile = new File([blob], `camera-${timestamp}.jpg`, {
      type: "image/jpeg",
    });

    setImageAttachment(capturedFile, "camera");
    stopCamera();
  }

  useEffect(() => {
    const stream = cameraStreamRef.current;
    if (!cameraOpen || !stream || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => {
      // Ignore autoplay rejections; user can still capture after manual interaction.
    });
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
      setSelectedImagePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
    };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!inputValue.trim() && !selectedImage) || isLoading || ocrPending) {
      return;
    }

    let composedPrompt = inputValue.trim();

    if (selectedImage) {
      setOcrPending(true);
      setOcrError(null);

      try {
        const ocrFormData = new FormData();
        ocrFormData.append("file", selectedImage);
        const ocrText = await processOCRImage(ocrFormData);
        const trimmedOcrText = ocrText.replace(/\s+/g, " ").trim().slice(0, 8000);

        composedPrompt = [
          composedPrompt,
          "[Image OCR Context]",
          `Image: ${selectedImage.name}`,
          trimmedOcrText,
        ]
          .filter((part) => part.length > 0)
          .join("\n\n");
      } catch (ocrProcessingError) {
        setOcrError(
          ocrProcessingError instanceof Error
            ? ocrProcessingError.message
            : "OCR failed for the selected image.",
        );
        setOcrPending(false);
        return;
      } finally {
        setOcrPending(false);
      }
    }

    if (!composedPrompt.trim()) {
      setOcrError("No text extracted from the selected image.");
      return;
    }

    sendMessage({ text: composedPrompt });
    setInputValue("");
    clearSelectedImage();
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[85vh] py-8">
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <span className="bg-blue-600 text-white rounded-full p-2 h-10 w-10 inline-flex items-center justify-center">
            ⲁ
          </span>
          Shenute AI
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-slate-500">Coptic Scholar</p>
          <label className="text-xs text-slate-600 dark:text-slate-300">
            <span className="mr-2">Provider</span>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
              value={inferenceProvider}
              onChange={(event) =>
                setInferenceProvider(
                  event.target.value === "gemini"
                    ? "gemini"
                    : event.target.value === "hf"
                      ? "hf"
                      : "openrouter",
                )
              }
              disabled={isLoading}
            >
              <option value="hf">Hugging Face</option>
              <option value="gemini">Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </label>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow text-center text-slate-500 mb-6">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
            <span className="text-2xl">📚</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Shenute AI</h2>
          <p className="max-w-sm">I&apos;m your dedicated Coptic language assistant. Ask me about vocabulary, grammar, translation, and history.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto w-full p-4 mb-4 space-y-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1222] shadow-inner font-sans">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-1 shadow-sm ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {m.role === 'user' ? 'U' : 'ⲁ'}
              </div>
              <div className={`py-3 px-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
              }`}>
                {Array.isArray(m.parts)
                  ? m.parts.filter(isTextMessagePart).map((part, index: number) => {
                      if (part.type !== "text") return null;
                      if (m.role === "assistant") {
                        return (
                          <ReactMarkdown
                            key={index}
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline"
                                />
                              ),
                              code: ({ className, children, ...props }) => (
                                <code
                                  className={`rounded bg-slate-200/70 px-1 py-0.5 text-[0.95em] dark:bg-slate-800 ${className || ""}`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {part.text}
                          </ReactMarkdown>
                        );
                      }

                      return <p key={index}>{part.text}</p>;
                    })
                  : <p>{typeof m.content === "string" ? m.content : ""}</p>}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 mr-auto max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">ⲁ</div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="px-4">
        {error ? (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || "AI request failed."}
          </div>
        ) : null}
        {ocrError ? (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {ocrError}
          </div>
        ) : null}
        {cameraError ? (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {cameraError}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              setImageAttachment(file, "upload");
            }
          }}
        />

        {cameraOpen ? (
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="mb-3 w-full rounded-lg border border-slate-300 dark:border-slate-700"
            />
            <canvas ref={captureCanvasRef} className="hidden" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void captureFromCamera();
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close Camera
              </button>
            </div>
          </div>
        ) : null}

        {selectedImagePreviewUrl ? (
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Image attached ({selectedImageSource === "camera" ? "camera" : "upload"})
              </p>
              <button
                type="button"
                onClick={clearSelectedImage}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <img
              src={selectedImagePreviewUrl}
              alt="Selected for OCR"
              className="max-h-48 w-auto rounded-lg border border-slate-200 dark:border-slate-700"
            />
          </div>
        ) : null}

        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            disabled={isLoading || ocrPending}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Add Image
          </button>
          <button
            type="button"
            onClick={() => {
              void openCamera();
            }}
            disabled={isLoading || ocrPending || cameraOpen}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Use Camera
          </button>
          {ocrPending ? (
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Running OCR...
            </p>
          ) : null}
        </div>

        <div className="relative flex items-center">
          <input
            className="w-full p-4 pr-16 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about a Coptic word, grammar rule, or attached image..."
            disabled={isLoading || ocrPending}
          />
          <button 
            type="submit" 
            disabled={(!inputValue.trim() && !selectedImage) || isLoading || ocrPending}
            className="absolute right-3 h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
