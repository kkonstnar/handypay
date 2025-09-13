import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";

interface BanProtectionOptions {
  showOverlay?: boolean;
  disableFeatures?: boolean;
  onContactSupport?: () => void;
}

export const useBanProtection = (options: BanProtectionOptions = {}) => {
  const { user, isBanned } = useUser();
  const [showBanOverlay, setShowBanOverlay] = useState(false);

  // Show overlay when user becomes banned
  useEffect(() => {
    if (isBanned && options.showOverlay) {
      setShowBanOverlay(true);
    } else if (!isBanned) {
      setShowBanOverlay(false);
    }
  }, [isBanned, options.showOverlay]);

  // Features that should be disabled for banned users
  const disabledFeatures = {
    canScanPayments: !isBanned,
    canCreatePaymentLinks: !isBanned,
    canRequestPayouts: !isBanned,
    canAccessSettings: true, // Allow access to settings for support
    canContactSupport: true, // Always allow contacting support
  };

  return {
    isBanned,
    disabledFeatures,
    showBanOverlay,
    setShowBanOverlay,
    banDetails: user?.isBanned
      ? {
          reason: user.banReason,
          type: user.banType,
        }
      : null,
    user,
    onContactSupport: options.onContactSupport,
  };
};

// Utility function to check if a feature is allowed for the current user
export const useFeatureAccess = (
  feature: keyof ReturnType<typeof useBanProtection>["disabledFeatures"]
) => {
  const { disabledFeatures } = useBanProtection();
  return disabledFeatures[feature];
};
