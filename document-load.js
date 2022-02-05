import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';

import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { LongTaskInstrumentation } from '@opentelemetry/instrumentation-long-task';

import { ConsoleSpanExporter, SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
const collectorOptions = {
  url: 'http://localhost:4318/v1/traces',
  headers: {}, // an optional object containing custom headers to be sent with each request
  concurrencyLimit: 10, // an optional limit on pending requests
};
const exporter = new OTLPTraceExporter(collectorOptions);

// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
// const collectorOptions = {
//   url: 'http://localhost:4318/v1/traces',
// };
// const exporter = new OTLPTraceExporter(collectorOptions);

const provider = new WebTracerProvider({
  resource: new Resource({
    'service.name': 'browser-test1'
  })
});

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
  // The maximum queue size. After the size is reached spans are dropped.
  maxQueueSize: 100,
  // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
  maxExportBatchSize: 10,
  // The interval between two consecutive exports
  scheduledDelayMillis: 500,
  // How long the export can run before it is cancelled
  exportTimeoutMillis: 30000,
}));

provider.register({
  // Changing default contextManager to use ZoneContextManager - supports asynchronous operations - optional
  contextManager: new ZoneContextManager(),
});

// Registering instrumentations
registerInstrumentations({
  instrumentations: [
    new DocumentLoadInstrumentation(),
    new FetchInstrumentation(),
    new XMLHttpRequestInstrumentation(),
    new UserInteractionInstrumentation(),
    new LongTaskInstrumentation()
  ],
});
