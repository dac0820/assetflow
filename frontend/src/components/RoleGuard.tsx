import React from "react";
import { useAuthStore } from "../stores/authStore";

interface RoleGuardProps {
  allowedRoles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  fallback = <div className="p-8 text-center text-red-500 font-semibold">403 Forbidden: Insufficient Permissions</div>,
  children,
}) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
