import { config } from '@rolimoa/common/config';
import type { MatchState, ScoreState } from '@rolimoa/common/redux';

export const formatTeamString = (
  team: { school?: string; name?: string; shortName?: string } | undefined,
  fallback: string,
): string => {
  if (!team) return fallback;
  const school = team.school?.trim() || '';
  const name = team.name?.trim() || team.shortName?.trim() || '';

  if (school && name) {
    return `${school}「${name}」`;
  }
  if (name) {
    return `「${name}」`;
  }
  if (school) {
    return school;
  }
  return fallback;
};

export const formatVgoalTime = (vgoalTime: number): string => {
  const sec = Math.floor(vgoalTime);
  if (sec >= 60) {
    const min = Math.floor(sec / 60);
    const remainder = sec % 60;
    return remainder !== 0 ? `${min}分${remainder}秒` : `${min}分`;
  }
  return `${sec}秒`;
};

export const generateTweetText = (params: {
  match: MatchState;
  score: ScoreState;
  redScoreValue: number;
  blueScoreValue: number;
  comment?: string;
  hashtags?: string;
}): string => {
  const { match, score, redScoreValue, blueScoreValue, comment = '', hashtags } = params;

  const matchName = match.name?.trim() || '試合結果';

  const redTeamStr = formatTeamString(match.teams.red, '赤チーム');
  const blueTeamStr = formatTeamString(match.teams.blue, '青チーム');

  const redVgoal = score.fields.red.vgoal;
  const blueVgoal = score.fields.blue.vgoal;

  const redScoreStr =
    redVgoal !== undefined ? `Vゴール ${formatVgoalTime(redVgoal)}` : String(redScoreValue);
  const blueScoreStr =
    blueVgoal !== undefined ? `Vゴール ${formatVgoalTime(blueVgoal)}` : String(blueScoreValue);

  // 勝者判定（引き分けはなく、審査員判定等でどちらかが必ず勝利）
  let winnerName = '青チーム';
  if (score.fields.red.winner && !score.fields.blue.winner) {
    winnerName =
      match.teams.red?.name ||
      match.teams.red?.shortName ||
      match.teams.red?.school ||
      '赤チーム';
  } else if (score.fields.blue.winner && !score.fields.red.winner) {
    winnerName =
      match.teams.blue?.name ||
      match.teams.blue?.shortName ||
      match.teams.blue?.school ||
      '青チーム';
  } else if (redVgoal !== undefined && blueVgoal === undefined) {
    winnerName =
      match.teams.red?.name ||
      match.teams.red?.shortName ||
      match.teams.red?.school ||
      '赤チーム';
  } else if (blueVgoal !== undefined && redVgoal === undefined) {
    winnerName =
      match.teams.blue?.name ||
      match.teams.blue?.shortName ||
      match.teams.blue?.school ||
      '青チーム';
  } else if (redScoreValue > blueScoreValue) {
    winnerName =
      match.teams.red?.name ||
      match.teams.red?.shortName ||
      match.teams.red?.school ||
      '赤チーム';
  } else if (blueScoreValue > redScoreValue) {
    winnerName =
      match.teams.blue?.name ||
      match.teams.blue?.shortName ||
      match.teams.blue?.school ||
      '青チーム';
  } else {
    // スコア同点でwinner未指定の場合、青チームをフォールバック
    winnerName =
      match.teams.blue?.name ||
      match.teams.blue?.shortName ||
      match.teams.blue?.school ||
      '青チーム';
  }

  const commentTrimmed = comment.trim();

  const defaultHashtags = config.contest_info.name?.includes('春')
    ? '#関東春ロボコン #春ロボコン'
    : '#関東夏ロボコン #夏ロボコン';
  const finalHashtags = (hashtags ?? defaultHashtags).trim();

  const lines = [
    matchName,
    `${redTeamStr}VS ${blueTeamStr}`,
    `${redScoreStr} - ${blueScoreStr}`,
    `で${winnerName}の勝利です！`,
  ];
  if (commentTrimmed) {
    lines.push(commentTrimmed);
  }
  if (finalHashtags) {
    lines.push(finalHashtags);
  }

  return lines.join('\n');
};
