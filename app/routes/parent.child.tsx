import { Outlet } from "react-router";
import type { Route } from "./+types/parent";
import { otelContextContainer } from "~/otel";
import type { Tracer } from "@opentelemetry/api";

// This route shows how we would can simplify getting back on track so
// startActiveSpan() works by instrumenting the build

export async function loader({ context }: Route.LoaderArgs) {
  let tracer = context.get(otelContextContainer).tracer;
  await new Promise((r) => setTimeout(r, 500));
  await getThing3(tracer);
  return new Date().toISOString();
}

async function getThing3(tracer: Tracer) {
  return tracer.startActiveSpan("get thing 3", async (span) => {
    try {
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      span.end();
    }
  });
}

export default function Child({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h2>Child</h2>
      <p>Loader data: {loaderData}</p>
      <Outlet />
    </>
  );
}
