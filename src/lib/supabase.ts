/**
 * Supabase-Client. Die Sitzung liegt in AsyncStorage, nicht in expo-sqlite wie im Expo-Guide:
 * AsyncStorage ist schon in der App, so braucht es keinen neuen nativen Build.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/config';
import type { Database } from './database.types';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auf Handys nur im Vordergrund Token erneuern, im Browser macht das supabase-js selbst.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
