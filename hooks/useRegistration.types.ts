export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegistrationResult {
  success: boolean;
  userId?: string;
  emailConfirmed?: boolean;
  error?: string;
}

export interface UseRegistrationReturn {
  register: (data: RegistrationData) => Promise<RegistrationResult>;
  checkEmailExists: (email: string) => Promise<boolean>;
  createUserAccount: (data: RegistrationData) => Promise<RegistrationResult>;
  handlePostRegistration: (result: RegistrationResult, email: string) => void;
  isLoading: boolean;
  error: string | null;
  registrationComplete: boolean;
  resetError: () => void;
}
