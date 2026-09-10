import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CachedIcon from '@mui/icons-material/Cached';
import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Box,
  Button,
  FormControlLabel,
  Grid2,
  IconButton,
  Paper,
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

  // 試合が切り替わったらコメントをリセット
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset comment when match changes
  useEffect(() => {
    setComment('');
  }, [match.name]);

  const onCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value);
  const onPostTweetChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPostTweet(e.target.checked);

  const previewText = useMemo(() => {
    return generateTweetText({
      match,
      score,
      redScoreValue,
      blueScoreValue,
      comment,
    });
  }, [match, score, redScoreValue, blueScoreValue, comment]);

  const isConfirmable = isLastPhase && !match.isConfirmed && currentPhase.id !== 'default';

  const onConfirmButtonClick = useCallback(() => {
    const confirmedAt = Number(new Date());
    const confirmedBy = 'not implemented';

    const matchAction = matchStateSlice.actions.setConfirmed(true);
    const resultRecordAction = resultRecordsStateSlice.actions.addResult({
      match,
      finalScore: score,
      confirmedScore: {
        blue: blueScoreValue, // 現在は確定スコアの編集機能がないため
        red: redScoreValue, // 最終スコアと同じ値になる
      },
      comment,
      postTweet,
      confirmedAt,
      confirmedBy,
    });

    LyricalSocket.dispatch([matchAction, resultRecordAction], dispatch);
  }, [match, score, blueScoreValue, redScoreValue, comment, postTweet, dispatch]);

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
        {isLastPhase ? '試合結果を確定' : '競技が進行中です'}{' '}
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
