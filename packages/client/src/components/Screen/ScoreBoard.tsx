import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Box } from '@mui/material';
import { config } from '@rolimoa/common/config';
import type { RootState, TeamType } from '@rolimoa/common/redux';
import { useSelector } from 'react-redux';
import { useDisplayScore } from '~/functional/useDisplayScore';
import { formatTime } from '~/util/formatTime';

type ScoreBoardProps = {
  fieldSide: 'blue' | 'red';
  placement: 'left' | 'right';
};

export const ScoreBoard = ({ fieldSide }: ScoreBoardProps) => {
  const team = useSelector<RootState, TeamType | undefined>(
    (state) => state.match.teams[fieldSide],
  );
  const teamName = team?.shortName ?? '';
  const schoolName = team?.school ?? '';
  const { value, scoreState } = useDisplayScore(fieldSide);
  const color = fieldSide === 'blue' ? 'rgba(0, 0, 250, 0.9)' : 'rgba(250, 0, 0, 0.9)';

  return (
    <Box
      sx={{
        width: '100%',
        height: '180px',
        border: '2px solid',
        borderColor: color,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          backgroundColor: color,
          color: 'rgb(240, 240, 240)',
          height: '64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: '0.5em',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            fontSize: schoolName ? '24px' : '30px',
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {teamName}
        </Box>
        {schoolName && (
          <Box
            sx={{
              fontSize: '15px',
              fontWeight: 500,
              lineHeight: 1.2,
              opacity: 0.9,
              mt: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {schoolName}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          height: '116px',
          fontSize: '1.5em',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          flexDirection: 'row',
        }}
      >
        <Box>{value}</Box>
        {scoreState.vgoal && (
          <Box
            sx={{
              fontSize: '40%',
              ml: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                lineHeight: 1,
                maxHeight: '45%',
              }}
            >
              {config.rule.vgoal.name}
            </Box>
            <Box
              sx={{
                maxHeight: '45%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <TimerOutlinedIcon
                sx={{
                  pt: 0.5,
                  fontSize: '120%',
                  color: 'rgba(80, 80, 80, 0.9)',
                  textAnchor: 'middle',
                }}
              />
              {formatTime(scoreState.vgoal, 'm:ss')}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
