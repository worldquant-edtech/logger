import { trace, context as apiContext } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';

import {
  ConsoleSpanExporter,
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KoaInstrumentation } from '@opentelemetry/instrumentation-koa';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';

import { isTTY } from './utils/env';

export function useGoogleCloudTracing(options = {}) {
  // https://cloud.google.com/trace/docs/setup/nodejs-ot#gke
  // https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-node

  const { ignoreIncomingPaths = [] } = options;

  const provider = new NodeTracerProvider();

  if (isTTY) {
    provider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    );
  } else {
    provider.addSpanProcessor(new BatchSpanProcessor(new TraceExporter()));
  }

  registerInstrumentations({
    instrumentations: [
      new MongooseInstrumentation(),
      new KoaInstrumentation(),
      new HttpInstrumentation({
        ignoreIncomingPaths,
      }),
    ],
    tracerProvider: provider,
  });

  provider.register();
}

export function getTracePayload() {
  const context = trace.getSpanContext(apiContext.active());
  if (context) {
    const { spanId, traceId, traceFlags } = context;
    return {
      'logging.googleapis.com/spanId': spanId,
      'logging.googleapis.com/trace': traceId,
      'logging.googleapis.com/trace_sampled': traceFlags === 1,
    };
  }
}
