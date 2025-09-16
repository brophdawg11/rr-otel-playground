import { Outlet } from "react-router";
import { tracer } from "~/otel";
import { sleep } from "~/root";
import type { Route } from "./+types/parent";

export async function loader() {
  await getThing4();
  await getThing5();
  return new Date().toISOString();
}

async function getThing4() {
  return tracer.startActiveSpan("get thing 4", async (span) => {
    await sleep();
    span.end();
  });
}

async function getThing5() {
  return tracer.startActiveSpan("get thing 5", async (span) => {
    await sleep();
    span.end();
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
