import TeamAuditorPortal from '../../features/team-auditor/TeamAuditorPortal';

export default function TeamAuditorRoute() {
  return (
    <TeamAuditorPortal
      requiredRole="team_auditor"
    />
  );
}
