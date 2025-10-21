export interface CarCategory {
  id: string;
  name: string;
  basePrice: number;
}

export interface ServiceType {
  id: string;
  name: string;
  multiplier: number; // Multiplier for base price (e.g., 1.0 for full wash, 0.5 for half wash)
}

export interface Attendant {
  _id: string;
  name: string;
  email: string;
  role: 'attendant' | 'admin';
  photo?: string;
  isAvailable?: boolean; // This will be determined locally or from API
  createdAt: string;
  updatedAt: string;
}

// API Response Types based on the API documentation
export interface ApiBooking {
  _id: string;
  carRegistrationNumber?: string;
  phoneNumber?: string;
  color?: string;
  attendant: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  serviceType?: 'full wash' | 'half wash';
  vehicleType?: string;
  category: 'vehicle' | 'carpet';
  paymentType: 'attendant_cash' | 'admin_cash' | 'admin_till';
  status: 'pending' | 'in progress' | 'completed' | 'cancelled';
  attendantPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiBookingsResponse {
  status: string;
  results: number;
  data: {
    bookings: ApiBooking[];
  };
}

// Legacy interfaces for backward compatibility
export interface CarBooking {
  id: string;
  carRegistration: string;
  categoryId: string;
  serviceTypeId: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingFormData {
  carRegistration: string;
  phoneNumber?: string;
  categoryId: string;
  serviceTypeId: string;
  attendantId: string;
  amount: number;
}

// Predefined car categories and service types
export const CAR_CATEGORIES: CarCategory[] = [
  { id: 'sedan', name: 'Sedan', basePrice: 250 },
  { id: 'truck', name: 'Truck', basePrice: 350 },
  { id: 'motorcycle', name: 'Motorcycle', basePrice: 100 },
];

export const SERVICE_TYPES: ServiceType[] = [
  { id: 'full_wash', name: 'Full Wash', multiplier: 1.0 },
  { id: 'half_wash', name: 'Half Wash', multiplier: 0.5 },
];



// Carpet booking interfaces
export interface CarpetBooking {
  id: string;
  customerName: string;
  phoneNumber: string;
  carpetNumber: string;
  color: string;
  attendantId: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CarpetBookingFormData {
  phoneNumber: string;
  color: string;
  attendantId: string;
  amount: number;
}
