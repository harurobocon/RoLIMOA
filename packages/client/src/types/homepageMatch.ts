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
