export const developersMessages = {
  en: {
    "developers.title": "Developers",
    "developers.seoTitle":
      "Coptic Compass Grammar + Shenute AI APIs for Developers",
    "developers.description":
      "Explore the public Coptic Compass grammar API plus Shenute AI and OCR-backed image integration patterns for developer workflows.",
    "developers.heroTitle": "Build on grammar and Shenute AI APIs",
    "developers.heroDescription":
      "The grammar API exposes a read-only, versioned dataset for lessons, concepts, examples, exercises, footnotes, and sources, while /api/shenute powers Shenute AI interactions with provider selection and OCR-backed image context.",
    "developers.primaryCta": "Open API Docs",
    "developers.secondaryCta": "View OpenAPI JSON",
    "developers.discoveryTitle": "Start here",
    "developers.discoveryDescription":
      "Most integrations should begin with the API index, which documents the available resource families and the current dataset version.",
    "developers.workflowTitle": "Typical workflow",
    "developers.workflow.0":
      "Call /api/v1/grammar to discover the current endpoints and dataset version.",
    "developers.workflow.1":
      "Fetch /api/v1/grammar/lessons for the published lesson index.",
    "developers.workflow.2":
      "Load /api/v1/grammar/lessons/[slug] for full lesson payloads.",
    "developers.workflow.3":
      "Use /api/openapi.json when generating clients or importing the schema into tooling.",
    "developers.workflow.4":
      "Send POST /api/shenute requests for Shenute AI responses (default provider: openrouter).",
    "developers.workflow.5":
      "Send image OCR requests to POST /api/ocr so Coptic Compass forwards them to OCR_SERVICE_URL.",
    "developers.integrationTitle": "Integration notes",
    "developers.integration.0":
      "Responses are read-only and versioned with schemaVersion, datasetVersion, and generatedAt metadata.",
    "developers.integration.1":
      "The public dataset only exposes published lessons and their related concepts, examples, exercises, footnotes, and sources.",
    "developers.integration.2":
      "The lesson filter accepts either a lesson slug or a canonical lesson id.",
    "developers.integration.3":
      "For browser apps on another origin, a backend proxy is the safest default.",
    "developers.integration.4":
      "Shenute AI supports provider values: openrouter, gemini, and hf.",
    "developers.integration.5":
      "Image upload and camera capture flows run OCR first and append extracted text under [Image OCR Context] before calling /api/shenute.",
    "developers.integration.6":
      "Set OCR_SERVICE_URL and optionally OCR_UPLOAD_FIELD when your OCR backend requires a specific multipart field name.",
    "developers.integration.7":
      "The /api/ocr endpoint proxies multipart OCR uploads and returns upstream OCR responses to the client.",
    "developers.endpointsTitle": "High-value endpoints",
    "developers.exampleTitle": "Example request",
    "developers.exampleCaption":
      "A minimal server-side fetch that lists published lesson titles.",
    "developers.resourcesTitle": "Related resources",
    "developers.breadcrumbLabel": "Developers",
    "developers.shenuteExampleTitle": "Shenute AI request example",
    "developers.shenuteExampleCaption":
      "A minimal POST request to /api/shenute using OpenRouter as provider.",
    "developers.ocrExampleTitle": "OCR integration notes",
    "developers.ocrExampleCaption":
      "Clients can call /api/ocr, and Coptic Compass forwards to OCR_SERVICE_URL then returns the upstream OCR response.",
    "developers.endpoints.grammar.desc":
      "Discovery index for the public grammar API.",
    "developers.endpoints.lessons.desc":
      "Published lesson index for public integrations.",
    "developers.endpoints.manifest.desc":
      "Manifest with dataset-level metadata and counts.",
    "developers.endpoints.openapi.desc": "Machine-readable OpenAPI document.",
    "developers.endpoints.shenute.desc":
      "Shenute AI endpoint with provider routing and fallback handling.",
    "developers.endpoints.ocr.desc":
      "OCR proxy endpoint that forwards image uploads to OCR_SERVICE_URL.",
    "developers.resources.swagger.label": "Swagger UI",
    "developers.resources.swagger.desc":
      "Interactive reference for exploring every endpoint.",
    "developers.resources.openapi.label": "OpenAPI JSON",
    "developers.resources.openapi.desc":
      "Import into Postman, SDK generators, or internal tooling.",
    "developers.resources.apiIndex.label": "API index",
    "developers.resources.apiIndex.desc":
      "Read the current API capabilities and example routes.",
    "developers.resources.grammarHub.label": "Grammar hub",
    "developers.resources.grammarHub.desc":
      "See the public content the API is exposing.",
    "developers.resources.shenute.label": "Shenute AI",
    "developers.resources.shenute.desc":
      "Reference UI for provider selection plus OCR-backed image and camera messaging.",
    "developers.resources.ocr.label": "OCR proxy endpoint",
    "developers.resources.ocr.desc":
      "Send multipart OCR requests without exposing your upstream OCR service URL.",
  },
  nl: {
    "developers.title": "Ontwikkelaars",
    "developers.seoTitle":
      "Coptic Compass-API's voor grammatica en Shenute AI voor ontwikkelaars",
    "developers.description":
      "Verken de publieke grammatica-API van Coptic Compass plus Shenute AI en OCR-ondersteunde afbeeldingsintegratie voor ontwikkelaars.",
    "developers.heroTitle": "Bouw voort op grammatica- en Shenute AI-API's",
    "developers.heroDescription":
      "De grammatica-API biedt een alleen-lezen, geversioneerde dataset voor lessen, begrippen, voorbeelden, oefeningen, voetnoten en bronnen, terwijl /api/shenute Shenute AI-interacties levert met providerkeuze en OCR-context voor afbeeldingen.",
    "developers.primaryCta": "Open API-docs",
    "developers.secondaryCta": "Bekijk OpenAPI JSON",
    "developers.discoveryTitle": "Begin hier",
    "developers.discoveryDescription":
      "De meeste integraties starten best bij de API-index, waar de beschikbare resourcefamilies en de huidige datasetversie worden uitgelegd.",
    "developers.workflowTitle": "Typische workflow",
    "developers.workflow.0":
      "Roep /api/v1/grammar aan om de huidige endpoints en datasetversie te ontdekken.",
    "developers.workflow.1":
      "Gebruik /api/v1/grammar/lessons voor de index van gepubliceerde lessen.",
    "developers.workflow.2":
      "Laad /api/v1/grammar/lessons/[slug] voor volledige lespayloads.",
    "developers.workflow.3":
      "Gebruik /api/openapi.json om clients te genereren of het schema in tooling te importeren.",
    "developers.workflow.4":
      "Verstuur POST /api/shenute voor Shenute AI-antwoorden (standaardprovider: openrouter).",
    "developers.workflow.5":
      "Stuur OCR-requests voor afbeeldingen naar POST /api/ocr zodat Coptic Compass ze doorstuurt naar OCR_SERVICE_URL.",
    "developers.integrationTitle": "Integratienotities",
    "developers.integration.0":
      "Responses zijn alleen-lezen en bevatten schemaVersion, datasetVersion en generatedAt.",
    "developers.integration.1":
      "De publieke dataset bevat alleen gepubliceerde lessen en de bijbehorende begrippen, voorbeelden, oefeningen, voetnoten en bronnen.",
    "developers.integration.2":
      "De lesson-filter accepteert zowel een slug als een canonieke les-id.",
    "developers.integration.3":
      "Voor browser-apps op een andere origin is een backendproxy de veiligste standaardoptie.",
    "developers.integration.4":
      "Shenute AI ondersteunt providers: openrouter, gemini en hf.",
    "developers.integration.5":
      "Bij upload van afbeeldingen of cameracaptures draait OCR eerst; de geëxtraheerde tekst wordt toegevoegd onder [Image OCR Context] vóór de call naar /api/shenute.",
    "developers.integration.6":
      "Stel OCR_SERVICE_URL in en optioneel OCR_UPLOAD_FIELD als uw OCR-backend een vaste multipart-veldnaam vereist.",
    "developers.integration.7":
      "Het endpoint /api/ocr proxyt multipart OCR-uploads en geeft het upstream OCR-resultaat terug aan de client.",
    "developers.endpointsTitle": "Belangrijke endpoints",
    "developers.exampleTitle": "Voorbeeldrequest",
    "developers.exampleCaption":
      "Een minimale server-side fetch-aanroep die de titels van gepubliceerde lessen ophaalt.",
    "developers.resourcesTitle": "Verwante bronnen",
    "developers.breadcrumbLabel": "Ontwikkelaars",
    "developers.shenuteExampleTitle": "Voorbeeld Shenute AI-request",
    "developers.shenuteExampleCaption":
      "Een minimale POST-request naar /api/shenute met OpenRouter als provider.",
    "developers.ocrExampleTitle": "OCR-integratienotities",
    "developers.ocrExampleCaption":
      "Clients kunnen /api/ocr aanroepen; Coptic Compass stuurt door naar OCR_SERVICE_URL en geeft de upstream OCR-response terug.",
    "developers.endpoints.grammar.desc":
      "Ontdekkingsindex voor de publieke grammatica-API.",
    "developers.endpoints.lessons.desc":
      "Index van gepubliceerde lessen voor publieke integraties.",
    "developers.endpoints.manifest.desc":
      "Manifest met datasetmetadata en aantallen.",
    "developers.endpoints.openapi.desc": "Machineleesbaar OpenAPI-document.",
    "developers.endpoints.shenute.desc":
      "Shenute AI-endpoint met providerkeuze en fallback-afhandeling.",
    "developers.endpoints.ocr.desc":
      "OCR-proxyendpoint dat afbeelding-uploads doorstuurt naar OCR_SERVICE_URL.",
    "developers.resources.swagger.label": "Swagger UI",
    "developers.resources.swagger.desc":
      "Interactieve referentie om alle endpoints te verkennen.",
    "developers.resources.openapi.label": "OpenAPI JSON",
    "developers.resources.openapi.desc":
      "Importeer in Postman, SDK-generators of interne tooling.",
    "developers.resources.apiIndex.label": "API-index",
    "developers.resources.apiIndex.desc":
      "Lees de huidige mogelijkheden en voorbeeldroutes.",
    "developers.resources.grammarHub.label": "Grammatica-overzicht",
    "developers.resources.grammarHub.desc":
      "Bekijk de publieke inhoud die de API ontsluit.",
    "developers.resources.shenute.label": "Shenute AI",
    "developers.resources.shenute.desc":
      "Referentie-UI met providerkeuze en OCR-ondersteunde afbeeldings- en cameraberichten.",
    "developers.resources.ocr.label": "OCR-proxyendpoint",
    "developers.resources.ocr.desc":
      "Verstuur multipart OCR-requests zonder uw upstream OCR-service-URL te publiceren.",
  },
} as const;
