"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Camera,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  ScanText,
  SendHorizontal,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { processOCRImage } from "@/actions/ocrActions";
import {
  AuthGateInlinePrompt,
  AuthGateNotice,
} from "@/components/AuthGateNotice";
import { buttonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { cx } from "@/lib/classes";
import { useOptionalAuthGate } from "@/lib/supabase/useOptionalAuthGate";
import type { Language } from "@/types/i18n";

type ShenuteProvider = "gemini" | "hf" | "openrouter" | "thoth";

type TextMessagePart = {
  text: string;
  type: "text";
};

type ChatMessageLike = {
  content?: unknown;
  id: string;
  parts?: unknown;
  role: "assistant" | "system" | "user";
};

type ShenuteFeedbackSignal = "admin_feedback" | "dislike" | "like";
type ShenuteReactionSignal = Extract<ShenuteFeedbackSignal, "dislike" | "like">;

type FeedbackStateByMessage = Record<
  string,
  {
    message: string;
    status: "error" | "pending" | "success";
  }
>;

type PageContextPayload = {
  excerpt: string;
  path: string;
  title: string;
  url: string;
};

const floatingShenuteCopy = {
  en: {
    addImage: "Add image",
    adminNotePlaceholder:
      "Admin only: add written feedback tied to this prompt/response.",
    adminNoteTitle: "Admin note for RAG learning",
    camera: "Camera",
    cameraAccessFailed: "Could not access camera.",
    cameraFeedNotReady: "Camera feed is not ready yet. Try again.",
    cameraNotReady: "Camera is not ready.",
    cameraUnsupported: "Camera is not supported on this device/browser.",
    capture: "Capture",
    captureFailed: "Could not capture image from camera.",
    close: "Close",
    contextAware: "Context-aware on this page",
    details: "Project site",
    dislike: "Dislike",
    emptyPrompt:
      "Ask anything about this page, Coptic grammar, vocabulary, or translation.",
    feedbackFailed: "Could not save feedback.",
    imageAttached: "Image attached",
    imageContext: "Image OCR Context",
    imageFromCamera: "camera",
    imageFromUpload: "upload",
    inputPlaceholder: "Ask about this page or attached image...",
    like: "Like",
    noTextExtracted: "No text extracted from the selected image.",
    ocrFailed: "OCR failed for the selected image.",
    ocrPending: "OCR...",
    promptResolveFailed: "Could not resolve prompt/response for this feedback.",
    provider: "Provider",
    providerGemini: "Learner (Gemini)",
    providerHf: "Learner (HF)",
    providerOpenRouter: "Learner (OpenRouter)",
    providerThoth: "Expert (THOTH AI)",
    ragWarning: "RAG ingest warning:",
    removeImage: "Remove",
    requestFailed: "Request failed.",
    saved: "Saved.",
    savedRag: "Saved and added to RAG learning.",
    savingFeedback: "Saving feedback...",
    selectedForOcrAlt: "Selected for OCR",
    send: "Send",
    signInBody:
      "Sign in to use Shenute AI on this page, ask follow-up questions, and send OCR-backed prompts.",
    signInFeedback: "Sign in to send learning feedback signals",
    signInTitle: "Sign in required",
    submitAdminNote: "Submit admin note",
    thinking: "Thinking...",
    saveHistory: "Save chat history",
    savedHistory: "Chat history saved.",
    nmtCredit: "NMT powered by CopticTranslator.com / arXiv:2404.13813",
    writeAdminFeedback: "Write admin feedback before submitting.",
  },
  nl: {
    addImage: "Afbeelding",
    adminNotePlaceholder:
      "Alleen admin: voeg feedback toe bij deze prompt en dit antwoord.",
    adminNoteTitle: "Adminnotitie voor RAG-leren",
    camera: "Camera",
    cameraAccessFailed: "Geen toegang tot de camera.",
    cameraFeedNotReady: "De camerafeed is nog niet klaar. Probeer opnieuw.",
    cameraNotReady: "De camera is nog niet klaar.",
    cameraUnsupported:
      "Camera wordt niet ondersteund op dit apparaat of in deze browser.",
    capture: "Vastleggen",
    captureFailed: "Afbeelding kon niet uit de camera worden vastgelegd.",
    close: "Sluiten",
    contextAware: "Contextbewust op deze pagina",
    details: "Projectsite",
    dislike: "Niet goed",
    emptyPrompt:
      "Stel een vraag over deze pagina, Koptische grammatica, woordenschat of vertaling.",
    feedbackFailed: "Feedback kon niet worden opgeslagen.",
    imageAttached: "Afbeelding toegevoegd",
    imageContext: "OCR-context van afbeelding",
    imageFromCamera: "camera",
    imageFromUpload: "upload",
    inputPlaceholder: "Vraag over deze pagina of afbeelding...",
    like: "Goed",
    noTextExtracted:
      "Er is geen tekst uit de geselecteerde afbeelding gehaald.",
    ocrFailed: "OCR is mislukt voor de geselecteerde afbeelding.",
    ocrPending: "OCR...",
    promptResolveFailed:
      "Prompt en antwoord konden niet aan deze feedback worden gekoppeld.",
    provider: "Provider",
    providerGemini: "Leerling (Gemini)",
    providerHf: "Leerling (HF)",
    providerOpenRouter: "Leerling (OpenRouter)",
    providerThoth: "Expert (THOTH AI)",
    ragWarning: "RAG-invoerwaarschuwing:",
    removeImage: "Verwijderen",
    requestFailed: "Verzoek mislukt.",
    saved: "Opgeslagen.",
    savedRag: "Opgeslagen en toegevoegd aan RAG-leren.",
    savingFeedback: "Feedback opslaan...",
    selectedForOcrAlt: "Geselecteerd voor OCR",
    send: "Versturen",
    signInBody:
      "Meld u aan om Shenute AI op deze pagina te gebruiken, vervolgvragen te stellen en OCR-prompts te versturen.",
    signInFeedback: "Meld u aan om leersignalen te versturen",
    signInTitle: "Aanmelden vereist",
    submitAdminNote: "Adminnotitie versturen",
    thinking: "Denkt na...",
    saveHistory: "Chatgeschiedenis opslaan",
    savedHistory: "Chatgeschiedenis opgeslagen.",
    nmtCredit: "NMT mogelijk gemaakt door CopticTranslator.com / arXiv:2404.13813",
    writeAdminFeedback: "Schrijf adminfeedback voordat u die verstuurt.",
  },
} as const satisfies Record<Language, Record<string, string>>;

function isTextMessagePart(part: unknown): part is TextMessagePart {
  if (!part || typeof part !== "object") {
    return false;
  }

  const candidate = part as { text?: unknown; type?: unknown };
  return candidate.type === "text" && typeof candidate.text === "string";
}

function getMessageText(message: ChatMessageLike) {
  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (!Array.isArray(message.parts)) {
    return "";
  }

  return message.parts
    .filter(isTextMessagePart)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function findPreviousUserMessage(
  messages: ChatMessageLike[],
  startIndex: number,
) {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") {
      continue;
    }

    const text = getMessageText(message);
    if (text.length > 0) {
      return message;
    }
  }

  return null;
}

