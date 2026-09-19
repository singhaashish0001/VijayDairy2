export default interface ISettingsResponse {
  id: string;
  shopName: string;
  address: string;
  phone: string;
  gstNumber: string;
  footerNote: string;
  inventoryEnabled: boolean;
}

export interface IPublicSettingsResponse {
  shopName: string;
  address: string;
  phone: string;
  gstNumber: string;
  footerNote: string;
}
