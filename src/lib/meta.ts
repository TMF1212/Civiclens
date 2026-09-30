export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — ResultLens NG` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — ResultLens NG` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
