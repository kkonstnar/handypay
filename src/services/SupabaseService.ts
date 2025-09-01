import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const SUPABASE_URL = "https://cmovosoqdskzdojsmndh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtb3Zvc29xZHNremRvanNtbmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTQ3ODAsImV4cCI6MjA3MTg5MDc4MH0.uWZMsJcCrkCQcQuw3MxEoWBsKCbPlgU4dyPOHTzBfhg";

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User database operations
export interface DatabaseUser {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  auth_provider: "apple";
  apple_user_id: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_completed: boolean;
  face_id_enabled: boolean;
  safety_pin_enabled: boolean;
  safety_pin_hash: string | null;
  member_since: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseUserService {
  /**
   * Create or update a user in the database
   */
  static async upsertUser(userData: {
    id: string;
    email: string | null;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    authProvider: "apple";
    memberSince: string;
    stripeAccountId?: string | null;
    stripeOnboardingCompleted?: boolean;
    faceIdEnabled?: boolean;
    safetyPinEnabled?: boolean;
    safetyPinHash?: string | null;
  }): Promise<DatabaseUser | null> {
    try {
      const dbUser: Omit<DatabaseUser, "created_at" | "updated_at"> = {
        id: userData.id,
        email: userData.email,
        full_name: userData.fullName,
        first_name: userData.firstName,
        last_name: userData.lastName,
        auth_provider: userData.authProvider,
        apple_user_id: userData.authProvider === "apple" ? userData.id : null,
        stripe_account_id: userData.stripeAccountId || null,
        stripe_onboarding_completed:
          userData.stripeOnboardingCompleted || false,
        face_id_enabled: userData.faceIdEnabled || false,
        safety_pin_enabled: userData.safetyPinEnabled || false,
        safety_pin_hash: userData.safetyPinHash || null,
        member_since: userData.memberSince,
      };

      const { data, error } = await supabase
        .from("users")
        .upsert(dbUser, {
          onConflict: "id",
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase upsert user error:", error);
        return null;
      }

      console.log("User successfully saved to Supabase:", data);
      return data;
    } catch (error) {
      console.error("Error upserting user to Supabase:", error);
      return null;
    }
  }

  /**
   * Get a user from the database
   */
  static async getUser(userId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Supabase get user error:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting user from Supabase:", error);
      return null;
    }
  }

  /**
   * Check if a user exists by email
   */
  static async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - user doesn't exist
          return null;
        }
        console.error("Supabase get user by email error:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting user by email from Supabase:", error);
      return null;
    }
  }

  /**
   * Update user's last login time
   */
  static async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Supabase update last login error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating last login:", error);
      return false;
    }
  }

  /**
   * Delete a user from the database
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Supabase delete user error:", error);
        return false;
      }

      console.log("User successfully deleted from Supabase");
      return true;
    } catch (error) {
      console.error("Error deleting user from Supabase:", error);
      return false;
    }
  }

  /**
   * Update user's Stripe account information
   */
  static async updateStripeAccount(
    userId: string,
    stripeAccountId: string,
    onboardingCompleted: boolean = true
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_onboarding_completed: onboardingCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Supabase update Stripe account error:", error);
        return false;
      }

      console.log("User Stripe account information updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating Stripe account information:", error);
      return false;
    }
  }

  /**
   * Update user's Face ID preference
   */
  static async updateFaceIdEnabled(
    userId: string,
    faceIdEnabled: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          face_id_enabled: faceIdEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Supabase update Face ID enabled error:", error);
        return false;
      }

      console.log("User Face ID preference updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating Face ID preference:", error);
      return false;
    }
  }

  /**
   * Update user's Safety PIN
   */
  static async updateSafetyPin(
    userId: string,
    pinHash: string,
    enabled: boolean = true
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          safety_pin_hash: pinHash,
          safety_pin_enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Supabase update Safety PIN error:", error);
        return false;
      }

      console.log("User Safety PIN updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating Safety PIN:", error);
      return false;
    }
  }

  /**
   * Update user's Safety PIN preference (enable/disable without changing PIN)
   */
  static async updateSafetyPinEnabled(
    userId: string,
    safetyPinEnabled: boolean
  ): Promise<boolean> {
    try {
      const updateData: any = {
        safety_pin_enabled: safetyPinEnabled,
        updated_at: new Date().toISOString(),
      };

      // If disabling, also clear the PIN hash
      if (!safetyPinEnabled) {
        updateData.safety_pin_hash = null;
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (error) {
        console.error("Supabase update Safety PIN enabled error:", error);
        return false;
      }

      console.log("User Safety PIN preference updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating Safety PIN preference:", error);
      return false;
    }
  }

  /**
   * Verify user's Safety PIN
   */
  static async verifySafetyPin(
    userId: string,
    pinHash: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("safety_pin_hash")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Supabase verify Safety PIN error:", error);
        return false;
      }

      return data.safety_pin_hash === pinHash;
    } catch (error) {
      console.error("Error verifying Safety PIN:", error);
      return false;
    }
  }
}
