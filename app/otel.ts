import * as otel from "@opentelemetry/api";
import type { Context, Span, Tracer } from "@opentelemetry/api";
import { createContext, RouterContextProvider } from "react-router";

export type OtelContextContainer = {
  tracer: Tracer;
  navigateContext: Context;
  navigateSpan: Span;
  loaderContexts: Map<string, Context>;
  loaderSpans: Map<string, Span>;
};

export const otelContextContainer = createContext<OtelContextContainer>();

export async function getInstrumentedBuild() {
  let build = await import("virtual:react-router/server-build");
  for (let [routeId, route] of Object.entries(build.routes)) {
    if (!route?.module) continue;

    // Using manual instrumentation in index route as an example
    if (routeId === "routes/_index") continue;

    let enhancedRouteModule = { ...route?.module };
    route.module = enhancedRouteModule;

    if (enhancedRouteModule.loader) {
      let loader = enhancedRouteModule.loader;
      enhancedRouteModule.loader = async (args: any) => {
        let rrContext = args.context as RouterContextProvider;
        let otelContext = rrContext.get(otelContextContainer);

        if (!otelContext.navigateContext) {
          // This should never happen, but just in case...
          console.warn(
            `No navigate context found for route ${routeId}, running loader without span.`
          );
          return loader(args);
        }

        return otelContext.tracer.startActiveSpan(
          `loader (${routeId})`,
          {},
          otelContext.navigateContext,
          async (span) => {
            try {
              return await loader(args);
            } finally {
              span.end();
            }
          }
        );
      };
    }
  }
  return build;
}

export function getReactRouterOtelEvents(
  events: EventTarget = new EventTarget()
) {
  events.addEventListener("navigate:start", (e) => {
    let evt = e as CustomEvent;
    console.log("✨ navigate:start event", evt.detail.request.url);

    let tracer = otel.trace.getTracer("react-router");
    let rrContext = evt.detail.context as RouterContextProvider;
    let navigateSpan = tracer.startSpan("navigate");
    let navigateContext = otel.trace.setSpan(
      otel.context.active(),
      navigateSpan
    );
    let otelContext = {
      tracer: tracer,
      navigateContext,
      navigateSpan,
      loaderContexts: new Map(),
      loaderSpans: new Map(),
    };
    rrContext.set(otelContextContainer, otelContext);
  });

  events.addEventListener("navigate:end", (e) => {
    let evt = e as CustomEvent;
    console.log("✨ navigate:end event", evt.detail.request.url);

    let rrContext = evt.detail.context as RouterContextProvider;
    rrContext.get(otelContextContainer).navigateSpan.end();
  });

  events.addEventListener("loader:start", (e) => {
    let evt = e as CustomEvent;
    console.log("✨ loader:start event", evt.detail.routeId);

    if (evt.detail.routeId === "routes/_index") {
      let rrContext = evt.detail.context as RouterContextProvider;
      let otelContext = rrContext.get(otelContextContainer);
      let loaderSpan = otelContext.tracer.startSpan(
        `loader (${evt.detail.routeId})`
      );
      let loaderContext = otel.trace.setSpan(
        otelContext.navigateContext,
        loaderSpan
      );

      otelContext.loaderContexts.set(evt.detail.routeId, loaderContext);
      otelContext.loaderSpans.set(evt.detail.routeId, loaderSpan);
    }
  });

  events.addEventListener("loader:end", (e) => {
    let evt = e as CustomEvent;
    console.log("✨ loader:end event", evt.detail.routeId);

    if (evt.detail.routeId === "routes/_index") {
      let rrContext = evt.detail.context as RouterContextProvider;
      let otelContext = rrContext.get(otelContextContainer);
      otelContext.loaderSpans.get(evt.detail.routeId)?.end();
    }
  });

  return events;
}
