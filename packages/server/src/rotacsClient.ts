export async function notifyRotacsMatchStatus(storeState: Record<string, unknown>) {
  try {
    const rotacsUrl = process.env.ROTACS_API_URL || 'http://localhost:3000';
    const rotacsSecret = process.env.ROTACS_API_SECRET?.trim();

    // biome-ignore lint/suspicious/noExplicitAny: state typing
    const matchState = (storeState as any)?.match;
    // biome-ignore lint/suspicious/noExplicitAny: state typing
    const phaseState = (storeState as any)?.phase?.current;

    const payload = {
      match_id: matchState?.matchId || matchState?.name || undefined,
      match_no: matchState?.matchNo || undefined,
      current_phase: phaseState?.id || 'in_progress',
      is_confirmed: matchState?.isConfirmed || false,
      team_red: matchState?.teams?.red
        ? {
            team_no: Number.parseInt(matchState.teams.red.id || '0', 10) || 0,
            school_name: matchState.teams.red.school || '',
            team_name: matchState.teams.red.name || '',
            display_name: matchState.teams.red.shortName || '',
          }
        : undefined,
      team_blue: matchState?.teams?.blue
        ? {
            team_no: Number.parseInt(matchState.teams.blue.id || '0', 10) || 0,
            school_name: matchState.teams.blue.school || '',
            team_name: matchState.teams.blue.name || '',
            display_name: matchState.teams.blue.shortName || '',
          }
        : undefined,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (rotacsSecret) {
      headers['X-RoLIMOA-Secret'] = rotacsSecret;
    }

    const res = await fetch(`${rotacsUrl}/api/match/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[RoLIMOA->rotacs Webhook] Failed with status ${res.status}`);
    } else {
      console.log('[RoLIMOA->rotacs Webhook] Sent match status to rotacs');
    }
  } catch (err: unknown) {
    console.error('[RoLIMOA->rotacs Webhook] Error sending notification:', err);
  }
}
