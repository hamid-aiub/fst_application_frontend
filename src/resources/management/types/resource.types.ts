export type ResourceFieldType = "text" | "textarea" | "number" | "date" | "datetime" | "boolean" | "select";

export interface ResourceField {
  key: string;
  label: string;
  type: ResourceFieldType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  optionsResource?: string;
  optionLabel?: string;
}

export interface ResourceColumn {
  key: string;
  label: string;
}

export interface ResourceConfig {
  slug: string;
  title: string;
  description: string;
  group: string;
  fields: ResourceField[];
  columns: ResourceColumn[];
  import?: { requiredField: string; label: string };
}

export interface GenericRecord extends Record<string, unknown> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourcePageResult {
  data: GenericRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
