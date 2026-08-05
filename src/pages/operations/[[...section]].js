import OwnerPortal from '../../features/owner/OwnerPortal';
import { USER_ROLES } from '../../shared/config/roles';

export default function OperationsRoute() {
  return <OwnerPortal portalRole={USER_ROLES.OPERATIONS} />;
}
