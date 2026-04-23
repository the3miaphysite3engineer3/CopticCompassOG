"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  BrainCircuit,
  ChevronDown,
  ExternalLink,
  LibraryBig,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { processOCRImage } from "@/actions/ocrActions";
import {
  AuthGateInlinePrompt,
  AuthGateNotice,
} from "@/components/AuthGateNotice";
import { Badge } from "@/components/Badge";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { buttonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { StatusNotice } from "@/components/StatusNotice";
import { SurfacePanel } from "@/components/SurfacePanel";
import { cx } from "@/lib/classes";
import { getLocalizedHomePath } from "@/lib/locale";
import { useOptionalAuthGate } from "@/lib/supabase/useOptionalAuthGate";

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

const SHENUTE_COPY = {
  en: {
    accessRequired: "Please sign in to access Shenute AI.",
    addImage: "Add Image",
    adminNotePlaceholder:
      "Admin only: add written feedback tied to this prompt and response.",
    adminNoteSummary: "Admin note for RAG learning",
    aiMode: "AI mode",
    architectureLabel: "Architecture:",
    architectureValue: "RAG (Retrieval Augmented Generation)",
    baseTechnology: "Base Technology",
    baseLlmLabel: "Base LLM:",
    baseLlmValue: "Claude 4.5 Sonnet (upgraded from 3.5)",
    cameraCapture: "Capture Image",
    cameraClose: "Close Camera",
    cameraFrameFailed: "Could not capture camera frame.",
    cameraImageFailed: "Could not capture image from camera.",
    cameraNotReady: "Camera is not ready.",
    cameraNotSupported: "Camera is not supported on this device/browser.",
    cameraStillLoading: "Camera feed is not ready yet. Try again.",
    cameraSource: "camera",
    contact: "Contact",
    credits: "Credits",
    creditsAndSpecs: "THOTH AI Credits and Technical Specifications",
    customPrompts: "Custom instruction prompts (500 plus lines)",
    dislike: "Dislike",
    feedbackPromptMissing:
      "Could not resolve prompt/response for this feedback.",
    feedbackSaved: "Saved.",
    feedbackSavedWithRag: "Saved and added to RAG learning.",
    feedbackSaveFailed: "Could not save feedback.",
    feedbackSaving: "Saving feedback...",
    feedbackSignIn: "Sign in to send feedback signals.",
    feedbackSignInInline: "Sign in to send learning feedback signals",
    imageAttached: "Image attached",
    imageOcrContext: "[Image OCR Context]",
    intro:
      "Ask about Coptic vocabulary, grammar, translation, and manuscript context without leaving the shared app workspace.",
    knowledgeBase: "Knowledge Base",
    like: "Like",
    nlpCapabilities: "Natural Language Processing and OCR capabilities",
    noTextExtracted: "No text extracted from the selected image.",
    ocrFailed: "OCR failed for the selected image.",
    placeholder: "Ask about a Coptic word, grammar rule, or attached image...",
    platformLabel: "Platform:",
    providerGemini: "Learner (Gemini)",
    providerHf: "Learner (HF)",
    providerOpenRouter: "Learner (OpenRouter)",
    providerThoth: "Expert (THOTH AI)",
    ragWarning: "Saved. RAG ingest warning:",
    rateLimit: "Rate limit reached. Please try again later.",
    remove: "Remove",
    requestFailed: "AI request failed.",
    runningOcr: "Running OCR...",
    sendMessage: "Send message",
    selectedImageAlt: "Selected for OCR",
    submitAdminNote: "Submit admin note",
    technicalSummary:
      "Credits, base stack, and source materials behind the THOTH AI expert mode.",
    thothBio1:
      "Dr. So Miyagawa is an associate professor of linguistics and Egyptology at the University of Tsukuba, specializing in the Ancient Egyptian-Coptic language. Following doctoral research at the University of Gottingen's Seminar for Egyptology and Coptic Studies, his work integrates computational linguistic methods with traditional philological approaches.",
    thothBio2:
      "His research focuses on ancient and medieval Nile Valley languages, including Ancient Egyptian-Coptic, Old Nubian, Greek, Arabic, and Meroitic, as well as endangered languages in and around the Japanese Archipelago.",
    thothRole: "Associate Professor of Linguistics and Egyptology",
    title: "Shenute AI",
    uploadSource: "upload",
    useCamera: "Use Camera",
    viewProjectSite: "Visit THOTH AI project site",
    welcomeDescription:
      "Start with a word, a grammar question, or an image attachment and Shenute AI will keep the conversation grounded in your Coptic study workflow.",
    welcomeTitle: "Welcome to Shenute AI",
    writeAdminFeedback: "Write admin feedback before submitting.",
  },
  nl: {
    accessRequired: "Meld u aan om Shenute AI te gebruiken.",
    addImage: "Afbeelding toevoegen",
    adminNotePlaceholder:
      "Alleen voor beheerders: voeg feedback toe bij deze prompt en dit antwoord.",
    adminNoteSummary: "Beheerdersnotitie voor RAG-learning",
    aiMode: "AI-modus",
    architectureLabel: "Architectuur:",
    architectureValue: "RAG (Retrieval Augmented Generation)",
    baseTechnology: "Basistechnologie",
    baseLlmLabel: "Basis-LLM:",
    baseLlmValue: "Claude 4.5 Sonnet (upgrade vanaf 3.5)",
    cameraCapture: "Afbeelding vastleggen",
    cameraClose: "Camera sluiten",
    cameraFrameFailed: "Het camerabeeld kon niet worden vastgelegd.",
    cameraImageFailed:
      "De afbeelding kon niet vanuit de camera worden vastgelegd.",
    cameraNotReady: "De camera is nog niet klaar.",
    cameraNotSupported:
      "De camera wordt niet ondersteund op dit apparaat of in deze browser.",
    cameraStillLoading: "De camerafeed is nog niet klaar. Probeer het opnieuw.",
    cameraSource: "camera",
    contact: "Contact",
    credits: "Credits",
    creditsAndSpecs: "THOTH AI-credits en technische specificaties",
    customPrompts: "Aangepaste instructieprompts (meer dan 500 regels)",
    dislike: "Niet nuttig",
    feedbackPromptMissing:
      "De prompt en het antwoord voor deze feedback konden niet worden bepaald.",
    feedbackSaved: "Opgeslagen.",
    feedbackSavedWithRag: "Opgeslagen en toegevoegd aan RAG-learning.",
    feedbackSaveFailed: "Feedback kon niet worden opgeslagen.",
    feedbackSaving: "Feedback opslaan...",
    feedbackSignIn: "Meld u aan om feedbacksignalen te verzenden.",
    feedbackSignInInline: "Meld u aan om leerfeedback te verzenden",
    imageAttached: "Afbeelding toegevoegd",
    imageOcrContext: "[Image OCR Context]",
    intro:
      "Stel vragen over Koptische woordenschat, grammatica, vertaling en manuscriptcontext zonder de gedeelde werkruimte te verlaten.",
    knowledgeBase: "Kennisbank",
    like: "Nuttig",
    nlpCapabilities: "Mogelijkheden voor natuurlijke-taalverwerking en OCR",
    noTextExtracted:
      "Er is geen tekst uit de geselecteerde afbeelding gehaald.",
    ocrFailed: "OCR is mislukt voor de geselecteerde afbeelding.",
    placeholder:
      "Vraag naar een Koptisch woord, een grammaticaregel of een toegevoegde afbeelding...",
    platformLabel: "Platform:",
    providerGemini: "Leerhulp (Gemini)",
    providerHf: "Leerhulp (HF)",
    providerOpenRouter: "Leerhulp (OpenRouter)",
    providerThoth: "Expert (THOTH AI)",
    ragWarning: "Opgeslagen. RAG-ingest-waarschuwing:",
    rateLimit: "De limiet is bereikt. Probeer het later opnieuw.",
    remove: "Verwijderen",
    requestFailed: "AI-verzoek mislukt.",
    runningOcr: "OCR uitvoeren...",
    sendMessage: "Bericht verzenden",
    selectedImageAlt: "Geselecteerd voor OCR",
    submitAdminNote: "Beheerdersnotitie verzenden",
    technicalSummary:
      "Credits, basisstack en bronmateriaal achter de THOTH AI-expertmodus.",
    thothBio1:
      "Dr. So Miyagawa is hoofddocent taalkunde en egyptologie aan de University of Tsukuba en specialiseert zich in de Oudegyptisch-Koptische taal. Na promotieonderzoek aan het Seminar for Egyptology and Coptic Studies van de University of Gottingen combineert zijn werk computationele taalkundige methoden met traditionele filologische benaderingen.",
    thothBio2:
      "Zijn onderzoek richt zich op oude en middeleeuwse talen van de Nijlvallei, waaronder Oudegyptisch-Koptisch, Oudnubisch, Grieks, Arabisch en Meroitisch, naast bedreigde talen in en rond de Japanse archipel.",
    thothRole: "Hoofddocent taalkunde en egyptologie",
    title: "Shenute AI",
    uploadSource: "upload",
    useCamera: "Camera gebruiken",
    viewProjectSite: "Bekijk de THOTH AI-projectsite",
    welcomeDescription:
      "Begin met een woord, een grammaticavraag of een afbeelding. Shenute AI houdt het gesprek verbonden met uw Koptische studiewerkstroom.",
    welcomeTitle: "Welkom bij Shenute AI",
    writeAdminFeedback: "Schrijf beheerdersfeedback voordat u die verzendt.",
  },
} as const;

type ShenuteCopy = (typeof SHENUTE_COPY)[keyof typeof SHENUTE_COPY];

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

function getErrorStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as { cause?: unknown; status?: unknown };
  if (typeof candidate.status === "number") {
    return candidate.status;
  }

  if (candidate.cause && typeof candidate.cause === "object") {
    const cause = candidate.cause as { status?: unknown };
    if (typeof cause.status === "number") {
      return cause.status;
    }
  }

  return undefined;
}

