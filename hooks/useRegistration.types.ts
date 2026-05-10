// useRegistration.types.ts — useRegistration.types module.
//
// exports: RegistrationData | RegistrationResult | UseRegistrationReturn
// used_by: hooks\usePostRegistration.ts
//         hooks\useRegistration.ts
//         hooks\useRegistrationActions.ts
//         hooks\useRegistrationOrchestrator.ts
//         hooks\useRegistrationState.ts
// rules:   All exported interfaces in this module expose the contract for the registration subsystem and must remain backward-compatible with all five listed consumer hooks.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
