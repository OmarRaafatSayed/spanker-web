/**
 * Authentication service for LoginModal
 * Handles all Supabase auth operations and business logic
 */

export interface AuthResponse {
  success: boolean;
  error?: string;
  session?: any;
  user?: any;
}

export interface LoginModalState {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  loading: boolean;
  error: string | null;
  successMsg: string | null;
  tab: "login" | "signup";
}

export interface AuthServiceProps {
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<AuthResponse>;
  isAr: boolean;
}

export class AuthModalService {
  private login: (email: string, password: string) => Promise<AuthResponse>;
  private signup: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<AuthResponse>;
  private isAr: boolean;

  constructor({
    login,
    signup,
    isAr,
  }: AuthServiceProps) {
    this.login = login;
    this.signup = signup;
    this.isAr = isAr;
  }

  /**
   * Handle login submission
   */
  async handleLoginSubmit(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const res = await this.login(email, password);
      if (res.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error:
            res.error ??
            (this.isAr
              ? "بيانات خاطئة، حاول مجدداً"
              : "Invalid credentials, try again"),
        };
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : this.isAr
              ? "خطأ غير متوقع"
              : "Unexpected error",
      };
    }
  }

  /**
   * Handle signup submission
   */
  async handleSignupSubmit(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<{
    success: boolean;
    error?: string;
    requiresEmailConfirmation?: boolean;
  }> {
    try {
      const res = await this.signup(
        email,
        password,
        firstName || undefined,
        lastName || undefined
      );

      if (res.success) {
        // Check if session was created immediately
        if (res.session && res.user) {
          return { success: true };
        } else {
          // Email confirmation required
          return {
            success: true,
            requiresEmailConfirmation: true,
          };
        }
      } else {
        return {
          success: false,
          error: res.error ?? (this.isAr ? "فشل إنشاء الحساب" : "Signup failed"),
        };
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : this.isAr
              ? "خطأ غير متوقع"
              : "Unexpected error",
      };
    }
  }

  /**
   * Get localized placeholder text
   */
  getPlaceholder(key: string, enText: string, arText: string): string {
    return this.isAr ? arText : enText;
  }

  /**
   * Get localized labels
   */
  getLabel(key: string, enText: string, arText: string): string {
    return this.isAr ? arText : enText;
  }
}
