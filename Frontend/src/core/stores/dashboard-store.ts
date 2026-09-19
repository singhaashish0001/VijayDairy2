/**
 * @file dashboard-store.ts
 * @description MobX store for dashboard aggregate stats.
 */
import { action, makeObservable, observable, observableRef, runInAction } from 'mobx';
import URLConstants from '../../constants/url-constants';
import * as baseService from '../service/base-service';
import type IApiResponse from '../../models/response/IApiResponse';
import type { IApiSuccessResponse } from '../../models/response/IApiResponse';
import type IDashboardStatsResponse from '../../models/response/IDashboardResponse';

export class DashboardStore {
  inProgress = false;
  error = '';
  stats: IDashboardStatsResponse | null = null;

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      error: observable,
      stats: observableRef,
      fetchStatsAsync: action,
    });
  }

  fetchStatsAsync = () => {
    this.inProgress = true;
    this.error = '';
    return baseService
      .getRequest(URLConstants.DashboardStats)
      .then((response: IApiResponse<IApiSuccessResponse<IDashboardStatsResponse>>) => {
        runInAction(() => {
          this.stats = response.data.data;
        });
      })
      .catch((err: string) => {
        runInAction(() => {
          this.error = err;
        });
      })
      .finally(
        action(() => {
          this.inProgress = false;
        }),
      );
  };
}

export const dashboardStore = new DashboardStore();
export default dashboardStore;
