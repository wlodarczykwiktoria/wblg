import '@testing-library/jest-dom';
import 'whatwg-fetch';

declare global {
  interface Array<T> {
    flat<U>(this: U[][], depth?: 1): U[];
    flat(depth?: number): unknown[];
  }

  interface ReadonlyArray<T> {
    flat<U>(this: ReadonlyArray<ReadonlyArray<U>>, depth?: 1): U[];
    flat(depth?: number): unknown[];
  }
}
const g = globalThis as unknown as {
  structuredClone?: <T>(value: T) => T;
  ResizeObserver?: typeof ResizeObserver;
  PointerEvent?: typeof PointerEvent;
};

if (typeof g.structuredClone === 'undefined') {
  g.structuredClone = <T>(value: T): T => {
    if (value === null || typeof value !== 'object') return value;
    return JSON.parse(JSON.stringify(value)) as T;
  };
}

if (typeof g.ResizeObserver === 'undefined') {
  g.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
}

if (typeof g.PointerEvent === 'undefined') {
  g.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Element.prototype.scrollIntoView = function scrollIntoView() {};
