// src/setupTests.ts

import '@testing-library/jest-dom';
import 'whatwg-fetch';

const g = globalThis as unknown as {
  structuredClone?: <T>(value: T) => T;
};

if (typeof g.structuredClone === 'undefined') {
  g.structuredClone = (<T>(value: T): T => {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }) as <T>(value: T) => T;
}
