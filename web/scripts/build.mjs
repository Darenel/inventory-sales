import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';

const require = createRequire(import.meta.url);
const childProcess = require('node:child_process');

childProcess.exec = (_command, options, callback) => {
  const done = typeof options === 'function' ? options : callback;
  const processStub = new EventEmitter();

  processStub.stdout = new EventEmitter();
  processStub.stderr = new EventEmitter();
  processStub.kill = () => true;

  queueMicrotask(() => done?.(null, '', ''));

  return processStub;
};

const { build } = await import('vite');

await build({ configLoader: 'runner' });
