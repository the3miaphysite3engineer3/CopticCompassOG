type StructuredDataProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function normalizeStructuredData(data: StructuredDataProps["data"]) {
  if (!Array.isArray(data)) {
    return data;
  }

  const entries = data.filter(Boolean);
  const sharedContext = entries.find(
    (entry): entry is Record<string, unknown> & { "@context": string } =>
      typeof entry?.["@context"] === "string"
  )?.["@context"];

  return {
    ...(sharedContext ? { "@context": sharedContext } : {}),
    "@graph": entries.map((entry) =>
      Object.fromEntries(
        Object.entries(entry).filter(([key]) => key !== "@context")
      )
    ),
  };
}

function serializeStructuredData(data: StructuredDataProps["data"]) {
  return JSON.stringify(normalizeStructuredData(data)).replace(/</g, "\\u003c");
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
    />
  );
}
