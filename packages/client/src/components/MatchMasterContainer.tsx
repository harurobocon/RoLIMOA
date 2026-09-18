import { config } from '@rolimoa/common/config';
import { Phase } from '@rolimoa/common/config/helper';
import type { RootState } from '@rolimoa/common/redux';
import { type TeamType, matchStateSlice } from '@rolimoa/common/redux';
import { phaseStateSlice } from '@rolimoa/common/redux';
import { scoreInitialState, scoreStateSlice } from '@rolimoa/common/redux';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRecoilValue } from 'recoil';
import { unixtimeOffset } from '~/atoms/unixtimeOffset';
import { LyricalSocket } from '~/lyricalSocket';
import { type HomepageMatch, formatHomepageTeamName } from '~/types/homepageMatch';
import { MatchMasterComponent } from './MatchMasterComponent';

const STORAGE_KEY_MATCHES = 'rolimoa_synced_homepage_matches';
const STORAGE_KEY_API_URL = 'rolimoa_homepage_api_url';
const DEFAULT_API_URL = 'https://kantouharurobo.com/staff/matches/api/list/';

function loadInitialSyncedMatches(): HomepageMatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MATCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load cached matches from localStorage:', err);
  }
  return [];
}

function loadInitialApiUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && !saved.includes('localhost:8000')) {
      return saved;
    }
    return DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export const MatchMasterContainer = () => {
  const currentPhaseId = useSelector<RootState, string>((state) => state.phase.current.id);
  const isMatchConfirmed = useSelector<RootState, boolean>((state) => state.match.isConfirmed);
  const timeOffset = useRecoilValue(unixtimeOffset);

  // Homepage 同期ステート
  const [syncedMatches, setSyncedMatches] = useState<HomepageMatch[]>(loadInitialSyncedMatches);
  const [homepageApiUrl, setHomepageApiUrl] = useState<string>(loadInitialApiUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  // 試合マスタ入力ステート
  const [roundType, setRoundType] = useState<'prelim' | 'final'>('prelim');
  const [matchIndex, setMatchIndex] = useState('1');
  const [matchName, setMatchName] = useState('予選第1試合');
  const [currentMatchId, setCurrentMatchId] = useState<string | undefined>(undefined);
  const [currentMatchNo, setCurrentMatchNo] = useState<number | undefined>(1);
  const [blueTeamName, setBlueTeamName] = useState('');
  const [redTeamName, setRedTeamName] = useState('');

  // 同期済み対戦表からチーム情報を抽出したマップ
  const syncedTeams = useMemo(() => {
    const map = new Map<string, TeamType>();
    for (const m of syncedMatches) {
      if (m.team_red) {
        const formatted = formatHomepageTeamName(m.team_red);
        const teamObj: TeamType = {
          id: String(m.team_red.team_no),
          name: m.team_red.team_name,
          school: m.team_red.school_name,
          shortName: formatted,
        };
        if (formatted) map.set(formatted, teamObj);
        if (m.team_red.display_name) map.set(m.team_red.display_name, teamObj);
        if (m.team_red.team_name) map.set(m.team_red.team_name, teamObj);
      }
      if (m.team_blue) {
        const formatted = formatHomepageTeamName(m.team_blue);
        const teamObj: TeamType = {
          id: String(m.team_blue.team_no),
          name: m.team_blue.team_name,
          school: m.team_blue.school_name,
          shortName: formatted,
        };
        if (formatted) map.set(formatted, teamObj);
        if (m.team_blue.display_name) map.set(m.team_blue.display_name, teamObj);
        if (m.team_blue.team_name) map.set(m.team_blue.team_name, teamObj);
      }
    }
    return map;
  }, [syncedMatches]);

  // オートコンプリート用のチーム一覧 (config.teams_info + 同期されたチーム)
  const teamList = useMemo(() => {
    const set = new Set<string>();
    for (const info of config.teams_info) {
      if (info.short) set.add(info.short);
    }
    for (const m of syncedMatches) {
      if (m.team_red) {
        const formatted = formatHomepageTeamName(m.team_red);
        if (formatted) set.add(formatted);
      }
      if (m.team_blue) {
        const formatted = formatHomepageTeamName(m.team_blue);
        if (formatted) set.add(formatted);
      }
    }
    return Array.from(set);
  }, [syncedMatches]);

  // チーム名からチーム詳細情報を取得
  const getTeamInfo = useCallback(
    (short: string): TeamType => {
      const trimmed = short.trim();
      const found = syncedTeams.get(trimmed);
      if (found) {
        return found;
      }
      const team = config.teams_info.find((t) => t.short === trimmed);
      if (team) {
        return {
          shortName: trimmed,
          ...team,
        };
      }
      return {
        shortName: trimmed,
      };
    },
    [syncedTeams],
  );

  // Homepage 対戦表の同期処理
  const onSyncHomepageMatches = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const cleanUrl = homepageApiUrl.trim();
      let res: Response;

      // サーバー側のプロキシAPI経由で取得 (CORS回避)
      try {
        res = await fetch(`/api/homepage/matches?url=${encodeURIComponent(cleanUrl)}`);
      } catch {
        // プロキシ到達不可時は直接フェッチを試行
        res = await fetch(cleanUrl);
      }

      // プロキシがエラーを返した場合も念のため直接フェッチをフォールバック試行
      if (!res.ok) {
        try {
          const directRes = await fetch(cleanUrl);
          if (directRes.ok) {
            res = directRes;
          }
        } catch {
          // directRes 失敗時は元の res を維持
        }
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('対戦表APIのレスポンスが配列形式ではありません');
      }

      setSyncedMatches(data);
      localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
      setSyncStatus({
        type: 'success',
        message: `${data.length} 件の試合対戦表を取得しました`,
      });
    } catch (err: unknown) {
      console.error('Failed to sync matches from homepage:', err);
      setSyncStatus({
        type: 'error',
        message: `対戦表の取得に失敗しました: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [homepageApiUrl]);

  // 同期済み対戦表からの試合選択処理
  const onSelectHomepageMatch = useCallback(
    (matchId: string) => {
      setSelectedMatchId(matchId);
      if (!matchId) return;

      const match = syncedMatches.find((m) => m.match_id === matchId);
      if (!match) return;

      const isFinal = match.match_id.startsWith('MK');
      const newRoundType: 'prelim' | 'final' = isFinal ? 'final' : 'prelim';
      setRoundType(newRoundType);

      let newIndex = String(match.match_no);
      let newMatchName = '';
      if (isFinal) {
        const mkMatch = match.match_id.match(/MK-(\d+)/i);
        newIndex = mkMatch ? mkMatch[1] : String(match.match_no);
        newMatchName = `決勝第${newIndex}試合`;
      } else {
        newIndex = String(match.match_no);
        newMatchName = `予選第${newIndex}試合`;
      }

      setMatchIndex(newIndex);
      setMatchName(newMatchName);
      setCurrentMatchId(match.match_id);
      setCurrentMatchNo(match.match_no);

      if (match.team_blue) {
        setBlueTeamName(formatHomepageTeamName(match.team_blue));
      }
      if (match.team_red) {
        setRedTeamName(formatHomepageTeamName(match.team_red));
      }
    },
    [syncedMatches],
  );

  // 予選 / 決勝 切替
  const onChangeRoundType = useCallback(
    (round: 'prelim' | 'final') => {
      setRoundType(round);
      const prefix = round === 'prelim' ? '予選' : '決勝';
      setMatchName(`${prefix}第${matchIndex}試合`);
    },
    [matchIndex],
  );

  // 試合番号変更 (第X試合)
  const onChangeMatchIndex = useCallback(
    (val: string) => {
      const cleaned = val.replace(/[^0-9]/g, '');
      setMatchIndex(cleaned);
      const prefix = roundType === 'prelim' ? '予選' : '決勝';
      if (cleaned) {
        setMatchName(`${prefix}第${cleaned}試合`);
        if (roundType === 'prelim') {
          setCurrentMatchNo(Number.parseInt(cleaned, 10));
        }
      }
    },
    [roundType],
  );

  // 試合名の直接手動編集
  const onChangeMatchName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setMatchName(val);

    // 予選第X試合 or 決勝第X試合 にマッチしたら入力欄とも連動
    const match = val.match(/^(予選|決勝)\s*(?:第)?(\d+)\s*試合?$/);
    if (match) {
      const isPrelim = match[1] === '予選';
      setRoundType(isPrelim ? 'prelim' : 'final');
      setMatchIndex(match[2]);
      if (isPrelim) {
        setCurrentMatchNo(Number.parseInt(match[2], 10));
      }
    }
  }, []);

  const onChangeBlueTeamName = useCallback((_: React.SyntheticEvent, value: unknown) => {
    if (typeof value === 'string') {
      setBlueTeamName(value);
    }
  }, []);

  const onChangeRedTeamName = useCallback((_: React.SyntheticEvent, value: unknown) => {
    if (typeof value === 'string') {
      setRedTeamName(value);
    }
  }, []);

  // 試合開始ボタン
  const onSubmitButton = useCallback(() => {
    LyricalSocket.dispatchAll([
      // スコアの初期化
      scoreStateSlice.actions.setState(scoreInitialState),
      // チーム情報の更新
      matchStateSlice.actions.setState({
        name: matchName,
        matchId: currentMatchId,
        matchNo: currentMatchNo,
        teams: {
          blue: getTeamInfo(blueTeamName),
          red: getTeamInfo(redTeamName),
        },
        isConfirmed: false,
      }),
      // フェーズ遷移
      phaseStateSlice.actions.setState({
        id: Phase.getFirstPhase(),
        startTime: Date.now() + timeOffset,
      }),
    ]);
  }, [matchName, currentMatchId, currentMatchNo, blueTeamName, redTeamName, getTeamInfo, timeOffset]);

  const warningMessage =
    Phase.isLast(currentPhaseId) && !isMatchConfirmed ? '試合結果の確定がまだです' : undefined;

  return (
    <MatchMasterComponent
      matchName={matchName}
      roundType={roundType}
      matchIndex={matchIndex}
      teamOptions={teamList}
      blueTeamName={blueTeamName}
      redTeamName={redTeamName}
      onChangeMatchName={onChangeMatchName}
      onChangeRoundType={onChangeRoundType}
      onChangeMatchIndex={onChangeMatchIndex}
      onChangeBlueTeamName={onChangeBlueTeamName}
      onChangeRedTeamName={onChangeRedTeamName}
      onStartButton={onSubmitButton}
      warningMessage={warningMessage}
      isEnabledStartButton={Phase.isLast(currentPhaseId)}
      homepageApiUrl={homepageApiUrl}
      onChangeHomepageApiUrl={setHomepageApiUrl}
      onSyncHomepageMatches={onSyncHomepageMatches}
      isSyncing={isSyncing}
      syncStatus={syncStatus}
      syncedMatches={syncedMatches}
      selectedMatchId={selectedMatchId}
      onSelectHomepageMatch={onSelectHomepageMatch}
    />
  );
};
