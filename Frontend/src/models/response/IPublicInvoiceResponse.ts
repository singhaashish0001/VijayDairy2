import type IInvoiceResponse from './IInvoiceResponse';
import type { IPublicSettingsResponse } from './ISettingsResponse';

export default interface IPublicInvoiceResponse {
  invoice: IInvoiceResponse;
  settings: IPublicSettingsResponse;
}
