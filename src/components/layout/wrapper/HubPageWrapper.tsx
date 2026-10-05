import React from 'react';

interface HubPageWrapperProps {
  slugHub?: string;
  children: React.ReactNode;
}

export default function HubPageWrapper({
  children,
}: HubPageWrapperProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {children}
    </div>
  );
}
