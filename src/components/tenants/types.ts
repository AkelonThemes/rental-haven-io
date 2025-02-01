export interface Property {
  id: string;
  address: string;
}

export interface TenantFormData {
  full_name: string;
  email: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  rent_amount: string;
}