import { Outlet } from "react-router";
import type { Route } from "./+types/parent";
import { otelContextContainer } from "~/otel";
import type { Tracer } from "@opentelemetry/api";

// This route shows how we would can simplify getting back on track so
// startActiveSpan() works by instrumenting the build

export async function loader({ context }: Route.LoaderArgs) {
  let tracer = context.get(otelContextContainer).tracer;
  await new Promise((r) => setTimeout(r, 500));
  await getThing1(tracer);
  return new Date().toISOString();
}

async function getThing1(tracer: Tracer) {
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

export default function Parent({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Parent</h1>
      <p>Loader data: {loaderData}</p>
      <Outlet />
    </>
  );
}
