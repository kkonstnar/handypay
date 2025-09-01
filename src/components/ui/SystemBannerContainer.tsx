import React, { useState } from 'react';
import SystemBanner from './SystemBanner';

interface SystemBannerContainerProps {
  message?: string;
  type?: 'warning' | 'error' | 'info';
  showIcon?: boolean;
  initiallyVisible?: boolean;
}

export default function SystemBannerContainer({
  message = "You are not connected to the internet",
  type = 'warning',
  showIcon = true,
  initiallyVisible = true
}: SystemBannerContainerProps): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(initiallyVisible);

  if (!isVisible) {
    return null;
  }

  return (
    <SystemBanner
      message={message}
      type={type}
      showIcon={showIcon}
      onDismiss={() => setIsVisible(false)}
      dismissible={true}
    />
  );
}