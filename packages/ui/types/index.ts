/**
 * Common types for the NHS Notify Supplier Configuration UI
 *
 * Note: These types can be replaced or extended with types from
 * @nhsdigital/nhs-notify-event-schemas-supplier-config package
 */

export interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

export interface CardProps {
  title: string;
  description: string;
  link: string;
  linkText?: string;
}

export type EnvironmentStatus = "DEVELOPMENT" | "STAGING" | "PRODUCTION";

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}
