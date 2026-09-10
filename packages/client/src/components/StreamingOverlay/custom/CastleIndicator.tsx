import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Box, Typography } from '@mui/material';
import type { FieldSideType } from '@rolimoa/common/redux';
import { useCurrentMatchState } from '~/functional/useCurrentMatchState';

type CastleIndicatorProps = {
  fieldSide: FieldSideType;
};

// 各段のインジケーター（配点ラベル + 現在搭載されているブロックのみ中央揃え）
const PointTierRow = ({
  points,
  count,
  color,
  bgColor,
  showCountNumber = false,
}: {
  points: number;
  count: number;
  color: string;
  bgColor: string;
  showCountNumber?: boolean;
}) => {
  const isAchieved = count > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: '2px',
        px: '8px',
        borderRadius: '4px',
        backgroundColor: isAchieved ? bgColor : 'rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease',
        height: '24px',
      }}
    >
      {/* ポイントラベル */}
      <Box
        sx={{
          minWidth: '46px',
          textAlign: 'left',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 800,
            color: isAchieved ? color : '#757575',
            lineHeight: 1.2,
            fontFamily: 'monospace, sans-serif',
          }}
        >
          {points}pt
        </Typography>
      </Box>

      {/* 現在搭載されている数だけのブロック（中央揃え） */}
      <Box
        sx={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          px: 1,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: '15px',
              height: '15px',
              borderRadius: '3px',
              border: `1.5px solid ${color}`,
              backgroundColor: color,
              boxShadow: `0 1px 4px ${color}66`,
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </Box>

      {/* 数値表示（土台等の指定時） */}
      {showCountNumber ? (
        <Box sx={{ minWidth: '24px', textAlign: 'right', flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 800,
              color: isAchieved ? color : '#9e9e9e',
            }}
          >
            {count}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ minWidth: '24px' }} />
      )}
    </Box>
  );
};

export const CastleIndicator = ({ fieldSide }: CastleIndicatorProps) => {
  const { taskObjects } = useCurrentMatchState(fieldSide);

  const contactMaterial = (taskObjects.contact_material ?? 0) >= 1;
  const materialOnBase = taskObjects.material_on_base ?? 0;
  const castleTier1 = taskObjects.castle_tier1 ?? 0;
  const castleTier2 = taskObjects.castle_tier2 ?? 0;
  const castleTier3 = taskObjects.castle_tier3 ?? 0;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        px: '6px',
        py: '4px',
      }}
    >
      {/* 3段目 (70pt) */}
      <PointTierRow
        points={70}
        count={castleTier3}
        color="#d97706"
        bgColor="rgba(245, 158, 11, 0.12)"
      />

      {/* 2段目 (20pt) */}
      <PointTierRow
        points={20}
        count={castleTier2}
        color="#0284c7"
        bgColor="rgba(14, 165, 233, 0.12)"
      />

      {/* 1段目 (10pt) */}
      <PointTierRow
        points={10}
        count={castleTier1}
        color="#059669"
        bgColor="rgba(16, 185, 129, 0.12)"
      />

      {/* 土台上の建材 (5pt) - 数値も含めて表示 */}
      <PointTierRow
        points={5}
        count={materialOnBase}
        color="#854d0e"
        bgColor="rgba(180, 83, 9, 0.1)"
        showCountNumber={true}
      />

      {/* 建材接触 (10pt) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '6px',
          pt: '2px',
          borderTop: '1px dashed #d1d5db',
          mt: '1px',
        }}
      >
        {contactMaterial ? (
          <CheckCircleIcon sx={{ fontSize: '16px', color: '#16a34a' }} />
        ) : (
          <RadioButtonUncheckedIcon sx={{ fontSize: '16px', color: '#9ca3af' }} />
        )}
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: contactMaterial ? 700 : 500,
            color: contactMaterial ? '#15803d' : '#6b7280',
          }}
        >
          建材接触 (10pt)
        </Typography>
      </Box>
    </Box>
  );
};
