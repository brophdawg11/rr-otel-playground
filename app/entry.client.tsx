import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import {
  clientLoggingInstrumentations,
  windowPerfInstrumentations,
} from "./instrumentations";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        unstable_instrumentations={[
          clientLoggingInstrumentations,
          windowPerfInstrumentations,
        ]}
      />
    </StrictMode>
  );
});
