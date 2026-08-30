import type { ConfigType } from './types.js';

export default {
  contest_info: {
    name: '関東夏ロボコン2026',
  },
  rule: {
    global_objects: [],
    task_objects: [
      {
        id: 'contact_material',
        description: '建材に接触 (10点)',
        initialValue: 0,
        min: 0,
        max: 1,
      },
      {
        id: 'material_on_base',
        description: '土台上の建材 (5点/個)',
        initialValue: 0,
        min: 0,
        max: 6,
      },
      {
        id: 'castle_tier1',
        description: '丘ゾーン: 城1段目 (10点/個)',
        initialValue: 0,
        min: 0,
        max: 6,
      },
      {
        id: 'castle_tier2',
        description: '丘ゾーン: 城2段目 (20点/個)',
        initialValue: 0,
        min: 0,
        max: 6,
      },
      {
        id: 'castle_tier3',
        description: '丘ゾーン: 城3段目 (70点/個)',
        initialValue: 0,
        min: 0,
        max: 6,
      },
      {
        id: 'violation',
        description: '違反回数',
        initialValue: 0,
        min: 0,
      },
    ],
    score: {
      format: 'simple',
      expression: [
        {
          id: 'contact_material',
          coefficient: 10,
        },
        {
          id: 'material_on_base',
          coefficient: 5,
        },
        {
          id: 'castle_tier1',
          coefficient: 10,
        },
        {
          id: 'castle_tier2',
          coefficient: 20,
        },
        {
          id: 'castle_tier3',
          coefficient: 70,
        },
      ],
    },
    vgoal: {
      name: '築城',
      condition: {
        type: 'alwaysOk',
      },
    },
    control_panel: {
      type: 'custom',
      panels: [
        {
          id: 'contact_material',
          type: 'multi_button',
          option: {
            buttons: [
              {
                command: '=0',
                label: '0',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '+1',
                label: '+1',
                shortcutKey: 'Q',
              },
            ],
          },
        },
        {
          id: 'material_on_base',
          type: 'multi_button',
          option: {
            buttons: [
              {
                command: '=0',
                label: '0',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '-1',
                label: '-1',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '+1',
                label: '+1',
                shortcutKey: 'W',
              },
              {
                command: '+2',
                label: '+2',
              },
            ],
          },
        },
        {
          id: 'castle_tier1',
          type: 'multi_button',
          option: {
            buttons: [
              {
                command: '=0',
                label: '0',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '-1',
                label: '-1',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '+1',
                label: '+1',
                shortcutKey: 'A',
              },
              {
                command: '+2',
                label: '+2',
              },
            ],
          },
        },
        {
          id: 'castle_tier2',
          type: 'multi_button',
          option: {
            buttons: [
              {
                command: '=0',
                label: '0',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '-1',
                label: '-1',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '+1',
                label: '+1',
                shortcutKey: 'S',
              },
              {
                command: '+2',
                label: '+2',
              },
            ],
          },
        },
        {
          id: 'castle_tier3',
          type: 'multi_button',
          option: {
            buttons: [
              {
                command: '=0',
                label: '0',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '-1',
                label: '-1',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '+1',
                label: '+1',
                shortcutKey: 'D',
              },
            ],
          },
        },
        {
          id: 'violation',
          type: 'multi_button',
          option: {
            buttons: [
              {
                command: '-1',
                label: '-1',
                style: {
                  variant: 'outlined',
                },
              },
              {
                command: '+1',
                label: '+1',
                shortcutKey: 'X',
              },
            ],
          },
        },
      ],
    },
  },
  time_progress: [
    {
      id: 'preparing',
      type: 'ready',
      description: '試合開始準備中',
      custom: [
        {
          elapsedTime: 0,
          displayText: '!!   !!',
        },
      ],
    },
    {
      id: 'setting_ready',
      type: 'ready',
      description: 'セッティングタイム',
    },
    {
      id: 'setting',
      type: 'count',
      duration: 60,
      description: 'セッティングタイム',
      style: {
        timerFormat: 'm:ss',
        timerType: 'countup',
      },
      custom: [
        {
          elapsedTime: 0,
          sound: 'tone_880hz_1000ms.mp3',
        },
        {
          elapsedTime: 60,
          sound: 'tone_880hz_1000ms.mp3',
        },
      ],
    },
    {
      id: 'match_ready',
      type: 'ready',
      description: '競技開始',
    },
    {
      id: 'match_countdown',
      type: 'count',
      duration: 5,
      description: '',
      isAutoTransition: true,
      style: {
        timerFormat: 's',
        timerType: 'countdown',
      },
      custom: [
        {
          // 1音目のラグ対策のため、小さい音を鳴らす
          elapsedTime: 1,
          sound: {
            name: 'tone_440hz_500ms.mp3',
            volume: 0.01,
          },
        },
        {
          elapsedTime: 2,
          sound: 'tone_440hz_500ms.mp3',
        },
        {
          elapsedTime: 3,
          sound: 'tone_440hz_500ms.mp3',
        },
        {
          elapsedTime: 4,
          sound: 'tone_440hz_500ms.mp3',
        },
      ],
    },
    {
      id: 'match',
      type: 'count',
      duration: 180,
      description: '競技中',
      style: {
        timerFormat: 'm:ss',
        timerType: 'countup',
      },
      custom: [
        {
          elapsedTime: 0,
          displayText: 'GO',
          sound: 'tone_880hz_1000ms.mp3',
        },
        {
          // 1音目のラグ対策のため、小さい音を鳴らす
          elapsedTime: 'L-4',
          sound: {
            name: 'tone_440hz_500ms.mp3',
            volume: 0.01,
          },
        },
        {
          elapsedTime: 'L-3',
          sound: 'tone_440hz_500ms.mp3',
        },
        {
          elapsedTime: 'L-2',
          sound: 'tone_440hz_500ms.mp3',
        },
        {
          elapsedTime: 'L-1',
          sound: 'tone_440hz_500ms.mp3',
        },
        {
          elapsedTime: 'L-0',
          sound: 'tone_880hz_1000ms.mp3',
        },
      ],
    },
    {
      id: 'match_finish',
      type: 'ready',
      description: '試合終了',
      custom: [
        {
          elapsedTime: 0,
          displayText: '--   --',
        },
      ],
    },
  ],
  teams_info: [
    {
      id: '1',
      name: '触手もぐもぐ',
      school: '国際信州大',
      short: '触手もぐもぐ（国際信州大）',
    },
    {
      id: '2',
      name: '白米ぬるぬる',
      school: '国際信州大',
      short: '白米ぬるぬる（国際信州大）',
    },
    {
      id: '3',
      name: '常磐の森ねこねこカレッジ',
      school: '横浜大学',
      short: '常磐の森ねこねこカレッジ（横浜大）',
    },
  ],
  client: {
    standalone_mode: false,
  },
  option: {
    truncate_millisec_on_pause: true,
  },
} as ConfigType;
