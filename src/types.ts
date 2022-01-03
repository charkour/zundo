export interface Options {
  include?: string[];
  exclude?: string[];
  allowUnchanged?: boolean;
  historyDepthLimit?: number;
  coolOffDurationMs?: number;
  /**
   * @deprecated Use exclude instead.
   */
  omit?: string[];
}
