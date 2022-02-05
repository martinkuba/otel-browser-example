import { ConsoleSpanExporter, SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// or if you already have zone.js
// import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep';

const provider = new WebTracerProvider({
  resource: new Resource({
    'service.name': 'browser-test1'
  })
});

const collectorOptions = {
  url: 'http://localhost:4318/v1/traces',
  headers: {}, // an optional object containing custom headers to be sent with each request
  concurrencyLimit: 10, // an optional limit on pending requests
};

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

const exporter = new OTLPTraceExporter(collectorOptions);
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
  contextManager: new ZoneContextManager(),
});

registerInstrumentations({
  instrumentations: [
    new UserInteractionInstrumentation(),
    new XMLHttpRequestInstrumentation()
  ],
});

// and some test
const btn1 = document.createElement('button');
btn1.append(document.createTextNode('btn1'));
btn1.addEventListener('click', () => {
  console.log('clicked');
});
document.querySelector('body').append(btn1);

const btn2 = document.createElement('button');
btn2.append(document.createTextNode('btn2'));
btn2.addEventListener('click', () => {
  getData('https://httpbin.org/get').then(() => {
    getData('https://httpbin.org/get').then(() => {
      console.log('data downloaded 2');
    });
    getData('https://httpbin.org/get').then(() => {
      console.log('data downloaded 3');
    });
    console.log('data downloaded 1');
  });
});
document.querySelector('body').append(btn2);

function getData(url) {
  return new Promise(async (resolve) => {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('Accept', 'application/json');
    req.send();
    req.onload = function () {
      resolve();
    };
  });
}

// now click on buttons