import { tracer } from "~/otel";
import { sleep } from "~/root";

export async function loader() {
  await getThing1();
  return new Date().toISOString();
}

async function getThing1() {
  return tracer.startActiveSpan("get thing 1", async (span) => {
    await getThing2();
    await getThing3();
    span.end();
  });
}

async function getThing2() {
  return tracer.startActiveSpan("get thing 2", async (span) => {
    await sleep();
    span.end();
  });
}

async function getThing3() {
  return tracer.startActiveSpan("get thing 3", async (span) => {
    await sleep();
    span.end();
  });
}

export default function Index() {
  return <h1>Home</h1>;
}
