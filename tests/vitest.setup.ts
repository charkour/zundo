import structuredClone from "@ungap/structured-clone";

// https://github.com/pmndrs/zustand/blob/main/docs/guides/testing.md
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('zustand'); // to make it work like Jest (auto-mocking)
