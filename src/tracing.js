const api = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');

const { ConsoleSpanExporter, BatchSpanProcessor, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { KoaInstrumentation } = require('@opentelemetry/instrumentation-koa');
const { MongooseInstrumentation } = require('@opentelemetry/instrumentation-mongoose');

const { isTTY } = require('./utils/env');

function useGoogleCloudTracing(options = {}) {
  // https://cloud.google.com/trace/docs/setup/nodejs-ot#gke
  // https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-node

  const { ignoreIncomingPaths = [] } = options;

  const provider = new NodeTracerProvider();

  if (isTTY) {
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  } else {
    provider.addSpanProcessor(new BatchSpanProcessor(new TraceExporter()));
  }

  registerInstrumentations({
    instrumentations: [
      new MongooseInstrumentation(),
      new KoaInstrumentation(),
      new HttpInstrumentation({
        http: {
          ignoreIncomingPaths,
        },
      }),
    ],
    tracerProvider: provider,
  });

  provider.register();
}

function getTracePayload() {
  const context = api.trace.getSpanContext(api.context.active());
  if (context) {
    const { spanId, traceId, traceFlags } = context;
    return {
      'logging.googleapis.com/spanId': spanId,
      'logging.googleapis.com/trace': traceId,
      'logging.googleapis.com/trace_sampled': traceFlags === 1,
    };
  }
}

module.exports = {
  getTracePayload,
  useGoogleCloudTracing,
};
