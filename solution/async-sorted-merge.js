"use strict";

const crypto = require("node:crypto");
const { MinHeap } = require("data-structure-typed");
// const CircularBuffer = require("circular-buffer");
const CircularBuffer = require("mnemonist/circular-buffer");

// Print all entries, across all of the *async* sources, in chronological order.
// Setting the buffer capacity to more than 1 will result in duplicate logs due to `popAsync()` always resolving with the most recent log.
const BUFFER_CAPACITY = 1;

module.exports = async (logSources, printer) => {
  const minHeap = new MinHeap((a, b) => a.log.date - b.log.date);
  const bufferedSources = await Promise.all(
    logSources.map(async (logSource, i) => {
      // Push the first log from each source directly onto the heap as there is no need for it to go through the buffer
      minHeap.push({
        log: await logSource.popAsync(),
        sourceIndex: i,
      });

      const bufferedSource = new CircularBuffer(Array, BUFFER_CAPACITY);
      bufferedSource.push({
        log: logSource.popAsync(),
        sourceIndex: i,
      });

      return bufferedSource;
    })
  );

  while (minHeap.size > 0) {
    const { log, sourceIndex } = minHeap.pop();
    printer.print(log);

    const buffer = bufferedSources[sourceIndex];
    const next = buffer.shift();
    const nextLog = await next?.log;

    // `await` log on removal from buffer for increased performance
    if (nextLog) {
      minHeap.push({
        log: nextLog,
        sourceIndex,
      });

      while (buffer.size < buffer.capacity) {
        buffer.push({ log: logSources[sourceIndex].popAsync(), sourceIndex });
      }
    }
  }

  printer.done();
};
