import { z } from "zod";
import {
  createAgentApp,
  createAxLLMClient,
  AgentKitConfig,
} from "@lucid-dreams/agent-kit";
import { flow } from "@ax-llm/ax";

/**
 * This example shows how to combine `createAxLLMClient` with a small AxFlow
 * pipeline. The flow creates a short summary for a topic and then follows up
 * with a handful of ideas the caller could explore next.
 *
 * Required environment variables:
 *   - OPENAI_API_KEY   (passed through to @ax-llm/ax)
 *   - PRIVATE_KEY      (used for x402 payments)
 */

const configOverrides: AgentKitConfig = {
  payments: {
    facilitatorUrl:
      (process.env.FACILITATOR_URL as any) ??
      "https://facilitator.daydreams.systems",
    payTo:
      (process.env.PAY_TO as `0x${string}`) ??
      "0xf46ab190223ccc95b73bacb72181d5a28f8ef67b",
    network: (process.env.NETWORK as any) ?? "base",
    defaultPrice: process.env.DEFAULT_PRICE ?? "0.1",
  },
};

const axClient = createAxLLMClient({
  logger: {
    warn(message, error) {
      if (error) {
        console.warn(`[examples] ${message}`, error);
      } else {
        console.warn(`[examples] ${message}`);
      }
    },
  },
});

if (!axClient.isConfigured()) {
  console.warn(
    "[examples] Ax LLM provider not configured — the flow will fall back to scripted output."
  );
}

const brainstormingFlow = flow<{ topic: string }>()
  .node(
    "summarizer",
    'topic:string -> summary:string "Two concise sentences describing the topic."'
  )
  .node(
    "ideaGenerator",
    'summary:string -> ideas:string[] "Three short follow-up ideas."'
  )
  .execute("summarizer", (state) => ({
    topic: state.topic,
  }))
  .execute("ideaGenerator", (state) => ({
    summary: state.summarizerResult.summary as string,
  }))
  .returns((state) => ({
    summary: state.summarizerResult.summary as string,
    ideas: Array.isArray(state.ideaGeneratorResult.ideas)
      ? (state.ideaGeneratorResult.ideas as string[])
      : [],
  }));

const { app, addEntrypoint } = createAgentApp(
  {
    name: "ax-flow-agent",
    version: "0.0.1",
    description:
      "Demonstrates driving an AxFlow pipeline through createAxLLMClient.",
  },
  {
    config: configOverrides,
  }
);

addEntrypoint({
  key: "brainstorm",
  description:
    "Summarise a topic and suggest three follow-up ideas using AxFlow.",
  input: z.object({
    topic: z
      .string()
      .min(1, { message: "Provide a topic to analyse." })
      .describe("High level topic to explore."),
  }),
  output: z.object({
    summary: z.string(),
    ideas: z.array(z.string()),
  }),
  async handler(ctx) {
    const topic = String(ctx.input.topic ?? "").trim();
    if (!topic) {
      throw new Error("Topic cannot be empty.");
    }

    const llm = axClient.ax;
    if (!llm) {
      const fallbackSummary = `AxFlow is not configured. Pretend summary for "${topic}".`;
      return {
        output: {
          summary: fallbackSummary,
          ideas: [
            "Set OPENAI_API_KEY to enable the Ax integration.",
            "Provide a PRIVATE_KEY so x402 can sign requests.",
            "Re-run the request once credentials are configured.",
          ],
        },
        model: "axllm-fallback",
      };
    }

    const result = await brainstormingFlow.forward(llm, { topic });
    const usageEntry = brainstormingFlow.getUsage().at(-1);
    brainstormingFlow.resetUsage();

    return {
      output: {
        summary: result.summary ?? "",
        ideas: Array.isArray(result.ideas) ? result.ideas : [],
      },
      model: usageEntry?.model,
    };
  },
});

export { app };

// --- Dexscreener Price Lookup Entrypoint ---
addEntrypoint({
  key: "dex-price",
  description:
    "Get the latest USD price for a token via Dexscreener (by address or search query).",
  input: z
    .object({
      tokenAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .optional()
        .describe("EVM token contract address (0x...)."),
      query: z
        .string()
        .optional()
        .describe("Free-text search (symbol/name/pair)."),
    })
    .refine((v) => Boolean(v.tokenAddress || v.query), {
      message: "Provide either tokenAddress or query.",
      path: ["tokenAddress"],
    }),
  output: z.object({
    priceUsd: z.number().describe("Price in USD for the selected pair."),
    chainId: z.string().optional(),
    pairAddress: z.string().optional(),
    dexId: z.string().optional(),
    tokenSymbol: z.string().optional(),
    baseTokenAddress: z.string().optional(),
    url: z.string().optional(),
    note: z.string().optional(),
  }),
  async handler(ctx) {
    const { tokenAddress, query } = ctx.input as {
      tokenAddress?: string;
      query?: string;
    };

    const chooseBestPair = (pairs: any[] | undefined | null) => {
      if (!pairs || !Array.isArray(pairs) || pairs.length === 0) return undefined;
      const enriched = pairs.map((p) => ({
        pair: p,
        liq: Number(p?.liquidity?.usd ?? 0),
      }));
      enriched.sort((a, b) => b.liq - a.liq);
      return enriched[0]?.pair ?? pairs[0];
    };

    try {
      let data: any | undefined;
      let best: any | undefined;

      if (tokenAddress) {
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
        );
        if (!res.ok) {
          throw new Error(`Dexscreener token lookup failed: ${res.status}`);
        }
        data = await res.json();
        best = chooseBestPair(data?.pairs);
      } else if (query) {
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(
            query
          )}`
        );
        if (!res.ok) {
          throw new Error(`Dexscreener search failed: ${res.status}`);
        }
        data = await res.json();
        best = chooseBestPair(data?.pairs);
      }

      if (!best) {
        throw new Error("No matching token/pair found on Dexscreener.");
      }

      const priceUsdStr = best?.priceUsd ?? best?.price?.usd ?? undefined;
      const priceUsd = Number(priceUsdStr);
      if (!Number.isFinite(priceUsd)) {
        throw new Error("Price not available for the selected pair.");
      }

      return {
        output: {
          priceUsd,
          chainId: String(best?.chainId ?? ""),
          pairAddress: String(best?.pairAddress ?? ""),
          dexId: String(best?.dexId ?? ""),
          tokenSymbol: String(best?.baseToken?.symbol ?? ""),
          baseTokenAddress: String(best?.baseToken?.address ?? ""),
          url: String(best?.url ?? ""),
          note: "Price reflects the most liquid pair found.",
        },
        model: "dexscreener-public-api",
      };
    } catch (err: any) {
      throw new Error(
        `Dex price lookup failed: ${err?.message ?? String(err)}`
      );
    }
  },
});
