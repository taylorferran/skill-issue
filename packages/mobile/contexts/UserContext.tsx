import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  CreateUserRequest,
  CreateUserResponse 
} from '@learning-platform/shared';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUpdateUser } from '@/api-routes/updateUser';
import { clearAssessedSkills } from '@/utils/assessmentStorage';

// Storage keys
const USER_DATA_KEY = '@skill_issue_user_data';
const USER_CREATED_KEY = '@skill_issue_user_created';

interface AuthData {
  clerkUser: any | null; // Clerk's User type
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

interface UserData extends CreateUserResponse {
  // Backend fields from CreateUserResponse:
  // id, deviceId, timezone, quietHoursStart, quietHoursEnd, 
  // maxChallengesPerDay, createdAt
}

interface UserContextValue {
  // Clerk auth data (direct from hooks)
  auth: AuthData;
  
  // App user settings (CreateUserResponse from backend)
  user: UserData | null;
  
  // Quick access to backend user ID
  userId: string | null;
  
  // User management methods
  setUser: (userData: CreateUserResponse) => Promise<void>;
  updateUser: (partialData: Partial<CreateUserRequest>) => Promise<void>;
  clearUser: () => Promise<void>;
  
  // Backend sync tracking
  isUserCreated: () => boolean;
  markUserAsCreated: () => Promise<void>;
  
  // Initialization state
  isInitialized: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  // Clerk hooks
  const { user: clerkUser, isLoaded } = useClerkUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  
  // Local state
  const [user, setUserState] = useState<UserData | null>(null);
  const [isUserCreatedFlag, setIsUserCreatedFlag] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // API hook for updating user (including push token sync)
  const { execute: updateUserApi } = useUpdateUser();
  const { expoPushToken } = useNotificationStore();
  
  // Initialize: Load user data from AsyncStorage on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('[UserContext] 🔄 Initializing user data from storage...');
        
        // Load user data
        const userDataJson = await AsyncStorage.getItem(USER_DATA_KEY);
        if (userDataJson) {
          try {
            const userData = JSON.parse(userDataJson) as UserData;
            setUserState(userData);
            console.log('[UserContext] ✅ User data loaded from storage');
          } catch (parseError) {
            console.error('[UserContext] ❌ Failed to parse user data:', parseError);
            // Clear corrupted data
            await AsyncStorage.removeItem(USER_DATA_KEY);
            setUserState(null);
          }
        } else {
          console.log('[UserContext] ℹ️ No user data in storage');
          setUserState(null);
        }
        
