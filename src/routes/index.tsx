import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TicketAI — Smart Classification Engine" },
      { name: "description", content: "TicketAI smart ticket classification engine." },
    ],
  }),
  component: Index,
});

function Index() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY ?? '';
  const src = apiKey ? `/app.html?groq=${encodeURIComponent(apiKey)}` : '/app.html';

  return (
    <iframe
      src={src}
      title="TicketAI"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
