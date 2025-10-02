import * as otel from "@opentelemetry/api";
import type {
  MiddlewareFunction,
  unstable_ClientInstrumentation,
  unstable_ServerInstrumentation,
} from "react-router";

// Logging Instrumentations
export const serverLoggingInstrumentations: unstable_ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      async request(fn, info) {
        let path = new URL(info.request.url).pathname;
        await log(`request ${path}`, fn);
      },
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => log(` middleware (${id})`, fn),
      loader: (fn) => log(`  loader (${id})`, fn),
      action: (fn) => log(`  action (${id})`, fn),
    });
  },
};

export const clientLoggingInstrumentations: unstable_ClientInstrumentation = {
  router({ instrument }) {
    instrument({
      navigate: (fn, info) => log(`navigate ${info.to}`, fn),
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => log(` middleware (${id})`, fn),
      loader: (fn) => log(`  loader (${id})`, fn),
      action: (fn) => log(`  action (${id})`, fn),
    });
  },
};

async function log(label: string, cb: () => Promise<void>) {
  let start = Date.now();
  console.log(`➡️ ${label}`);
  try {
    await cb();
  } finally {
    console.log(`⬅️ ${label} (${Date.now() - start}ms)`);
  }
}

// OTEL Instrumentations
export const tracer = otel.trace.getTracer("react-router");

// This is wired up to the root route to start the root span for the RR handler
export const otelMiddleware: MiddlewareFunction<Response> = (_, next) => {
  return tracer.startActiveSpan("request", async (span) => {
    try {
      return await next();
    } finally {
      span.end();
    }
  });
};

export const otelInstrumentations: unstable_ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      async request(handler, info) {
        await wrapOtelSpan(
          `request handler ${new URL(info.request.url).pathname}`,
          handler
        );
      },
    });
  },
  route({ instrument, id }) {
    instrument({
      async middleware(handler) {
        await wrapOtelSpan(`middleware (${id})`, () => handler());
      },
      async loader(handler) {
        await wrapOtelSpan(`loader (${id})`, () => handler());
      },
      async action(handler) {
        await wrapOtelSpan(`action (${id})`, () => handler());
      },
    });
  },
};

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

// window.performance instrumentations
export const windowPerfInstrumentations: unstable_ClientInstrumentation = {
  router({ instrument }) {
    instrument({
      navigate: (fn, info) => perf(`navigate ${info.to}`, fn),
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => perf(` middleware (${id})`, fn),
      loader: (fn) => perf(`  loader (${id})`, fn),
      action: (fn) => perf(`  action (${id})`, fn),
    });
  },
};

async function perf<T>(label: string, cb: () => Promise<void>) {
  let id = Date.now();
  label = `${label} [${id}]`;
  let startMark = `start ${label}`;
  window?.performance.mark(startMark);
  try {
    await cb();
  } finally {
    let endMark = `end ${label}`;
    window?.performance.mark(endMark);
    window?.performance.measure(label, startMark, endMark);
  }
}
