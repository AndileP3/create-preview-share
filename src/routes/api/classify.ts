import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are a precise ticket classification engine for a company support system.
Classify each support ticket into exactly one of these four categories:

HR — people/employment: payroll, salary, leave requests, annual leave, sick leave, onboarding, offboarding, hiring, recruitment, performance reviews, benefits, medical aid, pension, employee relations, training, promotions, disciplinary issues, contracts, work from home policy.

IT — technology: software bugs, hardware issues, laptop/computer problems, internet/wifi, VPN, passwords, account access, email setup, printer, phone, system errors, app crashes, new software requests, IT security, data backup.

Finance — money/accounting: invoices, purchase orders, expense claims, reimbursements, budget approvals, vendor payments, supplier queries, credit notes, financial reports, petty cash, company cards.

Operations — physical workplace/processes: office supplies, broken equipment (non-IT), facilities maintenance, meeting room bookings, parking, cleaning, building access, safety, compliance, logistics, courier, catering, vehicle fleet.

You MUST respond with ONLY a raw JSON object — no markdown, no explanation, no extra text.
Example: {"category":"HR","confidence":85,"reasoning":"Employee is requesting annual leave approval."}`;

export const Route = createFileRoute("/api/classify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: { title?: string; desc?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const title = (body.title ?? "").toString().slice(0, 500);
        const desc = (body.desc ?? "").toString().slice(0, 4000);
        if (!title && !desc) {
          return new Response(JSON.stringify({ error: "title or desc required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            temperature: 0,
            max_tokens: 200,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Classify this ticket:\nTitle: ${title}\nDescription: ${desc}` },
            ],
          }),
        });

        if (upstream.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please retry shortly." }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (upstream.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace Settings → Usage." }), {
            status: 402,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => "");
          return new Response(JSON.stringify({ error: `Upstream error ${upstream.status}: ${errText.slice(0, 200)}` }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const txt = data.choices?.[0]?.message?.content?.trim();
        if (!txt) {
          return new Response(JSON.stringify({ error: "Empty AI response" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(txt, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
