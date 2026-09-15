export interface HomepageMatchTeam {
  team_no: number;
  school_name: string;
  team_name: string;
  display_name: string;
}

export interface HomepageMatch {
  id: number;
  match_id: string; // e.g. "MA-1", "MK-1"
  match_no: number; // e.g. 1
  status: string; // "scheduled" | "completed"
  score_red?: number | null;
  score_blue?: number | null;
  winner_side?: string | null;
  team_red: HomepageMatchTeam;
  team_blue: HomepageMatchTeam;
}

export function formatHomepageTeamName(team?: HomepageMatchTeam | null): string {
  if (!team) return '';
  const no = team.team_no != null && team.team_no !== undefined && team.team_no > 0
    ? String(team.team_no).padStart(2, '0')
    : '';
  if (no && team.team_name) {
    return `${no}_${team.team_name}`;
  }
  return team.team_name || team.display_name || team.school_name || '';
}

