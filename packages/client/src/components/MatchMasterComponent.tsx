import { Alert, Box, Button, Grid2, Paper, TextField, Typography } from '@mui/material';
import { Autocomplete } from '@mui/material';

interface MatchMasterComponentProps {
  matchName: string;
  blockLetter: string;
  matchNumber: string;
  teamOptions: string[];
  onChangeMatchName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeBlockLetter: (letter: string) => void;
  onChangeMatchNumber: (num: string) => void;
  onChangeBlueTeamName: (event: React.SyntheticEvent, value: string) => void;
  onChangeRedTeamName: (event: React.SyntheticEvent, value: string) => void;
  onStartButton: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  warningMessage?: string;
  isEnabledStartButton: boolean;
}

export const MatchMasterComponent = ({
  matchName,
  blockLetter,
  matchNumber,
  teamOptions,
  onChangeMatchName,
  onChangeBlockLetter,
  onChangeMatchNumber,
  onChangeBlueTeamName,
  onChangeRedTeamName,
  onStartButton,
  warningMessage,
  isEnabledStartButton,
}: MatchMasterComponentProps) => {
  return (
    <Paper sx={{ padding: '1em' }}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        試合マスタ
      </Typography>
      <Grid2 container spacing={1}>
        <Grid2 size={12}>
          <Box
            sx={{
              p: 1.5,
              mb: 1.5,
              border: '1px solid',
              borderColor: 'primary.light',
              borderRadius: 1,
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            }}
          >
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
              試合コード生成 (M + アルファベット1文字 - 整数1文字)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                M
              </Typography>
              <TextField
                size="small"
                label="英字"
                placeholder="A"
                value={blockLetter}
                onChange={(e) => onChangeBlockLetter(e.target.value)}
                sx={{ width: '80px' }}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' },
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                -
              </Typography>
              <TextField
                size="small"
                label="数字"
                placeholder="1"
                value={matchNumber}
                onChange={(e) => onChangeMatchNumber(e.target.value)}
                sx={{ width: '80px' }}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' },
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                生成結果:{' '}
                <strong>
                  {blockLetter && matchNumber ? `M${blockLetter}-${matchNumber}` : '未完成'}
                </strong>
              </Typography>
            </Box>
          </Box>

          <TextField
            label="試合名"
            value={matchName}
            onChange={onChangeMatchName}
            margin="normal"
            variant="outlined"
            fullWidth
            helperText="上記から自動入力、または直接編集可能です (例: MA-1, MK-1)"
          />
          <Autocomplete
            freeSolo
            disableClearable
            options={teamOptions}
            onInputChange={onChangeBlueTeamName}
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
          <Autocomplete
            freeSolo
            disableClearable
            options={teamOptions}
            onInputChange={onChangeRedTeamName}
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
          <Box
            sx={{
              display: 'flex',
              gap: '10px',
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
