import { Form, useNavigation } from "react-router";
import { tracer } from "~/instrumentations";
import { sleep } from "~/root";
import type { Route } from "./+types/parent";

export async function loader() {
  await getThing4();
  await getThing5();
  return new Date().toISOString();
}

export async function action() {
  await sleep();
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

export const clientMiddleware = [
  async (_, next) => {
    await sleep();
    await next();
    await sleep();
  },
];

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  await sleep();
  return await serverLoader();
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  await sleep();
  return await serverAction();
}

export default function Child({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  let navigation = useNavigation();
  return (
    <>
      <h2>Child</h2>
      <p>Loader data: {loaderData}</p>
      <Form method="post">
        <button type="submit" disabled={navigation.state !== "idle"}>
          Submit {navigation.state !== "idle" ? `(${navigation.state})` : null}
        </button>
        <p>Action data: {actionData}</p>
      </Form>
    </>
  );
}
