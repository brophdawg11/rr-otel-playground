import { Outlet } from "react-router";
import { tracer } from "~/instrumentations";
import { sleep } from "~/root";
import type { Route } from "./+types/parent";

export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    await sleep();
    let res = await next();
    await sleep();
    return res;
  },
  async (_, next) => {
    await sleep();
    let res = await next();
    await sleep();
    return res;
  },
];

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

export default function Parent({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Parent</h1>
      <p>Loader data: {loaderData}</p>
      <Outlet />
    </>
  );
}
