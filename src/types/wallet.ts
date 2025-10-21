export interface Wallet {
  _id: string;
  attendant: {
    _id: string;
    name: string;
    email: string;
    role: 'attendant' | 'admin';
  };
  balance: number;
  totalEarnings: number;
  totalCommission: number;
  totalCompanyShare: number;
  companyDebt: number;
  lastPaymentDate: string | null;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SystemWallet {
  _id: string;
  totalRevenue: number;
  totalCompanyShare: number;
  totalAttendantPayments: number;
  totalAdminCollections: number;
  totalAttendantCollections: number;
  currentBalance: number;
  lastUpdated: string;
}

export interface DailySummary {
  date: string;
  totalAttendants: number;
  totalBookings: number;
  totalAmount: number;
  totalCommission: number;
  totalCompanyShare: number;
  attendants: AttendantWalletSummary[];
}

export interface AttendantWalletSummary {
  attendantId: string;
  attendantName: string;
  attendantEmail: string;
  totalBookings: number;
  totalAmount: number;
  totalCommission: number;
  totalCompanyShare: number;
  attendantCashBookings: number;
  attendantCashAmount: number;
  companyDebt: number;
}

export interface WalletSummary {
  systemWallet: SystemWallet;
  totalAttendantDebts: number;
  netCompanyBalance: number;
}

export interface SettledWallet {
  attendantId: string;
  attendantName: string;
  attendantEmail: string;
  wallet: {
    _id: string;
    balance: number;
    isPaid: boolean;
  };
  bookingsUpdated: number;
}

export interface SettleResponse {
  status: string;
  message: string;
  data: {
    settledWallets: SettledWallet[];
    errors: any[];
  };
}

export interface WalletApiResponse {
  status: string;
  data: {
    wallet: Wallet;
    date?: string;
  };
}

export interface DailySummaryResponse {
  status: string;
  data: {
    summary: DailySummary;
  };
}

export interface SystemWalletResponse {
  status: string;
  data: {
    systemWallet: SystemWallet;
  };
}

export interface WalletSummaryResponse {
  status: string;
  data: {
    summary: WalletSummary;
  };
}

export interface AllWalletsResponse {
  status: string;
  results: number;
  data: {
    wallets: Wallet[];
    totalDebt: number;
  };
}

export interface UnpaidWalletsResponse {
  status: string;
  results: number;
  data: {
    wallets: Wallet[];
  };
}

export interface DebtSummaryResponse {
  status: string;
  data: {
    summary: {
      totalDebt: number;
      totalAttendants: number;
      attendants: {
        attendantId: string;
        attendantName: string;
        attendantEmail: string;
        debt: number;
      }[];
    };
  };
}

export interface AttendantBookingsResponse {
  status: string;
  results: number;
  data: {
    bookings: {
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
    }[];
  };
}

export interface BookingDetailsResponse {
  status: string;
  data: {
    booking: {
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
    };
  };
}
