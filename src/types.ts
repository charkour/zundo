export interface Options {
  include?: string[];
  exclude?: string[];
  allowUnchanged?: boolean;
  historyDepthLimit?: number;
  coolOffDurationMs?: number;
  // Will be deprecated eventually
  omit?: string[]; // Use exclude
}
