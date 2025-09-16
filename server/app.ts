import { createRequestHandler } from "@react-router/express";
import express from "express";
import { instrumentBuild } from "~/otel";

export const app = express();

async function getBuild() {
  let build = await import("virtual:react-router/server-build");
  return instrumentBuild(build);
}

app.use(createRequestHandler({ build: getBuild }));