function formatChatHistory(messages: ChatMessageLike[], pageContext: PageContext, provider: ShenuteProvider) {
  const lines: string[] = [];
  lines.push("Shenute AI chat history");
  lines.push(`Page: ${pageContext.title || pageContext.path || "unknown"}`);
  lines.push(`URL: ${pageContext.url || "unknown"}`);
  lines.push(`Provider: ${provider}`);
  lines.push(`Saved: ${new Date().toISOString()}`);
  lines.push("");

  for (const message of messages) {
    let role = "System";
    if (message.role === "user") {
      role = "User";
    } else if (message.role === "assistant") {
      role = "Assistant";
    }

    const text = getMessageText(message) || "[no text]";
    lines.push(`${role}:`);
    lines.push(text);
    lines.push("");
  }

  return lines.join("\n");
}

function toShenuteProvider(value: string): ShenuteProvider {
  if (value === "gemini") {
    return "gemini";
  }

  if (value === "hf") {
    return "hf";
  }

  if (value === "openrouter") {
    return "openrouter";
  }

  if (value === "thoth") {
    return "thoth";
  }

  return "thoth";
}

function isDenseStudyRoute(pathname: string | null) {
  return Boolean(
    pathname && /(^|\/)(dictionary|entry|grammar)(?:\/|$)/.test(pathname),
  );
}

