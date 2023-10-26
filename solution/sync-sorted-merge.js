"use strict";

const { MinHeap } = require("data-structure-typed");

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  const minHeap = new MinHeap((a, b) => a.log.date - b.log.date);

  // Seed min heap with first log from each source
  for (let i = 0; i < logSources.length; i++) {
    const log = logSources[i].pop();
    if (log) {
      minHeap.push({ log, sourceIndex: i });
    }
  }

  while (minHeap.size > 0) {
    const oldest = minHeap.pop();
    printer.print(oldest.log);

    const oldestIndex = oldest.sourceIndex;
    const nextLog = logSources[oldestIndex].pop();

    // Add a log to the min heap, if one exists, otherwise decrement the number of unemptied log sources
    if (nextLog) {
      minHeap.push({ log: nextLog, sourceIndex: oldestIndex });
    }
  }

  printer.done();
};
