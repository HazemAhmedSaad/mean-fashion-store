export interface Address {
  _id?: string;
  label: 'home' | 'work' | 'other';
  city: string;
  street: string;
  building?: string;
  notes?: string;
  phoneNumber: string;
  isDefault?: boolean;
}