function getFeedbackStatusClass(status: "error" | "pending" | "success") {
  if (status === "error") {
    return "text-rose-700 dark:text-rose-300";
  }

  if (status === "pending") {
    return "text-stone-500 dark:text-stone-300";
  }

  return "text-emerald-700 dark:text-emerald-300";
}

function buildPageContext(pathname: string): PageContextPayload {
  if (typeof window === "undefined") {
    return {
      excerpt: "",
      path: pathname,
      title: "",
      url: "",
    };
  }

  const title = document.title?.trim() ?? "";
  const url = window.location.href;

  const mainText = document.querySelector("main")?.textContent ?? "";
  const bodyText = document.body?.textContent ?? "";
  const extractedText =
    mainText.replace(/\s+/g, " ").trim().length > 0 ? mainText : bodyText;
  const excerpt = extractedText.replace(/\s+/g, " ").trim().slice(0, 3500);

  return {
    excerpt,
    path: pathname,
    title,
    url,
  };
}

type FloatingAiAssistantPanelProps = {
  initialOpen?: boolean;
};

export function FloatingAiAssistantPanel({
  initialOpen = false,
}: FloatingAiAssistantPanelProps) {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const copy = floatingShenuteCopy[language];
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [inputValue, setInputValue] = useState("");
  const [inferenceProvider, setInferenceProvider] =
    useState<ShenuteProvider>("thoth");
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
    string | null
  >(null);
  const [selectedImageSource, setSelectedImageSource] = useState<
    "upload" | "camera" | null
  >(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const shenuteSessionIdRef = useRef(crypto.randomUUID());

  const { isAuthenticated, isReady } = useOptionalAuthGate();
  const [selectedReactionByMessage, setSelectedReactionByMessage] = useState<
    Record<string, ShenuteReactionSignal>
  >({});
  const [adminFeedbackDraftByMessage, setAdminFeedbackDraftByMessage] =
    useState<Record<string, string>>({});
  const [feedbackStateByMessage, setFeedbackStateByMessage] =
    useState<FeedbackStateByMessage>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const pageContext = useMemo(() => buildPageContext(pathname), [pathname]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/shenute",
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const isLoading = status !== "ready";
  const isShenuteAccessBlocked = isReady && !isAuthenticated;
  const typedMessages = messages as ChatMessageLike[];
  const floatingContainerClassName = cx(
    "fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-50 sm:bottom-5 sm:right-5",
    !isOpen && isDenseStudyRoute(pathname) && "hidden sm:block",
  );
  let conversationContent: ReactNode;

  if (isShenuteAccessBlocked) {
    conversationContent = (
      <div className="flex h-full items-center">
        <AuthGateNotice
          align="left"
          className="w-full"
          size="comfortable"
          title={copy.signInTitle}
        >
          {copy.signInBody}
        </AuthGateNotice>
      </div>
    );
  } else if (messages.length === 0) {
    conversationContent = (
      <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-3 py-4 text-sm leading-6 text-stone-600 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-stone-300">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm dark:bg-stone-900 dark:text-sky-300">
          <span className="font-coptic leading-none">Ϣ</span>
        </div>
        <p>{copy.emptyPrompt}</p>
      </div>
    );
  } else {
    conversationContent = messages.map((message, index) => {
      const assistantMessage = message as ChatMessageLike;
      const promptMessage =
        message.role === "assistant"
          ? findPreviousUserMessage(typedMessages, index)
          : null;
      const feedbackState = feedbackStateByMessage[message.id];
      const selectedReaction = selectedReactionByMessage[message.id];
      const adminDraft = adminFeedbackDraftByMessage[message.id] ?? "";
      const isFeedbackPending = feedbackState?.status === "pending";

      return (
        <article
          key={message.id}
          className={
            message.role === "user"
              ? "ml-8 rounded-2xl rounded-tr-sm bg-sky-600 px-3 py-2 text-sm text-white"
              : "mr-8 rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          }
        >
          {Array.isArray(message.parts)
            ? message.parts.filter(isTextMessagePart).map((part, partIndex) => {
                if (message.role === "assistant") {
                  return (
                    <ReactMarkdown
                      key={partIndex}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-700 underline dark:text-sky-300"
                          />
                        ),
                        code: ({ className, children, ...props }) => (
                          <code
                            className={`rounded bg-stone-200/70 px-1 py-0.5 text-[0.95em] dark:bg-stone-800 ${className || ""}`}
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

                return <p key={partIndex}>{part.text}</p>;
              })
            : null}

          {message.role === "assistant" ? (
            <div className="mt-2 space-y-2 border-t border-stone-200 pt-2 text-[11px] dark:border-stone-700">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label={copy.like}
                  onClick={() => {
                    void handleReaction(
                      "like",
                      assistantMessage,
                      promptMessage,
                    );
                  }}
                  disabled={!isAuthenticated || isFeedbackPending}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedReaction === "like"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.like}
                </button>
                <button
                  type="button"
                  aria-label={copy.dislike}
                  onClick={() => {
                    void handleReaction(
                      "dislike",
                      assistantMessage,
                      promptMessage,
                    );
                  }}
                  disabled={!isAuthenticated || isFeedbackPending}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedReaction === "dislike"
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      : "border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.dislike}
                </button>
              </div>

              <details className="rounded border border-stone-200 p-2 dark:border-stone-700">
                <summary className="cursor-pointer font-semibold text-stone-700 dark:text-stone-200">
                  {copy.adminNoteTitle}
                </summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    value={adminDraft}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAdminFeedbackDraftByMessage((current) => ({
                        ...current,
                        [message.id]: value,
                      }));
                    }}
                    placeholder={copy.adminNotePlaceholder}
                    rows={3}
                    disabled={!isAuthenticated || isFeedbackPending}
                    className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-[11px] text-stone-900 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleAdminFeedbackSubmit(
                        assistantMessage,
                        promptMessage,
                      );
                    }}
                    disabled={!isAuthenticated || isFeedbackPending}
                    className="rounded bg-stone-900 px-2 py-1 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
                  >
                    {copy.submitAdminNote}
                  </button>
                </div>
              </details>

              {feedbackState ? (
                <p className={getFeedbackStatusClass(feedbackState.status)}>
                  {feedbackState.message}
                </p>
              ) : null}

              {!isAuthenticated && isReady ? (
                <AuthGateInlinePrompt
                  className="text-[11px]"
                  message={copy.signInFeedback}
                />
              ) : null}
            </div>
          ) : null}
        </article>
      );
    });
  }

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

  function handleSaveChatHistory() {
    const historyText = formatChatHistory(typedMessages, pageContext, inferenceProvider);
    const blob = new Blob([historyText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `shenute-chat-history-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);

    setSaveStatus(copy.savedHistory);
    window.setTimeout(() => setSaveStatus(null), 3000);
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
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(copy.cameraUnsupported);
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
          : copy.cameraAccessFailed,
      );
    }
  }

  async function captureFromCamera() {
    const videoElement = videoRef.current;
    const canvasElement = captureCanvasRef.current;

    if (!videoElement || !canvasElement) {
      setCameraError(copy.cameraNotReady);
      return;
    }

    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    if (width <= 0 || height <= 0) {
      setCameraError(copy.cameraFeedNotReady);
      return;
    }

    canvasElement.width = width;
    canvasElement.height = height;
    const context = canvasElement.getContext("2d");
    if (!context) {
      setCameraError(copy.captureFailed);
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasElement.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setCameraError(copy.captureFailed);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isShenuteAccessBlocked) {
      return;
    }

    const trimmed = inputValue.trim();
    if ((!trimmed && !selectedImage) || isLoading || ocrPending) {
      return;
    }

    let composedPrompt = trimmed;

    if (selectedImage) {
      setOcrPending(true);
      setOcrError(null);

      try {
        const ocrFormData = new FormData();
        ocrFormData.append("file", selectedImage);
        const ocrText = await processOCRImage(ocrFormData);
        const trimmedOcrText = ocrText
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 6000);

        composedPrompt = [
          composedPrompt,
          `[${copy.imageContext}]`,
          `Image: ${selectedImage.name}`,
          trimmedOcrText,
        ]
          .filter((part) => part.length > 0)
          .join("\n\n");
      } catch (ocrProcessingError) {
        setOcrError(
          ocrProcessingError instanceof Error
            ? ocrProcessingError.message
            : copy.ocrFailed,
        );
        setOcrPending(false);
        return;
      } finally {
        setOcrPending(false);
      }
    }

    if (!composedPrompt.trim()) {
      setOcrError(copy.noTextExtracted);
      return;
    }

    const freshContext = buildPageContext(pathname);

    sendMessage(
      { text: composedPrompt },
      {
        body: {
          inferenceProvider,
          pageContext: freshContext,
        },
      },
    );
    setInputValue("");
    clearSelectedImage();
  }

  async function submitFeedbackSignal(options: {
    assistantMessage: ChatMessageLike;
    feedbackText?: string;
    promptMessage: ChatMessageLike | null;
    signal: ShenuteFeedbackSignal;
  }) {
    if (!isAuthenticated) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message: copy.signInFeedback,
          status: "error",
        },
      }));
      return false;
    }

    const assistantResponse = getMessageText(options.assistantMessage);
    const prompt = options.promptMessage
      ? getMessageText(options.promptMessage)
      : "";

    if (!assistantResponse || !prompt) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message: copy.promptResolveFailed,
          status: "error",
        },
      }));
      return false;
    }

    setFeedbackStateByMessage((current) => ({
      ...current,
      [options.assistantMessage.id]: {
        message: copy.savingFeedback,
        status: "pending",
      },
    }));

    try {
      const response = await fetch("/api/shenute/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantMessageId: options.assistantMessage.id,
          assistantResponse,
          shenuteSessionId: shenuteSessionIdRef.current,
          feedbackText: options.feedbackText,
          inferenceProvider,
          pageContext,
          prompt,
          signal: options.signal,
          userMessageId: options.promptMessage?.id,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        ragIngested?: boolean;
        ragWarning?: string;
        success?: boolean;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? copy.feedbackFailed);
      }

      let successMessage: string = copy.saved;
      if (payload.ragIngested) {
        successMessage = copy.savedRag;
      } else if (payload.ragWarning) {
        successMessage = `${copy.saved} ${copy.ragWarning} ${payload.ragWarning}`;
      }

      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message: successMessage,
          status: "success",
        },
      }));

      return true;
    } catch (feedbackError) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message:
            feedbackError instanceof Error
              ? feedbackError.message
              : copy.feedbackFailed,
          status: "error",
        },
      }));
      return false;
    }
  }

  async function handleReaction(
    signal: ShenuteReactionSignal,
    assistantMessage: ChatMessageLike,
    promptMessage: ChatMessageLike | null,
  ) {
    const success = await submitFeedbackSignal({
      assistantMessage,
      promptMessage,
      signal,
    });

    if (!success) {
      return;
    }

    setSelectedReactionByMessage((current) => ({
      ...current,
      [assistantMessage.id]: signal,
    }));
  }

  async function handleAdminFeedbackSubmit(
    assistantMessage: ChatMessageLike,
    promptMessage: ChatMessageLike | null,
  ) {
    const draft =
      adminFeedbackDraftByMessage[assistantMessage.id]?.trim() ?? "";
    if (!draft) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [assistantMessage.id]: {
          message: copy.writeAdminFeedback,
          status: "error",
        },
      }));
      return;
    }

    const success = await submitFeedbackSignal({
      assistantMessage,
      feedbackText: draft,
      promptMessage,
      signal: "admin_feedback",
    });

    if (!success) {
      return;
    }

    setAdminFeedbackDraftByMessage((current) => ({
      ...current,
      [assistantMessage.id]: "",
    }));
  }

  return (
    <div className={floatingContainerClassName}>
      {isOpen ? (
        <section className="flex h-[560px] max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white/95 shadow-2xl shadow-stone-950/10 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/30 sm:w-[400px]">
          <header className="border-b border-stone-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 px-4 py-3 dark:border-stone-800 dark:from-sky-950/30 dark:via-stone-950 dark:to-emerald-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-900/30 dark:text-sky-300">
                    <span className="font-coptic leading-none">Ϣ</span>
                  </span>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    Shenute AI
                  </p>
                </div>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {copy.contextAware}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {copy.nmtCredit}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveChatHistory}
                  disabled={typedMessages.length === 0}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-stone-200 bg-white/80 px-3 text-[11px] font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {copy.saveHistory}
                </button>
                {saveStatus ? (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    {saveStatus}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={copy.close}
                title={copy.close}
                onClick={() => {
                  setIsOpen(false);
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white/80 text-stone-600 shadow-sm transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  {pageContext.path || "/"}
                </p>
              </div>
              <a
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/30"
                href="https://somiyagawa.github.io/THOTH.AI/"
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {copy.details}
              </a>
            </div>

            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
              <span className="shrink-0">{copy.provider}</span>
              <select
                className="compact-select-base min-h-9 flex-1 rounded-xl border-stone-300 bg-white/85 py-1 text-xs normal-case tracking-normal dark:border-stone-700 dark:bg-stone-900"
                value={inferenceProvider}
                onChange={(event) => {
                  setInferenceProvider(toShenuteProvider(event.target.value));
                }}
                disabled={isLoading || isShenuteAccessBlocked}
              >
                <option value="hf">{copy.providerHf}</option>
                <option value="gemini">{copy.providerGemini}</option>
                <option value="openrouter">{copy.providerOpenRouter}</option>
                <option value="thoth">{copy.providerThoth}</option>
              </select>
            </label>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50/70 p-3 dark:bg-stone-950/40">
            {conversationContent}

            {isLoading ? (
              <div className="mr-8 inline-flex items-center gap-2 rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {copy.thinking}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950"
          >
            {error ? (
              <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {error.message || copy.requestFailed}
              </p>
            ) : null}
            {ocrError ? (
              <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {ocrError}
              </p>
            ) : null}
            {cameraError ? (
              <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                {cameraError}
              </p>
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
              <div className="mb-2 rounded-2xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-900/60">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="mb-2 w-full rounded-xl border border-stone-200 dark:border-stone-700"
                />
                <canvas ref={captureCanvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void captureFromCamera();
                    }}
                    className={buttonClassName({
                      size: "sm",
                      variant: "primary",
                      className: "h-9 text-xs",
                    })}
                  >
                    <ScanText className="h-3.5 w-3.5" />
                    {copy.capture}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                      className: "h-9 text-xs",
                    })}
                  >
                    {copy.close}
                  </button>
                </div>
              </div>
            ) : null}

            {selectedImagePreviewUrl ? (
              <div className="mb-2 rounded-2xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-900/60">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[11px] text-stone-600 dark:text-stone-300">
                    {copy.imageAttached} (
                    {selectedImageSource === "camera"
                      ? copy.imageFromCamera
                      : copy.imageFromUpload}
                    )
                  </p>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                  >
                    {copy.removeImage}
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImagePreviewUrl}
                  alt={copy.selectedForOcrAlt}
                  className="max-h-28 w-auto rounded-xl border border-stone-200 dark:border-stone-700"
                />
              </div>
            ) : null}

            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={isLoading || ocrPending || isShenuteAccessBlocked}
                className={buttonClassName({
                  size: "sm",
                  variant: "secondary",
                  className: "h-9 text-xs",
                })}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {copy.addImage}
              </button>
              <button
                type="button"
                onClick={() => {
                  void openCamera();
                }}
                disabled={
                  isLoading ||
                  ocrPending ||
                  cameraOpen ||
                  isShenuteAccessBlocked
                }
                className={buttonClassName({
                  size: "sm",
                  variant: "secondary",
                  className: "h-9 text-xs",
                })}
              >
                <Camera className="h-3.5 w-3.5" />
                {copy.camera}
              </button>
              {ocrPending ? (
                <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  {copy.ocrPending}
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                }}
                placeholder={copy.inputPlaceholder}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                disabled={isLoading || ocrPending || isShenuteAccessBlocked}
              />
              <button
                type="submit"
                aria-label={copy.send}
                title={copy.send}
                disabled={
                  (!inputValue.trim() && !selectedImage) ||
                  isLoading ||
                  ocrPending ||
                  isShenuteAccessBlocked
                }
                className={buttonClassName({
                  size: "sm",
                  variant: "primary",
                  className: "h-10 w-10 shrink-0 rounded-xl px-0",
                })}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          aria-label={t("shenute.launcher.open")}
          title={t("shenute.launcher.open")}
          onClick={() => {
            setIsOpen(true);
          }}
          className="inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-sky-600 text-white shadow-xl shadow-sky-950/15 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:bg-sky-500 dark:hover:bg-sky-400 sm:h-auto sm:w-auto sm:px-5 sm:py-3 sm:text-sm sm:font-semibold"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">
            {t("shenute.launcher.open")}
          </span>
        </button>
      ) : null}
    </div>
  );
}
