import structuredClone from "@ungap/structured-clone";

if (!("structuredClone" in globalThis)) {
    // @ts-expect-error
    globalThis.structuredClone = structuredClone;
  }

// https://github.com/pmndrs/zustand/blob/main/docs/guides/testing.md
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('zustand'); // to make it work like Jest (auto-mocking)
