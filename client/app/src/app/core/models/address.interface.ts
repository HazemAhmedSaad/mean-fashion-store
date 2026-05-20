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


interface AddressListResponse {
  success: boolean;
  data: Address[];
}

interface AddressDeleteResponse {
  success: boolean;
  message: string;
  data: Address[];
}export interface AddAddressRequest {
  label?: 'home' | 'work' | 'other';
  city: string;
  street: string;
  building?: string;
  notes?: string;
  phoneNumber: string;
  isDefault?: boolean;
}