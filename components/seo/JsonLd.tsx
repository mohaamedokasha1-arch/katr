export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // Content is fully generated server-side from typed data, never user input.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
