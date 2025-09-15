import { createRequestHandler } from "@react-router/express";
import express from "express";
import { getInstrumentedBuild, getReactRouterOtelEvents } from "~/otel";

export const app = express();

app.use(
  createRequestHandler({
    build: getInstrumentedBuild,
    events: getReactRouterOtelEvents(),
  })
);