function getShenuteErrorMessage(error: unknown, copy: ShenuteCopy) {
  const status = getErrorStatusCode(error);
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalizedMessage = message.toLowerCase();

  if (
    status === 429 ||
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("rate limit")
  ) {
    return copy.rateLimit;
  }

  if (
    status === 401 ||
    normalizedMessage.includes("401") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("sign in")
  ) {
    return copy.accessRequired;
  }

  return message || copy.requestFailed;
}

function getFeedbackStatusClass(status: "error" | "pending" | "success") {
  if (status === "error") {
    return "text-rose-700 dark:text-rose-300";
  }

  if (status === "pending") {
    return "text-slate-600 dark:text-slate-300";
  }

  return "text-emerald-700 dark:text-emerald-300";
}

function getMessageAvatarClassName(role: ChatMessageLike["role"]) {
  if (role === "user") {
    return "bg-sky-600 text-white dark:bg-sky-500";
  }

  return "bg-emerald-600 text-white dark:bg-emerald-500";
}

function getMessageBubbleClassName(role: ChatMessageLike["role"]) {
  if (role === "user") {
    return "bg-sky-600 text-white shadow-md dark:bg-sky-500 rounded-tr-sm";
  }

  return "rounded-tl-sm border border-stone-200 bg-white/90 text-stone-800 shadow-sm dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200";
}

