import SyncIcon from '@mui/icons-material/Sync';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid2,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { type HomepageMatch, formatHomepageTeamName } from '~/types/homepageMatch';

export interface MatchMasterComponentProps {
  matchName: string;
  roundType: 'prelim' | 'final';
  matchIndex: string;
  teamOptions: string[];
  blueTeamName: string;
  redTeamName: string;
  onChangeMatchName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeRoundType: (round: 'prelim' | 'final') => void;
  onChangeMatchIndex: (num: string) => void;
  onChangeBlueTeamName: (event: React.SyntheticEvent, value: string | null) => void;
  onChangeRedTeamName: (event: React.SyntheticEvent, value: string | null) => void;
  onStartButton: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  warningMessage?: string;
  isEnabledStartButton: boolean;

  // Homepage sync props
  homepageApiUrl: string;
  onChangeHomepageApiUrl: (url: string) => void;
  onSyncHomepageMatches: () => Promise<void>;
  isSyncing: boolean;
  syncStatus: { type: 'success' | 'error'; message: string } | null;
  syncedMatches: HomepageMatch[];
  selectedMatchId: string;
  onSelectHomepageMatch: (matchId: string) => void;
}

export const MatchMasterComponent = ({
  matchName,
  roundType,
  matchIndex,
  teamOptions,
  blueTeamName,
  redTeamName,
  onChangeMatchName,
  onChangeRoundType,
  onChangeMatchIndex,
  onChangeBlueTeamName,
  onChangeRedTeamName,
  onStartButton,
  warningMessage,
  isEnabledStartButton,
  homepageApiUrl,
  onChangeHomepageApiUrl,
  onSyncHomepageMatches,
  isSyncing,
  syncStatus,
  syncedMatches,
  selectedMatchId,
  onSelectHomepageMatch,
}: MatchMasterComponentProps) => {
  const selectedMatch = syncedMatches.find((m) => m.match_id === selectedMatchId) || null;

  return (
    <Paper sx={{ padding: '1em' }}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        試合マスタ
      </Typography>

      <Grid2 container spacing={2}>
        {/* Homepage 対戦表同期セクション */}
        <Grid2 size={12}>
          <Box
            sx={{
              p: 1.5,
              border: '1px solid',
              borderColor: 'primary.light',
              borderRadius: 1,
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            }}
          >
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
              Homepage 対戦表同期
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Homepage API URL"
                value={homepageApiUrl}
                onChange={(e) => onChangeHomepageApiUrl(e.target.value)}
                disabled={isSyncing}
                sx={{ flexGrow: 1, minWidth: '240px' }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={onSyncHomepageMatches}
                disabled={isSyncing}
                startIcon={isSyncing ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                HPから対戦表を取り込み
              </Button>
            </Box>

            {syncStatus && (
              <Alert severity={syncStatus.type} sx={{ mt: 1, py: 0 }}>
                {syncStatus.message}
              </Alert>
            )}

            {syncedMatches.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Autocomplete
                  options={syncedMatches}
                  getOptionLabel={(option) =>
                    `#${option.match_no} ${option.match_id?.startsWith('MK') ? '決勝' : '予選'} (${option.match_id}): 赤: ${formatHomepageTeamName(option.team_red)} vs 青: ${formatHomepageTeamName(option.team_blue)} [${option.status === 'completed' ? '終了' : '予定'}]`
                  }
                  value={selectedMatch}
                  onChange={(_, val) => onSelectHomepageMatch(val ? val.match_id : '')}
                  isOptionEqualToValue={(option, val) => option.match_id === val.match_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="同期済み対戦表から選択 (自動反映)"
                      placeholder="試合を選択すると試合名・チーム名が自動反映されます"
                    />
                  )}
                />
              </Box>
            )}
          </Box>
        </Grid2>

        {/* 試合名設定セクション */}
        <Grid2 size={12}>
          <Box
            sx={{
              p: 1.5,
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
              試合設定
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {/* 予選 / 決勝 切替 */}
              <ToggleButtonGroup
                color="primary"
                value={roundType}
                exclusive
                onChange={(_, newRound) => {
                  if (newRound) onChangeRoundType(newRound);
                }}
                size="small"
              >
                <ToggleButton value="prelim" sx={{ fontWeight: 'bold', px: 2 }}>
                  予選
                </ToggleButton>
                <ToggleButton value="final" sx={{ fontWeight: 'bold', px: 2 }}>
                  決勝
                </ToggleButton>
              </ToggleButtonGroup>

              {/* 試合番号: 第X試合 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body1" fontWeight="bold">
                  第
                </Typography>
                <TextField
                  size="small"
                  value={matchIndex}
                  onChange={(e) => onChangeMatchIndex(e.target.value)}
                  sx={{ width: '80px' }}
                  inputProps={{
                    style: { textAlign: 'center', fontWeight: 'bold', fontSize: '1rem' },
                    min: 1,
                  }}
                />
                <Typography variant="body1" fontWeight="bold">
                  試合
                </Typography>
              </Box>
            </Box>
          </Box>

          <TextField
            label="試合名"
            value={matchName}
            onChange={onChangeMatchName}
            margin="normal"
            variant="outlined"
            fullWidth
            helperText="上記から自動反映、または直接編集可能です (例: 予選第1試合, 決勝第1試合)"
          />

          <Autocomplete
            freeSolo
            options={teamOptions}
            value={redTeamName}
            onInputChange={(event, val) => onChangeRedTeamName(event, val)}
            onChange={(event, val) => onChangeRedTeamName(event, val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="赤チーム名"
                margin="normal"
                variant="outlined"
                InputProps={{ ...params.InputProps, type: 'search' }}
              />
            )}
          />

          <Autocomplete
            freeSolo
            options={teamOptions}
            value={blueTeamName}
            onInputChange={(event, val) => onChangeBlueTeamName(event, val)}
            onChange={(event, val) => onChangeBlueTeamName(event, val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="青チーム名"
                margin="normal"
                variant="outlined"
                InputProps={{ ...params.InputProps, type: 'search' }}
              />
            )}
          />

          <Box
            sx={{
              display: 'flex',
              gap: '10px',
              mt: 1,
            }}
          >
            <Button
              variant="contained"
              color={warningMessage ? 'inherit' : 'primary'}
              onClick={onStartButton}
              disabled={!isEnabledStartButton}
            >
              試合開始
            </Button>
            {warningMessage && (
              <Alert severity="warning" sx={{ py: 0 }}>
                {warningMessage}
              </Alert>
            )}
          </Box>
        </Grid2>
      </Grid2>
    </Paper>
  );
};
