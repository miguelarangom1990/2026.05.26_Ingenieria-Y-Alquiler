import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Permission } from '../constants/permissions';

interface CanProps {
  permission: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuth();
  
  const hasAccess = Array.isArray(permission) 
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission);

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