function getReactionButtonClassName(
  active: boolean,
  tone: "negative" | "positive",
) {
  if (active && tone === "positive") {
    return "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }

  if (active && tone === "negative") {
    return "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  }

  return "border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800";
}

export default function ShenuteAI() {
  const { language, t } = useLanguage();
  const copy = SHENUTE_COPY[language];
  const [inferenceProvider, setInferenceProvider] =
    useState<ShenuteProvider>("thoth");
  const [inputValue, setInputValue] = useState("");
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [shenuteAccessError, setShenuteAccessError] = useState<string | null>(
    null,
  );
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
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(copy.cameraNotSupported);
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
          : copy.cameraNotSupported,
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
      setCameraError(copy.cameraStillLoading);
      return;
    }

    canvasElement.width = width;
    canvasElement.height = height;
    const context = canvasElement.getContext("2d");
    if (!context) {
      setCameraError(copy.cameraFrameFailed);
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasElement.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setCameraError(copy.cameraImageFailed);
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

    if (isShenuteAccessBlocked) {
      setShenuteAccessError(copy.accessRequired);
      return;
    }

    setShenuteAccessError(null);

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
        const trimmedOcrText = ocrText
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);

        composedPrompt = [
          composedPrompt,
          copy.imageOcrContext,
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

    sendMessage(
      { text: composedPrompt },
      {
        body: {
          inferenceProvider,
        },
      },
    );
    setInputValue("");
    clearSelectedImage();
  };

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
          message: copy.feedbackSignIn,
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
          message: copy.feedbackPromptMissing,
          status: "error",
        },
      }));
      return false;
    }

    setFeedbackStateByMessage((current) => ({
      ...current,
      [options.assistantMessage.id]: {
        message: copy.feedbackSaving,
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
        throw new Error(payload.error ?? copy.feedbackSaveFailed);
      }

      let successMessage: string = copy.feedbackSaved;
      if (payload.ragIngested) {
        successMessage = copy.feedbackSavedWithRag;
      } else if (payload.ragWarning) {
        successMessage = `${copy.ragWarning} ${payload.ragWarning}`;
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
              : copy.feedbackSaveFailed,
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
    <PageShell
      className="min-h-screen flex flex-col items-center p-6 pb-16 md:p-10"
      contentClassName="mx-auto w-full max-w-5xl space-y-6 pt-10"
      width="standard"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbInset,
      ]}
    >
      <BreadcrumbTrail
        items={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.shenute") },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="max-w-3xl">
          <PageHeader
            title={copy.title}
            description={copy.intro}
            align="left"
            size="compact"
            tone="sky"
            titleClassName="pb-0"
            descriptionClassName="text-base md:text-lg"
          />
        </div>

        <SurfacePanel
          rounded="3xl"
          shadow="soft"
          variant="subtle"
          className="self-start p-4 md:p-5"
        >
          <div className="space-y-4">
            <label className="flex w-full flex-col gap-2 text-sm font-medium text-stone-600 dark:text-stone-300">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                {copy.aiMode}
              </span>
              <select
                id="shenute-inference-provider"
                name="shenute_inference_provider"
                className="compact-select-base h-11 w-full bg-white/85 text-sm dark:bg-stone-900"
                value={inferenceProvider}
                onChange={(event) => {
                  setInferenceProvider(toShenuteProvider(event.target.value));
                }}
                disabled={isLoading || isShenuteAccessBlocked}
              >
                <option value="thoth">{copy.providerThoth}</option>
                <option value="gemini">{copy.providerGemini}</option>
                <option value="openrouter">{copy.providerOpenRouter}</option>
                <option value="hf">{copy.providerHf}</option>
              </select>
            </label>

            <details className="group overflow-hidden rounded-[1.25rem] border border-stone-200/80 bg-white/55 dark:border-stone-800/80 dark:bg-stone-950/35">
              <summary className="list-none cursor-pointer p-4 [&::-webkit-details-marker]:hidden">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-900/30 dark:text-sky-300">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {copy.creditsAndSpecs}
                    </h2>
                    <p className="text-xs leading-5 text-stone-600 dark:text-stone-400">
                      {copy.technicalSummary}
                    </p>
                  </div>
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white/80 text-stone-500 shadow-sm transition-transform duration-200 group-open:rotate-180 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-300">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </summary>

              <div className="border-t border-stone-200/80 p-4 dark:border-stone-800/80">
                <div className="space-y-4">
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                      <UserRound className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span>{copy.credits}</span>
                    </div>
                    <div className="space-y-1.5 text-sm leading-6 text-stone-600 dark:text-stone-400">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        Dr. So Miyagawa
                      </p>
                      <p>{copy.thothRole}</p>
                      <p>University of Tsukuba</p>
                      <p>{copy.thothBio1}</p>
                      <p>{copy.thothBio2}</p>
                      <a
                        className={buttonClassName({
                          className: "h-auto px-0 py-0",
                          size: "sm",
                          variant: "link",
                        })}
                        href="mailto:miyagawa.so.kb@u.tsukuba.ac.jp"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {copy.contact}: miyagawa.so.kb@u.tsukuba.ac.jp
                      </a>
                    </div>
                  </section>

                  <section className="space-y-2 border-t border-stone-200/80 pt-4 dark:border-stone-800/80">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                      <BrainCircuit className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span>{copy.baseTechnology}</span>
                    </div>
                    <ul className="space-y-1.5 text-sm leading-6 text-stone-600 dark:text-stone-400">
                      <li>
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {copy.platformLabel}
                        </span>{" "}
                        Dify
                      </li>
                      <li>
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {copy.baseLlmLabel}
                        </span>{" "}
                        {copy.baseLlmValue}
                      </li>
                      <li>
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {copy.architectureLabel}
                        </span>{" "}
                        {copy.architectureValue}
                      </li>
                      <li>{copy.nlpCapabilities}</li>
                    </ul>
                  </section>

                  <section className="space-y-2 border-t border-stone-200/80 pt-4 dark:border-stone-800/80">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                      <LibraryBig className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span>{copy.knowledgeBase}</span>
                    </div>
                    <ul className="space-y-1.5 text-sm leading-6 text-stone-600 dark:text-stone-400">
                      <li>Comprehensive Coptic Lexicon v1.2 (2020)</li>
                      <li>
                        Burns, D., Feder, F., John, K., Kupreyev, M., et al.
                      </li>
                      <li>Freie Universitat Berlin</li>
                      <li>A Concise Dictionary of Middle Egyptian (1962)</li>
                      <li>Raymond Oliver Faulkner</li>
                      <li>Griffith Institute, Oxford</li>
                      <li>{copy.customPrompts}</li>
                    </ul>
                  </section>

                  <div className="border-t border-stone-200/80 pt-4 dark:border-stone-800/80">
                    <a
                      className={buttonClassName({
                        className: "w-full justify-center",
                        size: "sm",
                        variant: "secondary",
                      })}
                      href="https://somiyagawa.github.io/THOTH.AI/"
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {copy.viewProjectSite}
                    </a>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </SurfacePanel>
      </div>

      <SurfacePanel
        rounded="4xl"
        shadow="float"
        className="relative overflow-hidden"
      >
        {isShenuteAccessBlocked ? (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 bg-white/10 backdrop-brightness-95 dark:bg-stone-950/10"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-10">
              <AuthGateNotice
                actionClassName="px-6"
                align="center"
                className="w-full max-w-lg shadow-xl"
                size="comfortable"
                title={copy.title}
              >
                {copy.accessRequired}
              </AuthGateNotice>
            </div>
          </>
        ) : null}

        <div
          className={cx(
            "flex min-h-[72vh] flex-col transition-all duration-300",
            isShenuteAccessBlocked &&
              "pointer-events-none select-none blur-[6px] opacity-70",
          )}
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-8 md:p-12">
              <SurfacePanel
                rounded="4xl"
                variant="subtle"
                shadow="soft"
                className="max-w-xl p-8 text-center"
              >
                <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-3xl text-sky-700 shadow-sm dark:bg-sky-900/30 dark:text-sky-300">
                  <span className="font-coptic leading-none">Ϣ</span>
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  {copy.welcomeTitle}
                </h2>
                <p className="text-stone-600 dark:text-stone-400">
                  {copy.welcomeDescription}
                </p>
              </SurfacePanel>
            </div>
          ) : (
            <div
              aria-live="polite"
              className="flex-1 space-y-5 overflow-y-auto border-b border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/30 md:p-6"
            >
              {messages.map((m, index) => {
                const assistantMessage = m as ChatMessageLike;
                const promptMessage =
                  m.role === "assistant"
                    ? findPreviousUserMessage(typedMessages, index)
                    : null;
                const feedbackState = feedbackStateByMessage[m.id];
                const selectedReaction = selectedReactionByMessage[m.id];
                const adminDraft = adminFeedbackDraftByMessage[m.id] ?? "";
                const isFeedbackPending = feedbackState?.status === "pending";

                return (
                  <div
                    key={m.id}
                    className={cx(
                      "flex max-w-[85%] gap-3",
                      m.role === "user"
                        ? "ml-auto flex-row-reverse"
                        : "mr-auto",
                    )}
                  >
                    <div
                      className={cx(
                        "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                        getMessageAvatarClassName(m.role),
                      )}
                    >
                      {m.role === "user" ? (
                        "U"
                      ) : (
                        <span className="font-coptic text-base leading-none">
                          Ϣ
                        </span>
                      )}
                    </div>
                    <div
                      className={cx(
                        "rounded-2xl px-4 py-3 font-coptic text-lg leading-relaxed md:text-xl",
                        getMessageBubbleClassName(m.role),
                      )}
                    >
                      {Array.isArray(m.parts) ? (
                        m.parts
                          .filter(isTextMessagePart)
                          .map((part, partIndex: number) => {
                            if (part.type !== "text") {
                              return null;
                            }

                            if (m.role === "assistant") {
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
                                        className="underline"
                                      />
                                    ),
                                    code: ({
                                      className,
                                      children,
                                      ...props
                                    }) => (
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
                      ) : (
                        <p>
                          {(() => {
                            const candidate = m as { content?: unknown };
                            return typeof candidate.content === "string"
                              ? candidate.content
                              : "";
                          })()}
                        </p>
                      )}
                      {m.role === "assistant" ? (
                        <div className="mt-3 space-y-2 border-t border-stone-200 pt-3 text-xs dark:border-stone-700">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                void handleReaction(
                                  "like",
                                  assistantMessage,
                                  promptMessage,
                                );
                              }}
                              disabled={!isAuthenticated || isFeedbackPending}
                              aria-pressed={selectedReaction === "like"}
                              className={buttonClassName({
                                size: "sm",
                                variant: "secondary",
                                className: getReactionButtonClassName(
                                  selectedReaction === "like",
                                  "positive",
                                ),
                              })}
                            >
                              {copy.like}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleReaction(
                                  "dislike",
                                  assistantMessage,
                                  promptMessage,
                                );
                              }}
                              disabled={!isAuthenticated || isFeedbackPending}
                              aria-pressed={selectedReaction === "dislike"}
                              className={buttonClassName({
                                size: "sm",
                                variant: "secondary",
                                className: getReactionButtonClassName(
                                  selectedReaction === "dislike",
                                  "negative",
                                ),
                              })}
                            >
                              {copy.dislike}
                            </button>
                          </div>

                          <details className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-700 dark:bg-stone-950/30">
                            <summary className="cursor-pointer font-semibold text-stone-700 dark:text-stone-200">
                              {copy.adminNoteSummary}
                            </summary>
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={adminDraft}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setAdminFeedbackDraftByMessage((current) => ({
                                    ...current,
                                    [m.id]: value,
                                  }));
                                }}
                                placeholder={copy.adminNotePlaceholder}
                                rows={3}
                                disabled={!isAuthenticated || isFeedbackPending}
                                className="w-full rounded-xl border border-stone-200 bg-white/85 px-3 py-2 text-xs text-stone-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/35 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
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
                                className={buttonClassName({
                                  size: "sm",
                                  variant: "secondary",
                                })}
                              >
                                {copy.submitAdminNote}
                              </button>
                            </div>
                          </details>

                          {feedbackState ? (
                            <p
                              className={getFeedbackStatusClass(
                                feedbackState.status,
                              )}
                            >
                              {feedbackState.message}
                            </p>
                          ) : null}

                          {!isAuthenticated && isReady ? (
                            <AuthGateInlinePrompt
                              className="text-xs"
                              message={copy.feedbackSignInInline}
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="mr-auto flex max-w-[85%] items-center gap-3">
                  <div
                    className={cx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                      getMessageAvatarClassName("assistant"),
                    )}
                  >
                    <span className="font-coptic text-base leading-none">
                      Ϣ
                    </span>
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-stone-400 delay-100" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-stone-400 delay-200" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-stone-400 delay-300" />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            className="bg-white/70 p-4 dark:bg-stone-950/40 md:p-6"
          >
            <div className="mb-3 space-y-3">
              {shenuteAccessError ? (
                <AuthGateNotice align="left" size="compact">
                  {shenuteAccessError}
                </AuthGateNotice>
              ) : null}
              {error ? (
                <StatusNotice tone="error" align="left">
                  {getShenuteErrorMessage(error, copy)}
                </StatusNotice>
              ) : null}
              {ocrError ? (
                <StatusNotice tone="error" align="left">
                  {ocrError}
                </StatusNotice>
              ) : null}
              {cameraError ? (
                <StatusNotice tone="info" align="left">
                  {cameraError}
                </StatusNotice>
              ) : null}
            </div>

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
              <SurfacePanel
                rounded="3xl"
                variant="subtle"
                shadow="soft"
                className="mb-3 p-4"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="mb-3 w-full rounded-2xl border border-stone-200 dark:border-stone-700"
                />
                <canvas ref={captureCanvasRef} className="hidden" />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "primary",
                    })}
                  >
                    {copy.cameraCapture}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                    })}
                  >
                    {copy.cameraClose}
                  </button>
                </div>
              </SurfacePanel>
            ) : null}

            {selectedImagePreviewUrl ? (
              <SurfacePanel
                rounded="3xl"
                variant="subtle"
                shadow="soft"
                className="mb-3 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
                    {copy.imageAttached} (
                    {selectedImageSource === "camera"
                      ? copy.cameraSource
                      : copy.uploadSource}
                    )
                  </p>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className={buttonClassName({
                      size: "sm",
                      variant: "link",
                    })}
                  >
                    {copy.remove}
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImagePreviewUrl}
                  alt={copy.selectedImageAlt}
                  className="max-h-48 w-auto rounded-2xl border border-stone-200 dark:border-stone-700"
                />
              </SurfacePanel>
            ) : null}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={isLoading || ocrPending || isShenuteAccessBlocked}
                className={buttonClassName({
                  size: "sm",
                  variant: "secondary",
                })}
              >
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
                })}
              >
                {copy.useCamera}
              </button>
              {ocrPending ? (
                <Badge tone="accent" size="xs">
                  {copy.runningOcr}
                </Badge>
              ) : null}
            </div>

            <SurfacePanel
              rounded="3xl"
              variant="subtle"
              shadow="soft"
              className="p-2"
            >
              <div className="flex items-center gap-2">
                <input
                  id="shenute-message-input"
                  name="shenute_message"
                  className="min-w-0 flex-1 rounded-[1.25rem] border-0 bg-transparent px-4 py-3 font-coptic text-lg text-stone-900 outline-none ring-0 placeholder:text-stone-400 focus:outline-none focus:ring-0 dark:text-stone-100 dark:placeholder:text-stone-500 md:text-xl"
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    if (shenuteAccessError) {
                      setShenuteAccessError(null);
                    }
                  }}
                  placeholder={copy.placeholder}
                  disabled={isLoading || ocrPending || isShenuteAccessBlocked}
                />
                <button
                  type="submit"
                  aria-label={copy.sendMessage}
                  disabled={
                    (!inputValue.trim() && !selectedImage) ||
                    isLoading ||
                    ocrPending ||
                    isShenuteAccessBlocked
                  }
                  className={buttonClassName({
                    size: "sm",
                    variant: "primary",
                    className:
                      "h-10 w-10 shrink-0 rounded-xl px-0 disabled:hover:bg-sky-500 dark:disabled:hover:bg-sky-400",
                  })}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </SurfacePanel>
          </form>
        </div>
      </SurfacePanel>
    </PageShell>
  );
}
