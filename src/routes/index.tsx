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
  return (
    <iframe
      src="/app.html"
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
