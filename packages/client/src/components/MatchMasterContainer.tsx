import { config } from '@rolimoa/common/config';
import { Phase } from '@rolimoa/common/config/helper';
import type { RootState } from '@rolimoa/common/redux';
import { type TeamType, matchStateSlice } from '@rolimoa/common/redux';
import { phaseStateSlice } from '@rolimoa/common/redux';
import { scoreInitialState, scoreStateSlice } from '@rolimoa/common/redux';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRecoilValue } from 'recoil';
import { unixtimeOffset } from '~/atoms/unixtimeOffset';
import { LyricalSocket } from '~/lyricalSocket';
import { MatchMasterComponent } from './MatchMasterComponent';

// 省略名からチームリストの情報を取得、なければスタブを作成
function getTeamInfo(short: string): TeamType {
  const team = config.teams_info.find((team) => team.short === short);
  return {
    shortName: short,
    ...team,
  };
}

export const MatchMasterContainer = () => {
  const teamList = config.teams_info.map((info) => info.short);
  const currentPhaseId = useSelector<RootState, string>((state) => state.phase.current.id);
  const isMatchConfirmed = useSelector<RootState, boolean>((state) => state.match.isConfirmed);
  const timeOffset = useRecoilValue(unixtimeOffset);
  const [matchName, setMatchName] = useState('');
  const [blueTeamName, setBlueTeamName] = useState('');
  const [redTeamName, setRedTeamName] = useState('');
  const [blockLetter, setBlockLetter] = useState('');
  const [matchNumber, setMatchNumber] = useState('');

  const onChangeBlockLetter = useCallback(
    (val: string) => {
      // アルファベットのみ抽出し、最後に入力された1文字を大文字化
      const cleaned = val.replace(/[^a-zA-Z]/g, '');
      const letter = cleaned ? cleaned.slice(-1).toUpperCase() : '';
      setBlockLetter(letter);

      if (letter && matchNumber) {
        setMatchName(`M${letter}-${matchNumber}`);
      } else if (letter) {
        setMatchName(`M${letter}-`);
      }
    },
    [matchNumber],
  );

  const onChangeMatchNumber = useCallback(
    (val: string) => {
      // 数字のみ抽出し、最後に入力された1文字を取得
      const cleaned = val.replace(/[^0-9]/g, '');
      const num = cleaned ? cleaned.slice(-1) : '';
      setMatchNumber(num);

      if (blockLetter && num) {
        setMatchName(`M${blockLetter}-${num}`);
      }
    },
    [blockLetter],
  );

  const onChangeMatchName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setMatchName(val);

    // M{英字}-{数字} にマッチしたら入力欄とも同期
    const match = val.match(/^M([a-zA-Z])-?([0-9])$/i);
    if (match) {
      setBlockLetter(match[1].toUpperCase());
      setMatchNumber(match[2]);
    }
  }, []);

  const onChangeBlueTeamName = useCallback((_: React.SyntheticEvent, name: string) => {
    setBlueTeamName(name);
  }, []);
  const onChangeRedTeamName = useCallback((_: React.SyntheticEvent, name: string) => {
    setRedTeamName(name);
  }, []);

  const onSubmitButton = useCallback(() => {
    LyricalSocket.dispatchAll([
      // スコアの初期化
      scoreStateSlice.actions.setState(scoreInitialState),
      // チーム情報の更新
      matchStateSlice.actions.setState({
        name: matchName,
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
  }, [matchName, blueTeamName, redTeamName, timeOffset]);

  const warningMessage =
    Phase.isLast(currentPhaseId) && !isMatchConfirmed ? '試合結果の確定がまだです' : undefined;

  return (
    <MatchMasterComponent
      matchName={matchName}
      blockLetter={blockLetter}
      matchNumber={matchNumber}
      teamOptions={teamList}
      onChangeMatchName={onChangeMatchName}
      onChangeBlockLetter={onChangeBlockLetter}
      onChangeMatchNumber={onChangeMatchNumber}
      onChangeBlueTeamName={onChangeBlueTeamName}
      onChangeRedTeamName={onChangeRedTeamName}
      onStartButton={onSubmitButton}
      warningMessage={warningMessage}
      isEnabledStartButton={Phase.isLast(currentPhaseId)}
    />
  );
};
