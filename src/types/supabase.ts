export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'tenant' | 'landlord';
          // Add other profile fields as needed
        };
      };
    };
  };
} 