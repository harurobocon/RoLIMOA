import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Box, Typography } from '@mui/material';
import type { FieldSideType, RootState } from '@rolimoa/common/redux';
import { useSelector } from 'react-redux';
import { useCurrentMatchState } from '~/functional/useCurrentMatchState';

type UnderlayProps = {
  reverse?: boolean;
};

// 段ごとのブロック列（囲いの約8割を占めるサイズ、搭載数の中央揃え）
const TierBlockRow = ({
  count,
  themeColor,
}: {
  count: number;
  themeColor: string;
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        alignItems: 'center',
        height: '66px',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: '64px',
            height: '64px',
            borderRadius: '13px',
            border: `3.5px solid ${themeColor}`,
            backgroundColor: themeColor,
            boxShadow: `0 6px 16px ${themeColor}66, inset 0 3px 6px rgba(255, 255, 255, 0.45)`,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ))}
    </Box>
  );
};

// チームごとの詳細パネル（高さを少し下げてタイマーとの美しい余白を形成）
const TeamStatusCard = ({ fieldSide }: { fieldSide: FieldSideType }) => {
  const teamName = useSelector<RootState, string>(
    (state) => state.match.teams[fieldSide]?.name ?? '',
  );
  const { taskObjects } = useCurrentMatchState(fieldSide);

  const contactMaterial = (taskObjects.contact_material ?? 0) >= 1;
  const materialOnBase = taskObjects.material_on_base ?? 0;
  const castleTier1 = taskObjects.castle_tier1 ?? 0;
  const castleTier2 = taskObjects.castle_tier2 ?? 0;
  const castleTier3 = taskObjects.castle_tier3 ?? 0;

  const isRed = fieldSide === 'red';
  const brandColor = isRed ? '#ef4444' : '#3b82f6';

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        border: `3px solid ${brandColor}40`,
        boxShadow: `0 8px 28px ${brandColor}18, 0 4px 12px rgba(0,0,0,0.05)`,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ヘッダー: チームアイコン + チーム名 + 建材接触 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `2px solid ${brandColor}25`,
          pb: 1,
          flexShrink: 0,
        }}
      >
        {/* 左: チームカラーサークルアイコン + チーム名 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: brandColor,
              boxShadow: `0 0 8px ${brandColor}88`,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#1f2937',
              maxWidth: '360px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {teamName}
          </Typography>
        </Box>

        {/* 右: 建材接触バッジ */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            px: 1.5,
            py: 0.4,
            borderRadius: '12px',
            backgroundColor: contactMaterial ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 0, 0, 0.04)',
            border: `1.5px solid ${contactMaterial ? '#16a34a' : '#d1d5db'}`,
          }}
        >
          {contactMaterial ? (
            <CheckCircleIcon sx={{ fontSize: '20px', color: '#16a34a' }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: '20px', color: '#9ca3af' }} />
          )}
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 800,
              color: contactMaterial ? '#15803d' : '#6b7280',
            }}
          >
            建材接触
          </Typography>
        </Box>
      </Box>

      {/* メイン: 城のビジュアル（囲いの約8割の大きさでバランス良く配置） */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.2,
          my: 'auto',
          py: 0.5,
          width: '100%',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* 3段目 (ゴールド) */}
        <TierBlockRow count={castleTier3} themeColor="#f59e0b" />

        {/* 2段目 (シアン) */}
        <TierBlockRow count={castleTier2} themeColor="#0ea5e9" />

        {/* 1段目 (エメラルド) */}
        <TierBlockRow count={castleTier1} themeColor="#10b981" />

        {/* 土台（すのこ）のウッドバー */}
        <Box
          sx={{
            width: '80%',
            maxWidth: '480px',
            height: '16px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #795548 0%, #a1887f 50%, #795548 100%)',
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
            mt: 0.5,
          }}
        />
      </Box>

      {/* フッター: 土台アイコン + 現在搭載の建材ブロック + 個数 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          pt: 1,
          borderTop: '2px dashed rgba(0, 0, 0, 0.08)',
          flexShrink: 0,
        }}
      >
        <TableRowsIcon sx={{ fontSize: '28px', color: '#8d6e63' }} />

        {/* 搭載されている数だけのブロック */}
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center', minHeight: '28px' }}>
          {Array.from({ length: materialOnBase }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '2.5px solid #8d6e63',
                backgroundColor: '#8d6e63',
                boxShadow: '0 2px 6px rgba(141, 110, 99, 0.4)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Box>

        {/* 土台上の建材の個数を表示 */}
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 800,
            color: materialOnBase > 0 ? '#8d6e63' : '#9ca3af',
            minWidth: '30px',
            textAlign: 'left',
          }}
        >
          {materialOnBase}
        </Typography>
      </Box>
    </Box>
  );
};

export const Underlay = ({ reverse = false }: UnderlayProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        maxHeight: 'calc(100% - 16px)',
        display: 'flex',
        gap: '20px',
        boxSizing: 'border-box',
      }}
    >
      <TeamStatusCard fieldSide={reverse ? 'blue' : 'red'} />
      <TeamStatusCard fieldSide={reverse ? 'red' : 'blue'} />
    </Box>
  );
};
