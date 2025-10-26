import { supabase } from './supabase'
import type { CustomGroup } from '@/types/bettingAssistant'

const STORAGE_KEY = 'roulette_custom_groups'

// LocalStorage functions
export const saveCustomGroupsToLocalStorage = (groups: CustomGroup[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error('Failed to save custom groups to localStorage:', error)
  }
}

export const loadCustomGroupsFromLocalStorage = (): CustomGroup[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load custom groups from localStorage:', error)
    return []
  }
}

// Supabase functions
export const saveCustomGroupsToSupabase = async (groups: CustomGroup[], userId: string) => {
  try {
    const { error } = await supabase
      .from('custom_groups')
      .upsert({
        user_id: userId,
        groups: groups,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Failed to save custom groups to Supabase:', error)
    return { success: false, error }
  }
}

export const loadCustomGroupsFromSupabase = async (userId: string): Promise<CustomGroup[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_groups')
      .select('groups')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return empty array
        return []
      }
      throw error
    }

    return data?.groups || []
  } catch (error) {
    console.error('Failed to load custom groups from Supabase:', error)
    return []
  }
}

// Combined save (both localStorage and Supabase)
export const saveCustomGroups = async (groups: CustomGroup[], userId?: string) => {
  // Always save to localStorage
  saveCustomGroupsToLocalStorage(groups)

  // Save to Supabase if user is logged in
  if (userId) {
    await saveCustomGroupsToSupabase(groups, userId)
  }
}

// Combined load (prefer Supabase if logged in, fallback to localStorage)
export const loadCustomGroups = async (userId?: string): Promise<CustomGroup[]> => {
  if (userId) {
    // Try to load from Supabase first
    const supabaseGroups = await loadCustomGroupsFromSupabase(userId)
    if (supabaseGroups.length > 0) {
      // Sync to localStorage
      saveCustomGroupsToLocalStorage(supabaseGroups)
      return supabaseGroups
    }
  }

  // Fallback to localStorage
  return loadCustomGroupsFromLocalStorage()
}
