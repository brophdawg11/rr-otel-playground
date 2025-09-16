import * as otel from "@opentelemetry/api";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MiddlewareFunction,
  RouterContextProvider,
  ServerBuild,
} from "react-router";

export const tracer = otel.trace.getTracer("react-router");

type Route = NonNullable<ServerBuild["routes"][string]>;
type RouteModule = Route["module"];

export type RouteModuleEnhancer = (
  module: RouteModule,
  route: Readonly<Route>
) => RouteModule;

export function enhanceRoutes(
  build: ServerBuild,
  enhancers: RouteModuleEnhancer[]
): ServerBuild {
  if (enhancers.length === 0) {
    return build;
  }

  const composed = enhancers.reduce(
    (prev, curr) => (x, id) => prev(curr(x, id), id)
  );

  const routes = Object.fromEntries(
    Object.entries(build.routes).map(([routeId, route]) => {
      if (!route) {
        return [routeId, route];
      }

      return [routeId, { ...route, module: composed(route.module, route) }];
    })
  );

  return { ...build, routes };
}

export function instrumentBuild(build: ServerBuild) {
  // Instrument entry.server default (`handleRequest`) export
  if (build.entry.module.default) {
    let og = build.entry.module.default;
    build.entry.module = {
      ...build.entry.module,
      async default(...args) {
        let res = await wrapOtelSpan("handleRequest (entry.server)", () => {
          return og(...args);
        });
        return res;
      },
    };
  }

  return enhanceRoutes(build, [wrapHandlers]);
}

function wrapHandlers(routeModule: RouteModule, route: Route) {
  let enhancedRouteModule = { ...routeModule };

  // Wrap any existing middlewares
  if (enhancedRouteModule.middleware) {
    enhancedRouteModule.middleware = enhancedRouteModule.middleware.map(
      (middleware, i) => async (args, next) => {
        let res = await wrapOtelSpan(`middleware #${i} (${route.id})`, () => {
          return middleware(args, next);
        });
        return res;
      }
    );
  }

  // Prepend the `otelMiddleware` to the root route to wrap `next()`
  if (route.id === "root") {
    enhancedRouteModule.middleware = [
      otelMiddleware,
      ...(enhancedRouteModule.middleware ?? []),
    ];
  }

  // Wrap loader and action functions
  if (enhancedRouteModule.loader) {
    let og = enhancedRouteModule.loader;
    enhancedRouteModule.loader = (args: LoaderFunctionArgs) =>
      wrapOtelSpan(`loader (${route.id})`, () => og(args));
  }

  if (enhancedRouteModule.action) {
    let og = enhancedRouteModule.action;
    enhancedRouteModule.action = (args: ActionFunctionArgs) =>
      wrapOtelSpan(`action (${route.id})`, () => og(args));
  }

  return enhancedRouteModule;
}

function wrapOtelSpan<T>(label: string, cb: () => T) {
  return tracer.startActiveSpan(label, async (span) => {
    try {
      let val = await cb();
      return val;
    } finally {
      span.end();
    }
  });
}

export const otelMiddleware: MiddlewareFunction<Response> = async (_, next) => {
  let tracer = otel.trace.getTracer("react-router");
  return tracer.startActiveSpan("request", async (span) => {
    try {
      let response = await next();
      return response;
    } finally {
      span.end();
    }
  });
};
