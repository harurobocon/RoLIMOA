import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CachedIcon from '@mui/icons-material/Cached';
import GavelIcon from '@mui/icons-material/Gavel';
import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid2,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Switch,
  type SxProps,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/system';
import { config } from '@rolimoa/common/config';
import { Phase } from '@rolimoa/common/config/helper';
import type { RootState } from '@rolimoa/common/redux';
import type { FieldSideType, ScoreState } from '@rolimoa/common/redux';
import { resultRecordsStateSlice } from '@rolimoa/common/redux';
import { type MatchState, matchStateSlice } from '@rolimoa/common/redux';
import type { CurrentPhaseState } from '@rolimoa/common/redux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScoreBlock } from '~/components/ScoreBlock';
import { useDisplayScore } from '~/functional/useDisplayScore';
import { LyricalSocket } from '~/lyricalSocket';
import { judgeWinner } from '~/custom/rule.winner';
import { generateTweetText } from '~/util/tweetFormatter';

const thStyle: SxProps<Theme> = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: (theme) => theme.palette.text.secondary,
  userSelect: 'none',
  width: '80%',
};

const ScoreDetailTable = (props: {
  fieldSide: FieldSideType;
}) => {
  const { fieldSide } = props;
  const { value: scoreValue, scoreState } = useDisplayScore(fieldSide);
  const taskObjects = scoreState.tasks;

  return (
    <>
      <Table sx={{ tableLayout: 'fixed', marginBottom: '3rem' }} size="small">
        <TableBody>
          {config.rule.task_objects.map((config) => (
            <TableRow key={config.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row" sx={{ ...thStyle }}>
                {config.description}
              </TableCell>
              <TableCell align="right">{taskObjects[config.id]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table sx={{ tableLayout: 'fixed' }} size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ ...thStyle }}>
              点数
            </TableCell>
            <TableCell align="right">{scoreValue}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ ...thStyle }}>
              Vゴールタイム (s)
            </TableCell>
            <TableCell align="right">{scoreState.vgoal ?? '-'}</TableCell>
          </TableRow>
          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component="th" scope="row" sx={{ ...thStyle }}>
              勝利フラグ
            </TableCell>
            <TableCell align="right">{scoreState.winner ? '⭕' : '❌'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};

const ResultConfirm = () => {
  const dispatch = useDispatch();
  const match = useSelector<RootState, MatchState>((state) => state.match);
  const score = useSelector<RootState, ScoreState>((state) => state.score);
  const currentPhase = useSelector<RootState, CurrentPhaseState>((state) => state.phase.current);
  const { value: blueScoreValue } = useDisplayScore('blue');
  const { value: redScoreValue } = useDisplayScore('red');
  const isLastPhase = Phase.isLast(currentPhase.id);

  const [comment, setComment] = useState<string>('');
  const [postTweet, setPostTweet] = useState<boolean>(true);
  const [refereeSelectedWinner, setRefereeSelectedWinner] = useState<'red' | 'blue' | ''>('');
  const [overrideRefereeDecision, setOverrideRefereeDecision] = useState<boolean>(false);

  // ルールに基づく勝敗自動判定
  const judgeResult = useMemo(() => {
    return judgeWinner(score, redScoreValue, blueScoreValue);
  }, [score, redScoreValue, blueScoreValue]);

  // 試合が切り替わったらコメントと審判選択をリセット
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when match changes
  useEffect(() => {
    setComment('');
    setRefereeSelectedWinner('');
    setOverrideRefereeDecision(false);
  }, [match.name]);

  // 適用される勝者
  const effectiveWinner: 'red' | 'blue' | 'none' = useMemo(() => {
    if (judgeResult.requiresRefereeDecision || overrideRefereeDecision) {
      return refereeSelectedWinner || 'none';
    }
    return judgeResult.winner;
  }, [judgeResult, overrideRefereeDecision, refereeSelectedWinner]);

  // 適用されるスコア状態（勝者フラグを更新）
  const effectiveScore: ScoreState = useMemo(() => {
    return {
      ...score,
      fields: {
        ...score.fields,
        red: {
          ...score.fields.red,
          winner: effectiveWinner === 'red',
        },
        blue: {
          ...score.fields.blue,
          winner: effectiveWinner === 'blue',
        },
      },
    };
  }, [score, effectiveWinner]);

  const onCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value);
  const onPostTweetChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPostTweet(e.target.checked);

  const previewText = useMemo(() => {
    return generateTweetText({
      match,
      score: effectiveScore,
      redScoreValue,
      blueScoreValue,
      comment,
    });
  }, [match, effectiveScore, redScoreValue, blueScoreValue, comment]);

  // 審判選択が必須なのにまだ選択されていないか
  const isRefereeSelectionRequired =
    (judgeResult.requiresRefereeDecision || overrideRefereeDecision) && !refereeSelectedWinner;

  const isConfirmable =
    isLastPhase &&
    !match.isConfirmed &&
    currentPhase.id !== 'default' &&
    !isRefereeSelectionRequired;

  const redTeamDisplayName = match.teams.red?.name || match.teams.red?.shortName || '赤チーム';
  const blueTeamDisplayName = match.teams.blue?.name || match.teams.blue?.shortName || '青チーム';

  const onConfirmButtonClick = useCallback(() => {
    const confirmedAt = Number(new Date());
    const confirmedBy = 'not implemented';

    // 審判判定で決定された場合、コメントに「審判判定」を反映
    let finalComment = comment.trim();
    if (judgeResult.requiresRefereeDecision || overrideRefereeDecision) {
      if (!finalComment) {
        finalComment = '審判判定';
      } else if (!finalComment.includes('審判判定')) {
        finalComment = `${finalComment} (審判判定)`;
      }
    }

    const matchAction = matchStateSlice.actions.setConfirmed(true);
    const resultRecordAction = resultRecordsStateSlice.actions.addResult({
      match,
      finalScore: effectiveScore,
      confirmedScore: {
        blue: blueScoreValue,
        red: redScoreValue,
      },
      comment: finalComment,
      postTweet,
      confirmedAt,
      confirmedBy,
    });

    LyricalSocket.dispatch([matchAction, resultRecordAction], dispatch);
  }, [
    match,
    effectiveScore,
    blueScoreValue,
    redScoreValue,
    comment,
    postTweet,
    dispatch,
    judgeResult.requiresRefereeDecision,
    overrideRefereeDecision,
  ]);

  return (
    <Box sx={{ width: '100%' }}>
      <Table sx={{ marginBottom: '1.5rem' }} size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              現在フェーズ
            </TableCell>
            <TableCell align="right">{currentPhase.id}</TableCell>
          </TableRow>
          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component="th" scope="row">
              確定済み？
            </TableCell>
            <TableCell align="right">{match.isConfirmed ? '⭕' : '❌'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* 勝敗判定セクション */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#fdfdfd',
          borderColor: judgeResult.requiresRefereeDecision ? 'warning.main' : 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <GavelIcon
            fontSize="small"
            color={judgeResult.requiresRefereeDecision ? 'warning' : 'primary'}
          />
          <Typography variant="subtitle2" fontWeight="bold">
            勝敗判定 (ルール2.13.1)
          </Typography>
        </Box>

        {judgeResult.requiresRefereeDecision ? (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            ルール2.13.1に基づき、得点および獲得項目内訳がすべて同点のため
            <strong>【審判の判定】</strong>が必要です。勝利チームを選択してください。
          </Alert>
        ) : (
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              判定基準:{' '}
              <strong>
                優先順位 {judgeResult.priorityLevel} ({judgeResult.reason})
              </strong>
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
              勝者:{' '}
              {judgeResult.winner === 'red'
                ? `🔴 ${redTeamDisplayName}`
                : `🔵 ${blueTeamDisplayName}`}
            </Typography>
          </Box>
        )}

        {/* 審判判定選択ラジオボタン（審判判定が必要な場合、または手動オーバーライド時） */}
        {(judgeResult.requiresRefereeDecision || overrideRefereeDecision) && (
          <FormControl component="fieldset" sx={{ mt: 1, width: '100%' }}>
            <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              審判判定による勝者選択 (必須):
            </FormLabel>
            <RadioGroup
              row
              value={refereeSelectedWinner}
              onChange={(e) => setRefereeSelectedWinner(e.target.value as 'red' | 'blue')}
              sx={{ mt: 0.5 }}
            >
              <FormControlLabel
                value="red"
                control={<Radio color="error" />}
                label={
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    🔴 赤: {redTeamDisplayName}
                  </Typography>
                }
                disabled={match.isConfirmed}
              />
              <FormControlLabel
                value="blue"
                control={<Radio color="primary" />}
                label={
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    🔵 青: {blueTeamDisplayName}
                  </Typography>
                }
                disabled={match.isConfirmed}
              />
            </RadioGroup>
          </FormControl>
        )}

        {/* 自動判定が出ているが審判判定で上書きしたい場合の手動トグル */}
        {!judgeResult.requiresRefereeDecision && !match.isConfirmed && (
          <Box sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={overrideRefereeDecision}
                  onChange={(e) => {
                    setOverrideRefereeDecision(e.target.checked);
                    if (!e.target.checked) {
                      setRefereeSelectedWinner('');
                    }
                  }}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">
                  審判判定で勝者を手動指定する（反則・特例等）
                </Typography>
              }
            />
          </Box>
        )}
      </Paper>

      <FormControlLabel
        control={
          <Switch
            checked={postTweet}
            onChange={onPostTweetChange}
            color="primary"
            disabled={match.isConfirmed}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TwitterIcon fontSize="small" sx={{ color: '#1d9bf0' }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              確定時にX (Twitter) に投稿する
            </Typography>
          </Box>
        }
        sx={{ mb: 1 }}
      />

      <TextField
        label="試合コメント（X/Twitter投稿用）"
        placeholder="例: 素早い回収と6連続の投擲により「ファンファーレ」を達成しました！"
        multiline
        fullWidth
        rows={3}
        onChange={onCommentChange}
        value={comment}
        sx={{ marginBottom: '1rem' }}
        disabled={match.isConfirmed}
      />

      {postTweet && (
        <Paper
          variant="outlined"
          sx={{
            mb: 2,
            p: 1.5,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(29, 155, 240, 0.08)' : '#f8f9fa',
            borderColor: (theme) =>
              previewText.length > 140 ? theme.palette.error.main : theme.palette.divider,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.8,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#1d9bf0' }}>
              <TwitterIcon sx={{ fontSize: '1rem' }} />
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                ツイートプレビュー
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 'bold',
                color: previewText.length > 140 ? 'error.main' : 'text.secondary',
              }}
            >
              {previewText.length} / 140文字
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              lineHeight: 1.4,
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
            }}
          >
            {previewText}
          </Typography>
        </Paper>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={onConfirmButtonClick}
        disabled={!isConfirmable}
      >
        {!isLastPhase
          ? '競技が進行中です'
          : isRefereeSelectionRequired
            ? '審判判定で勝者を選択してください'
            : '試合結果を確定'}{' '}
        <AssignmentTurnedInIcon sx={{ ml: 0.5 }} />
      </Button>
    </Box>
  );
};

export const MatchResultContainer = () => {
  const match = useSelector<RootState, MatchState>((state) => state.match);

  const [isReverse, setIsReverse] = useState(false);
  const onReverseClick = () => setIsReverse((toggle) => !toggle);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        現在の試合：{match.name}
      </Typography>
      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, lg: 8 }}>
          <Grid2 container spacing={6}>
            {/* スコア */}
            <Grid2
              size={12}
              container
              justifyContent="space-between"
              alignItems="center"
              direction={isReverse ? 'row-reverse' : 'row'}
            >
              <Grid2 size={5}>
                <ScoreBlock fieldSide="blue" teamNameVariant="subtitle1" />
                <ScoreDetailTable fieldSide="blue" />
              </Grid2>
              <Grid2 size={2} textAlign="center">
                <IconButton
                  aria-label="delete"
                  color="default"
                  onClick={onReverseClick}
                  size="large"
                >
                  <CachedIcon />
                </IconButton>
              </Grid2>
              <Grid2 size={5}>
                <ScoreBlock fieldSide="red" teamNameVariant="subtitle1" />
                <ScoreDetailTable fieldSide="red" />
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
        <Grid2 size={{ xs: 12, lg: 4 }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              paddingLeft: '1rem',
            }}
          >
            <ResultConfirm />
          </Box>
        </Grid2>
      </Grid2>
    </Paper>
  );
};
