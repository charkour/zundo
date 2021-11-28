export interface Options {
  // TODO: improve this type. ignored should only be fields on TState
  omit?: string[];
  allowUnchanged?: boolean;
  historyDepthLimit?: number;
  coolOffDurationMs?: number;
}
