import { supabase } from './supabase'

export interface AuthError {
  message: string
}

export interface AuthResult {
  success: boolean
  error?: AuthError
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { success: false, error: { message: error.message } }
    }

    if (data.user) {
      return { success: true }
    }

    return { success: false, error: { message: 'Sign up failed' } }
  } catch (error) {
    return { success: false, error: { message: 'An unexpected error occurred' } }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: { message: error.message } }
    }

    if (data.user) {
      return { success: true }
    }

    return { success: false, error: { message: 'Sign in failed' } }
  } catch (error) {
    return { success: false, error: { message: 'An unexpected error occurred' } }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: { message: error.message } }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: { message: 'An unexpected error occurred' } }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}
