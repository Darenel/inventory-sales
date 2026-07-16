import { useAuth } from './AuthContext';
import { UserRole } from './storage';

type RoleGateProps = {
  allow: UserRole[];
  children: React.ReactNode;
};

export function RoleGate({ allow, children }: RoleGateProps) {
  const { role } = useAuth();

  if (!role || !allow.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
