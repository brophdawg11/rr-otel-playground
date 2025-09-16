import { tracer } from "~/otel";
import { sleep } from "~/root";

export async function loader() {
  return tracer.startActiveSpan("loader (routes/_index)", async (span) => {
    await sleep();
    await getThing1();
    span.end();
    return new Date().toISOString();
  });
}

async function getThing1() {
  return tracer.startActiveSpan("get thing 1", async (span) => {
    await sleep();
    await Promise.all([getThing2a(), getThing2b()]);
    span.end();
  });
}

async function getThing2a() {
  return tracer.startActiveSpan("get thing 2a", async (span) => {
    await sleep();
    span.end();
  });
}

async function getThing2b() {
  return tracer.startActiveSpan("get thing 2b", async (span) => {
    await sleep();
    span.end();
  });
}

export default function Index() {
  return <h1>Home</h1>;
}
