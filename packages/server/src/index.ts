import crypt from 'node:crypto';
import path from 'node:path';
import { rootReducer } from '@rolimoa/common/redux';
import { connectedDevicesStateSlice } from '@rolimoa/common/redux';
import express from 'express';
import expressWs from 'express-ws';
import { type AnyAction, createStore } from 'redux';
import WebSocket from 'ws';
import { loadFromFile, saveToFile } from './backup.js';

import { notifyRotacsMatchStatus } from './rotacsClient.js';

const { app, getWss } = expressWs(express());

const store = createStore(rootReducer, loadFromFile('./save'));

app.ws('/ws', (ws, _req) => {
  const wss = getWss();
  const sessionId = crypt.randomUUID();
  console.log(`connected (sid: ${sessionId})`);

  // 初回接続したクライアントに、現在の試合状況を送信する
  ws.send(
    JSON.stringify({
      type: 'welcome',
      sid: sessionId,
      time: Date.now(),
      state: store.getState(),
    }),
  );

  // クライアントから送られたdispatchの処理
  ws.on('message', async (message) => {
    const body = JSON.parse(message.toString());
    const type = body?.type;
    console.log('on message: ', body);

    if (type === 'dispatch' || type === 'dispatch_all') {
      const clientActions = body?.actions;
      const actions = clientActions.map((action: AnyAction) => {
        if (action.type === 'operationLogs/addLog') {
          return {
            ...action,
            payload: {
              ...action.payload,
              at: Date.now(),
              by: sessionId,
            },
          };
        }
        return action;
      });

      for (const action of actions) {
        store.dispatch(action);
      }

      // Notify rotacs about match/phase update asynchronously
      notifyRotacsMatchStatus(store.getState());

      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, actions }));
        }
      }
    }
    if (type === 'save_store') {
      await saveToFile('./save', store);
    }
  });

  // 切断
  ws.on('close', (code, reason) => {
    console.log(`disconnect (sid: ${sessionId}): ${code} ${reason}`);

    const action = connectedDevicesStateSlice.actions.removeDevice({
      sockId: sessionId,
    });
    store.dispatch(action);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'dispatch',
            actions: [action],
          }),
        );
      }
    }
  });
});

/**
 * ストアの状態をHTTPで簡単に取得するAPI
 *
 * - `/api/state`
 *     - ストアの全状態を取得(数十KBのJSON)
 * - `/api/state?q=score.fields.blue.tasks.TASK_ID`
 *     - 青コートのタスク"TASK_ID"の値を取得(整数値)
 * - `/api/state?q=connectedDevices`
 *     - 接続中のデバイス一覧を取得(JSON)
 */
app.get('/api/state', (req, res) => {
  const query = req.query.q?.toString();
  const state = store.getState();
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let result: any = state;
  if (query) {
    for (const key of query.split('.')) {
      if (result[key] === undefined) {
        res.status(404).send('Not Found');
        break;
      }
      result = result[key];
    }
  }
  res.json(result);
});

/**
 * Homepage APIから対戦表一覧を取得・プロキシするエンドポイント (CORS回避用)
 */
app.get('/api/homepage/matches', async (req, res) => {
  try {
    let rawUrl = req.query.url?.toString().trim();
    if (rawUrl && rawUrl.includes('localhost:8000')) {
      rawUrl = undefined;
    }
    let targetUrl =
      rawUrl ||
      process.env.HOMEPAGE_MATCH_API_URL ||
      process.env.HOMEPAGE_API_URL ||
      'https://kantouharurobo.com/staff/matches/api/list/';

    if (!targetUrl.includes('/matches/api/list/')) {
      const cleanBase = targetUrl.replace(/\/+$/, '');
      targetUrl = `${cleanBase}/staff/matches/api/list/`;
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      res.status(response.status).json({
        error: `Failed to fetch from homepage: ${response.status} ${response.statusText}`,
      });
      return;
    }
    const data = await response.json();
    res.json(data);
  } catch (err: unknown) {
    console.error('[Homepage Matches Proxy] Error fetching matches:', err);
    res.status(500).json({ error: String(err) });
  }
});

// クライアントのホスティング
app.use(express.static('../client/dist'));
app.get('*', (_req, res, _next) => {
  res.sendFile(path.resolve('../client/dist/index.html'));
});

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`server started on http://${HOST}:${PORT}`);
});

