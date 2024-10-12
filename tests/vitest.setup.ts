// https://github.com/pmndrs/zustand/blob/main/docs/guides/testing.md
import '@testing-library/jest-dom';

vi.mock('zustand'); // to make it work like Jest (auto-mocking)
