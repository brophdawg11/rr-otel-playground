import { otelContextContainer } from "~/otel";
import type { Route } from "./+types/_index";
import type { Tracer } from "@opentelemetry/api";

// This route shows how we would have to do it manually if we did not
// instrument the build

export async function loader({ context }: Route.LoaderArgs) {
  let otelContext = context.get(otelContextContainer);
  let routeLoaderContext = otelContext.loaderContexts.get("routes/_index");

  if (!routeLoaderContext) {
    throw new Error("No loader context found for routeId: routes/_index");
  }

  // Manually start a callback-aware active span under the navigation context
  // here in the loader
  return otelContext.tracer.startActiveSpan(
    "loader",
    {},
    routeLoaderContext,
    async (span) => {
      try {
        await new Promise((r) => setTimeout(r, 500));
        await getThing1(otelContext.tracer);
        return new Date().toISOString();
      } finally {
        span.end();
      }
    }
  );
}

async function getThing1(tracer: Tracer) {
  // And then downstream we can just use normal startActiveSpan() calls
  return tracer.startActiveSpan("get thing 1", async (span) => {
    try {
      await new Promise((r) => setTimeout(r, 500));
      await Promise.all([getThing2a(tracer), getThing2b(tracer)]);
    } finally {
      span.end();
    }
  });
}

async function getThing2a(tracer: Tracer) {
  return tracer.startActiveSpan("get thing 2a", async (span) => {
    try {
      await new Promise((r) => setTimeout(r, 200));
    } finally {
      span.end();
    }
  });
}

async function getThing2b(tracer: Tracer) {
  return tracer.startActiveSpan("get thing 2b", async (span) => {
    try {
      await new Promise((r) => setTimeout(r, 300));
    } finally {
      span.end();
    }
  });
}

export default function Index() {
  return <h1>Home</h1>;
}
