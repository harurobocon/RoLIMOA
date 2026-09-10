import type { ScoreState } from '@rolimoa/common/redux';

export type JudgeResult = {
  winner: 'red' | 'blue' | 'none';
  reason: string;
  requiresRefereeDecision: boolean; // 審判の判定が必要な状態かどうか
  priorityLevel?: number; // ルールの優先度レベル
};

/**
 * 大会ごとの勝敗判定ルール（同点時の優先順位判定など）をここに実装します。
 *
 * 【関東夏ロボコン2026 ルール2.13.1「勝敗の決定」】
 * 1) 「築城」（Vゴール）を先に達成したチーム
 * 2) 得点の高いチーム
 * 3) 2.10.1のより下にある得点をより多く獲得したチーム
 *    - 城3段目(70点) -> 城2段目(20点) -> 城1段目(10点) -> 土台上の建材(5点) -> 建材接触(10点)
 * 4) 審判の判定
 *
 * 今後、別の大会ルールに変更する場合はこの関数のロジックを更新してください。
 */
export function judgeWinner(
  score: ScoreState,
  redTotalScore: number,
  blueTotalScore: number,
): JudgeResult {
  const redField = score.fields.red;
  const blueField = score.fields.blue;

  const redVgoal = redField.vgoal;
  const blueVgoal = blueField.vgoal;

  // 1. Vゴール判定（早いチームが勝利）
  if (redVgoal !== undefined || blueVgoal !== undefined) {
    if (redVgoal !== undefined && blueVgoal === undefined) {
      return { winner: 'red', reason: 'Vゴール', requiresRefereeDecision: false, priorityLevel: 1 };
    }
    if (blueVgoal !== undefined && redVgoal === undefined) {
      return {
        winner: 'blue',
        reason: 'Vゴール',
        requiresRefereeDecision: false,
        priorityLevel: 1,
      };
    }
    if (redVgoal !== undefined && blueVgoal !== undefined) {
      if (redVgoal < blueVgoal) {
        return {
          winner: 'red',
          reason: 'Vゴール(タイム差)',
          requiresRefereeDecision: false,
          priorityLevel: 1,
        };
      }
      if (blueVgoal < redVgoal) {
        return {
          winner: 'blue',
          reason: 'Vゴール(タイム差)',
          requiresRefereeDecision: false,
          priorityLevel: 1,
        };
      }
    }
  }

  // 2. 得点差判定
  if (redTotalScore > blueTotalScore) {
    return { winner: 'red', reason: '得点差', requiresRefereeDecision: false, priorityLevel: 2 };
  }
  if (blueTotalScore > redTotalScore) {
    return { winner: 'blue', reason: '得点差', requiresRefereeDecision: false, priorityLevel: 2 };
  }

  // 3. ルール固有の同点時優先順位判定（夏26: 2.10.1のより下にある得点項目）
  // 優先順位: 城3段目 -> 城2段目 -> 城1段目 -> 土台上の建材 -> 建材接触
  const breakdownPriorityKeys: { key: string; label: string }[] = [
    { key: 'castle_tier3', label: '城3段目(70点)' },
    { key: 'castle_tier2', label: '城2段目(20点)' },
    { key: 'castle_tier1', label: '城1段目(10点)' },
    { key: 'material_on_base', label: '土台上の建材(5点)' },
    { key: 'contact_material', label: '建材接触(10点)' },
  ];

  const redTasks = redField.tasks || {};
  const blueTasks = blueField.tasks || {};

  for (const item of breakdownPriorityKeys) {
    const redCount = redTasks[item.key] || 0;
    const blueCount = blueTasks[item.key] || 0;

    if (redCount > blueCount) {
      return {
        winner: 'red',
        reason: `${item.label}獲得数`,
        requiresRefereeDecision: false,
        priorityLevel: 3,
      };
    }
    if (blueCount > redCount) {
      return {
        winner: 'blue',
        reason: `${item.label}獲得数`,
        requiresRefereeDecision: false,
        priorityLevel: 3,
      };
    }
  }

  // 4. 審判の判定（全条件で決着がつかない場合）
  return {
    winner: 'none',
    reason: '審判判定',
    requiresRefereeDecision: true,
    priorityLevel: 4,
  };
}
