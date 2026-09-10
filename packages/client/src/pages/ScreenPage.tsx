import CachedIcon from '@mui/icons-material/Cached';
import { Box, IconButton } from '@mui/material';
import { useState } from 'react';
import { ScoreBoard } from '~/components/Screen/ScoreBoard';
import { TimerDisplay } from '~/components/Screen/TimerDisplay';
import { Underlay } from '~/components/Screen/Underlay';
import { useAutoPlaySoundEffect } from '~/functional/useAutoPlaySoundEffect';
import { CenterFlex } from '~/ui/CenterFlex';

export const ScreenPage = () => {
  useAutoPlaySoundEffect();

  const [reverse, setReverse] = useState(false);
  const onReverseClick = () => {
    setReverse((toggle) => !toggle);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        p: 1.5,
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* スコアボード（fontSize: 50px を指定して赤青の得点サイズを元通り巨大に表示） */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          fontSize: '50px',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <ScoreBoard fieldSide={reverse ? 'blue' : 'red'} placement="left" />
        </Box>
        <CenterFlex
          sx={{
            opacity: 0.3,
            transition: 'opacity',
            '&:hover': {
              opacity: 1.0,
            },
            width: '60px',
            fontSize: '20px',
          }}
        >
          <IconButton color="default" onClick={onReverseClick}>
            <CachedIcon />
          </IconButton>
        </CenterFlex>
        <Box sx={{ flex: 1 }}>
          <ScoreBoard fieldSide={reverse ? 'red' : 'blue'} placement="right" />
        </Box>
      </Box>

      {/* タイム表示（セッティングタイムとタイマーの間に余白を確保） */}
      <CenterFlex sx={{ flexShrink: 0, height: '130px', my: 0.5 }}>
        <TimerDisplay
          sxContainer={{
            height: '130px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          sxMatchName={{ display: 'none' }}
          sxDescription={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#374151',
            lineHeight: 1.2,
            mb: '10px',
          }}
          sxTime={{
            fontSize: '92px',
            fontWeight: 600,
            pt: 0,
            lineHeight: 1,
          }}
        />
      </CenterFlex>

      {/* Underlay（カードの高さを少し下げてタイマーとの余白を拡張） */}
      <Box sx={{ flex: 1, minHeight: 0, width: '100%', pt: 0.5, pb: 1 }}>
        <Underlay reverse={reverse} />
      </Box>
    </Box>
  );
};
