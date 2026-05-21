export interface Address {
  _id?: string;
  label?: 'home' | 'work' | 'other';
  city?: string;
  street?: string;
  building?: string;
  notes?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}


export interface AddressListResponse {
  success: boolean;
  data: Address[];
}

export interface AddressDeleteResponse {
  success: boolean;
  message: string;
  data: Address[];
}

export interface AddAddressRequest {
  label?: 'home' | 'work' | 'other';
  city: string;
  street: string;
  building?: string;
  notes?: string;
  phoneNumber: string;
  isDefault?: boolean;
}