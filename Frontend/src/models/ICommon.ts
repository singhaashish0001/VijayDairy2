/**
 * @file ICommon.ts
 * @description Shared interfaces reused across stores/components.
 */

/** Standard async-operation state used as the initial state for MobX observables. */
export interface IObservableInitialState {
  success: boolean;
  error: string;
  inProgress: boolean;
}
