import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateUserInput } from '@learning-platform/shared';
import { useNotificationStore } from '@/stores/notificationStore';

// Storage keys
const USER_DATA_KEY = '@skill_issue_user_data';
const USER_CREATED_KEY = '@skill_issue_user_created';

interface AuthData {
  clerkUser: any | null; // Clerk's User type
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

interface UserContextValue {
  // Clerk auth data (direct from hooks)
  auth: AuthData;
  
  // App user settings (CreateUserSchema)
  user: CreateUserInput | null;
  
  // User management methods
  setUser: (userData: CreateUserInput) => Promise<void>;
  updateUser: (partialData: Partial<CreateUserInput>) => Promise<void>;
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
  const [user, setUserState] = useState<CreateUserInput | null>(null);
  const [isUserCreatedFlag, setIsUserCreatedFlag] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Initialize: Load user data from AsyncStorage on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('[UserContext] 🔄 Initializing user data from storage...');
        
        // Load user data
        const userDataJson = await AsyncStorage.getItem(USER_DATA_KEY);
        if (userDataJson) {
          try {
            const userData = JSON.parse(userDataJson) as CreateUserInput;
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
  
  // Set entire user object (for initial creation)
  const setUser = async (userData: CreateUserInput): Promise<void> => {
    try {
      console.log('[UserContext] 💾 Setting user data:', {
        timezone: userData.timezone,
        deviceId: userData.deviceId ? '[Set]' : undefined,
        maxChallengesPerDay: userData.maxChallengesPerDay,
      });
      
      const userDataJson = JSON.stringify(userData);
      await AsyncStorage.setItem(USER_DATA_KEY, userDataJson);
      setUserState(userData);
      
      console.log('[UserContext] ✅ User data saved to storage');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to set user data:', error);
      throw error;
    }
  };
  
  // Update partial user data (merge with existing)
  const updateUser = async (partialData: Partial<CreateUserInput>): Promise<void> => {
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
      
      console.log('[UserContext] ✅ User data cleared');
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
