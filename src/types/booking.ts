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
  id: string;
  name: string;
  isAvailable: boolean;
}

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
  { id: 'suv', name: 'SUV', basePrice: 250 },
  { id: 'hatchback', name: 'Hatchback', basePrice: 250 },
  { id: 'truck', name: 'Truck', basePrice: 1000 },
  { id: 'motorcycle', name: 'Motorcycle', basePrice: 100 },
];

export const SERVICE_TYPES: ServiceType[] = [
  { id: 'full_wash', name: 'Full Wash', multiplier: 1.0 },
  { id: 'half_wash', name: 'Half Wash', multiplier: 0.5 },
];

export const ATTENDANTS: Attendant[] = [
  { id: 'john_doe', name: 'John Doe', isAvailable: true },
  { id: 'jane_smith', name: 'Jane Smith', isAvailable: true },
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
  customerName: string;
  phoneNumber: string;
  carpetNumber: string;
  color: string;
  attendantId: string;
  amount: number;
}