        // Load user created flag
        const userCreatedFlag = await AsyncStorage.getItem(USER_CREATED_KEY);
        setIsUserCreatedFlag(userCreatedFlag === 'true');
        console.log('[UserContext] 📍 User created flag:', userCreatedFlag === 'true');
        
      } catch (error) {
        console.error('[UserContext] ❌ Error initializing user:', error);
        setUserState(null);
        setIsUserCreatedFlag(false);
      } finally {
        setIsInitialized(true);
        console.log('[UserContext] ✅ Initialization complete');
      }
    };
    
    initializeUser();
  }, []);
  
  // Auto-sync push token to backend when user is authenticated
  useEffect(() => {
    const syncTokenToBackend = async () => {
      // Only sync if:
      // 1. User context is initialized
      // 2. User is created in backend (has userId)
      // 3. We have a push token
      // 4. User is authenticated (clerk user exists)
      // 5. Push token is different from what we have stored
      if (!isInitialized || !isUserCreatedFlag || !user?.id || !expoPushToken || !clerkUser) {
        return;
      }

      // Check if push token is already set to avoid unnecessary API calls
      if (user.deviceId === expoPushToken) {
        console.log('[UserContext] ℹ️ Push token already synced, skipping update');
        return;
      }

      try {
        console.log('[UserContext] 🔄 Auto-syncing push token to backend...');
        
        // Update user with push token using the updateUser endpoint
        await updateUserApi({ 
          userId: user.id,
          deviceId: expoPushToken 
        });
        
        // Update local user state with the new push token
        await updateUser({ deviceId: expoPushToken });
        
        console.log('[UserContext] ✅ Push token synced successfully');
      } catch (error) {
        console.error('[UserContext] ❌ Failed to sync push token:', error);
        // Don't show error to user - this is a background operation
        // User can manually enable from Profile if needed
      }
    };

    syncTokenToBackend();
  }, [isInitialized, isUserCreatedFlag, user?.id, user?.deviceId, expoPushToken, clerkUser]);
  
  // Set entire user object (for initial creation)
  const setUser = async (userData: CreateUserResponse): Promise<void> => {
    try {
      console.log('[UserContext] 💾 Setting user data:', {
        id: userData.id,
        timezone: userData.timezone,
        deviceId: userData.deviceId ? '[Set]' : undefined,
        maxChallengesPerDay: userData.maxChallengesPerDay,
        createdAt: userData.createdAt,
      });
      
      const userDataJson = JSON.stringify(userData);
      await AsyncStorage.setItem(USER_DATA_KEY, userDataJson);
      setUserState(userData as UserData);
      
      console.log('[UserContext] ✅ User data saved to storage');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to set user data:', error);
      throw error;
    }
  };
  
  // Update partial user data (merge with existing)
  const updateUser = async (partialData: Partial<CreateUserRequest>): Promise<void> => {
    try {
      console.log('[UserContext] 🔄 Updating user data:', partialData);
      
      if (!user) {
        console.error('[UserContext] ⚠️ Cannot update: user is null');
        throw new Error('Cannot update user: user data does not exist');
      }
      
      const merged = { ...user, ...partialData };
      const userDataJson = JSON.stringify(merged);
      await AsyncStorage.setItem(USER_DATA_KEY, userDataJson);
      setUserState(merged);
      
      console.log('[UserContext] ✅ User data updated in storage');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to update user data:', error);
      throw error;
    }
  };
  
  // Clear all user data (on sign out)
  const clearUser = async (): Promise<void> => {
    try {
      console.log('[UserContext] 🗑️ Clearing user data...');
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await AsyncStorage.removeItem(USER_CREATED_KEY);
      
      // Clear state
      setUserState(null);
      setIsUserCreatedFlag(false);
      
      // Clear notification store
      const { reset: resetNotifications } = useNotificationStore.getState();
      resetNotifications();
      
      // Clear skills cache
      try {
        const { useSkillsStore } = await import('@/stores/skillsStore');
        const { clearCache: clearSkillsCache } = useSkillsStore.getState();
        clearSkillsCache();
      } catch (error) {
        // Skills store might not exist yet, ignore
        console.log('[UserContext] ⚠️ Skills store not available:', error);
      }
      
      // Clear assessed skills
      try {
        await clearAssessedSkills();
      } catch (error) {
        console.log('[UserContext] ⚠️ Failed to clear assessed skills:', error);
      }
      
      console.log('[UserContext] ✅ User data and caches cleared');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to clear user data:', error);
      throw error;
    }
  };
  
  // Check if user was created on backend
  const isUserCreated = (): boolean => {
    return isUserCreatedFlag;
  };
  
  // Mark user as created on backend
  const markUserAsCreated = async (): Promise<void> => {
    try {
      console.log('[UserContext] 📍 Marking user as created on backend');
      await AsyncStorage.setItem(USER_CREATED_KEY, 'true');
      setIsUserCreatedFlag(true);
      console.log('[UserContext] ✅ User marked as created');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to mark user as created:', error);
      throw error;
    }
  };
  
  // Enhanced signOut with cleanup
  const signOut = async (): Promise<void> => {
    try {
      console.log('[UserContext] 👋 Signing out...');
      
      // Clear user data first
      await clearUser();
      
      // Then sign out from Clerk
      await clerkSignOut();
      
      console.log('[UserContext] ✅ Sign out complete');
    } catch (error) {
      console.error('[UserContext] ❌ Error during sign out:', error);
      throw error;
    }
  };
  
  // Build auth object
  const auth: AuthData = {
    clerkUser,
    isLoading: !isLoaded,
    isAuthenticated: !!clerkUser,
    signOut,
  };
  
  // Context value
  const value: UserContextValue = {
    auth,
    user,
    userId: user?.id || null,
    setUser,
    updateUser,
    clearUser,
    isUserCreated,
    markUserAsCreated,
    isInitialized,
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
