export interface PaymentFormData {
  amount: number;
  payment_type: 'rent' | 'subscription';
  property_id?: string;
  tenant_id?: string;
  rent_period_start?: string;
  rent_period_end?: string;
}

export interface Property {
  id: string;
  address: string;
}

export interface TenantProfile {
  full_name: string | null;
}

export interface Tenant {
  id: string;
  profile: TenantProfile;
}