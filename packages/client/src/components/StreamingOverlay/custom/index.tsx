import TimerIcon from '@mui/icons-material/Timer';
import { Box } from '@mui/material';
import { config } from '@rolimoa/common/config';
import type { FieldSideType, RootState } from '@rolimoa/common/redux';
import { useSelector } from 'react-redux';
import { useDisplayScore } from '~/functional/useDisplayScore';
import { CenterFlex } from '~/ui/CenterFlex';
import { SlideTransition } from '~/ui/SlideTransition';
import { formatTime } from '~/util/formatTime';
import { TimerDisplay } from '../TimerDisplay';
import { CastleIndicator } from './CastleIndicator';

const ScoreBlock = (props: {
  fieldSide: FieldSideType;
  placement: 'left' | 'right';
}) => {
  const { fieldSide, placement } = props;
  const teamName = useSelector<RootState, string | undefined>(
    (state) => state.match.teams[fieldSide]?.shortName,
  );
  const displayScore = useDisplayScore(fieldSide);

  const color = fieldSide === 'blue' ? 'rgba(0, 0, 240, 0.85)' : 'rgba(240, 0, 0, 0.85)';

  const containerHeight = 260;
  const nameBlockHeight = 55;
  const scoreBlockHeight = containerHeight - nameBlockHeight - 5;

  let teamNameFontSize = 34;
  if (teamName && teamName.length > 12) {
    teamNameFontSize = 30;
  }
  if (teamName && teamName.length > 14) {
    teamNameFontSize = 26;
  }

  return (
    <Box>
      <Box
        sx={{
          width: '600px',
          height: `${containerHeight}px`,
          textAlign: 'center',
          backgroundColor: 'rgba(245, 245, 247, 0.85)',
          backdropFilter: 'blur(8px)',
          clipPath: 'polygon(0 0, 0 100%, 30% 100%, 50% 190px, 100% 190px, 100% 0)',
          transform: placement === 'left' ? '' : 'scaleX(-1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* チーム名バー */}
        <Box
          sx={{
            height: `${nameBlockHeight}px`,
            lineHeight: `${nameBlockHeight + 2}px`,
            backgroundColor: color,
            fontSize: `${teamNameFontSize}px`,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.95)',
            letterSpacing: '0.02em',
            transform: placement === 'left' ? '' : 'scaleX(-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            px: 2,
          }}
        >
          {teamName ?? ' '}
        </Box>

        {/* スコア ＆ 詳細表示 */}
        <Box
          sx={{
            height: `${scoreBlockHeight}px`,
            flexDirection: placement === 'left' ? 'row' : 'row-reverse',
            display: 'flex',
            transform: placement === 'left' ? '' : 'scaleX(-1)',
          }}
        >
          {/* 点数表示 */}
          <CenterFlex sx={{ width: '260px', flexShrink: 0 }}>
            {displayScore.scoreState.vgoal ? (
              <Box sx={{ fontSize: '44px' }}>
                <Box
                  sx={{
                    lineHeight: 1.1,
                    textAlign: 'center',
                    fontWeight: 800,
                    color: '#b45309',
                    pb: 0.5,
                  }}
                >
                  {config.rule.vgoal.name}
                </Box>
                <CenterFlex
                  sx={{
                    fontSize: '28px',
                    fontWeight: 700,
                    flexDirection: 'row',
                    color: 'rgba(30, 30, 30, 0.9)',
                  }}
                >
                  {displayScore.value}
                  &nbsp;/&nbsp;
                  <TimerIcon sx={{ mr: 0.5, fontSize: '26px' }} />
                  {formatTime(displayScore.scoreState.vgoal, 'm:ss')}
                </CenterFlex>
              </Box>
            ) : (
              <CenterFlex
                sx={{
                  fontSize: '92px',
                  fontWeight: 800,
                  color: '#1f2937',
                  lineHeight: `${scoreBlockHeight}px`,
                }}
              >
                {displayScore.value}
              </CenterFlex>
            )}
          </CenterFlex>

          {/* 詳細インジケーター表示 */}
          <Box
            sx={{
              width: '320px',
              height: '135px',
              padding: placement === 'left' ? '6px 12px 6px 4px' : '6px 4px 6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CastleIndicator fieldSide={fieldSide} />
          </Box>
        </Box>
      </Box>

      {/* Winner バナー（平行四辺形） */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: placement === 'left' ? 'flex-start' : 'flex-end',
          position: 'relative',
          width: '420px',
          top: '-70px',
          left: placement === 'left' ? '180px' : '0',
          clipPath:
            placement === 'left'
              ? 'polygon(0 100%, 71% 100%, 100% 0, 29% 0)'
              : 'polygon(0 0, 29% 100%, 100% 100%, 71% 0)',
        }}
      >
        {displayScore.scoreState.winner && (
          <CenterFlex
            sx={{
              height: '70px',
              width: '420px',
              backgroundColor: `${color}`,
              fontSize: '40px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: 'rgba(255, 255, 255, 0.98)',
            }}
          >
            WINNER
          </CenterFlex>
        )}
      </Box>
    </Box>
  );
};

export const MainHud = ({
  showScoreBoard,
  params,
}: {
  showScoreBoard: boolean;
  params: { reverse: boolean };
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '280px',
        display: 'flex',
      }}
    >
      <SlideTransition in={showScoreBoard} direction="left" duration={800} appear={false}>
        <Box>
          <ScoreBlock fieldSide={params.reverse ? 'blue' : 'red'} placement="left" />
        </Box>
      </SlideTransition>
      <TimerDisplay
        sxContainer={{ height: '190px', fontSize: '20px' }}
        sxDescription={{ height: '50px', lineHeight: '50px' }}
        sxTime={{ height: '90px', lineHeight: '90px' }}
        sxMatchName={{ height: '50px', lineHeight: '50px' }}
      />
      <SlideTransition in={showScoreBoard} direction="right" duration={800} appear={false}>
        <Box>
          <ScoreBlock fieldSide={params.reverse ? 'red' : 'blue'} placement="right" />
        </Box>
      </SlideTransition>
    </Box>
  );
};
