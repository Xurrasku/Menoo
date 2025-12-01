/**
 * Helper functions to parse and handle Supabase authentication errors
 */

export type AuthErrorType =
  | "oauth_account"
  | "email_not_confirmed"
  | "invalid_credentials"
  | "email_already_registered"
  | "weak_password"
  | "network_error"
  | "unknown";

export interface ParsedAuthError {
  type: AuthErrorType;
  message: string;
  originalMessage: string;
}

/**
 * Checks if an error indicates the account was created with OAuth
 */
function isOAuthAccountError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes("email not confirmed") ||
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("user not found") ||
    lowerMessage.includes("no user found")
  );
}

/**
 * Checks if an error indicates the email is already registered
 */
function isEmailAlreadyRegisteredError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes("user already registered") ||
    lowerMessage.includes("email already registered") ||
    lowerMessage.includes("already been registered")
  );
}

/**
 * Checks if an error is a network/connection error
 */
function isNetworkError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("enotfound") ||
    lowerMessage.includes("econnrefused")
  );
}

/**
 * Parses a Supabase authentication error and returns a user-friendly message
 */
export function parseAuthError(error: Error | { message: string }): ParsedAuthError {
  const originalMessage = error.message;
  const lowerMessage = originalMessage.toLowerCase();

  // Network errors
  if (isNetworkError(originalMessage)) {
    return {
      type: "network_error",
      message: "Error de connexió. Torna-ho a intentar més tard.",
      originalMessage,
    };
  }

  // OAuth account errors (user trying email/password on OAuth account)
  if (isOAuthAccountError(originalMessage)) {
    return {
      type: "oauth_account",
      message:
        "Aquest compte s'ha creat amb Google. Utilitza l'opció d'iniciar sessió amb Google.",
      originalMessage,
    };
  }

  // Email already registered - check if it might be from OAuth
  if (isEmailAlreadyRegisteredError(originalMessage)) {
    // Try to provide helpful guidance based on context
    // In sign-up context, suggest using OAuth or sign-in
    return {
      type: "email_already_registered",
      message:
        "Aquest email ja està registrat. Si vas crear el compte amb Google, utilitza l'opció d'iniciar sessió amb Google. Si no, intenta iniciar sessió amb email i contrasenya.",
      originalMessage,
    };
  }

  // Email not confirmed
  if (lowerMessage.includes("email not confirmed") || lowerMessage.includes("email_not_confirmed")) {
    return {
      type: "email_not_confirmed",
      message:
        "Has de verificar el teu email abans d'iniciar sessió. Revisa la teva bústia i clica l'enllaç de verificació.",
      originalMessage,
    };
  }

  // Weak password
  if (lowerMessage.includes("password") && lowerMessage.includes("weak")) {
    return {
      type: "weak_password",
      message: "La contrasenya és massa feble. Utilitza una contrasenya més segura.",
      originalMessage,
    };
  }

  // Invalid credentials (generic)
  if (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("incorrect") ||
    lowerMessage.includes("wrong")
  ) {
    return {
      type: "invalid_credentials",
      message: "Email o contrasenya incorrectes. Torna-ho a intentar.",
      originalMessage,
    };
  }

  // Unknown error - return original message
  return {
    type: "unknown",
    message: originalMessage,
    originalMessage,
  };
}

