export interface AppSettings {
  company_name: string;
  default_currency: string;
  failed_login_attempts_limit: number;
  timezone: string;
  date_format: string;
}

export const mockAppSettings: AppSettings = {
  company_name: "AssetFlow Enterprise Inc.",
  default_currency: "USD ($)",
  failed_login_attempts_limit: 5,
  timezone: "America/New_York",
  date_format: "YYYY-MM-DD",
};
