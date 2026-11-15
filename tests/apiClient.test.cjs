const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../services/apiClient.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const jwt = (name, expired = false) => 'test.' + Buffer.from(JSON.stringify({
    sub: name, iat: Math.floor(Date.now() / 1000) - 300,
    exp: Math.floor(Date.now() / 1000) + (expired ? -10 : 3600),
})).toString('base64url') + '.signature';

function setup(handler, access = jwt('old'), refresh = 'refresh-old') {
    const values = new Map();
    if (access) values.set('accessToken', access);
    if (refresh) values.set('refreshToken', refresh);
    const storage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key),
    };
    const window = new EventTarget();
    window.location = { href: '/test-sessions/current/workspace' };
    let expiredEvents = 0;
    window.addEventListener('sqlix:auth-session-expired', () => expiredEvents++);
    const originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async config => {
        const answer = await handler(config);
        const response = { status: answer.status ?? 200, data: answer.data ?? {}, headers: {}, config, statusText: '' };
        if (response.status >= 400) throw new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, response);
        return response;
    };
    const module = { exports: {} };
    try {
        vm.runInNewContext(compiled, {
            module, exports: module.exports, require: () => axios,
            process: { env: {} }, window, localStorage: storage, navigator: {}, Event, URL, atob,
        });
    } finally { axios.defaults.adapter = originalAdapter; }
    return { ...module.exports, storage, window, expiredEvents: () => expiredEvents };
}

const newAccess = jwt('new');
const refreshed = () => ({ data: { result: { accessToken: newAccess, refreshToken: 'refresh-new' } } });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('expired JWT refreshes once before concurrent answer requests and rotates both tokens', async () => {
    let refreshes = 0, answers = 0;
    const context = setup(async config => {
        if (config.url === '/api/auth/refresh') { refreshes++; await pause(10); return refreshed(); }
        answers++;
        assert.equal(config.headers.get('Authorization'), 'Bearer ' + newAccess);
        assert.equal(JSON.parse(config.data).submittedAnswer, 'SELECT 42');
        return {};
    }, jwt('expired', true));
    await Promise.all(Array.from({ length: 10 }, () => context.apiClient.post('/api/test-sessions/current/answers/q', { submittedAnswer: 'SELECT 42' })));
    assert.equal(refreshes, 1); assert.equal(answers, 10);
    assert.equal(context.storage.getItem('refreshToken'), 'refresh-new');
});

test('parallel and late 401 responses reuse a single refresh then replay original requests', async () => {
    let refreshes = 0, oldRequests = 0, replayed = 0;
    const old = jwt('old');
    const context = setup(async config => {
        if (config.url === '/api/auth/refresh') { refreshes++; await pause(5); return refreshed(); }
        if (config.headers.get('Authorization') === 'Bearer ' + old) {
            oldRequests++; if (oldRequests === 5) await pause(40);
            return { status: 401 };
        }
        replayed++; return {};
    }, old);
    await Promise.all(Array.from({ length: 5 }, () => context.apiClient.post('/api/test-sessions/current/submit', {})));
    assert.equal(refreshes, 1); assert.equal(oldRequests, 5); assert.equal(replayed, 5);
});

test('a request rejected again after refresh is not retried forever', async () => {
    let refreshes = 0, requests = 0;
    const context = setup(async config => {
        if (config.url === '/api/auth/refresh') { refreshes++; return refreshed(); }
        requests++; return { status: 401 };
    });
    await assert.rejects(context.apiClient.get('/protected'));
    assert.equal(refreshes, 1); assert.equal(requests, 2);
});

test('403 permission failures never refresh', async () => {
    let refreshes = 0;
    const context = setup(async config => { if (config.url === '/api/auth/refresh') refreshes++; return { status: 403 }; });
    await assert.rejects(context.apiClient.get('/api/admin/users'));
    assert.equal(refreshes, 0); assert.ok(context.storage.getItem('accessToken'));
});

for (const failure of ['server', 'network']) {
    test(failure + ' failure during refresh retains tokens and the current workspace', async () => {
        const expired = jwt('old', true);
        const context = setup(async () => {
            if (failure === 'network') throw new axios.AxiosError('Timeout', 'ECONNABORTED');
            return { status: 503 };
        }, expired);
        await assert.rejects(context.apiClient.post('/protected', {}));
        assert.equal(context.storage.getItem('accessToken'), expired);
        assert.equal(context.storage.getItem('refreshToken'), 'refresh-old');
        assert.equal(context.expiredEvents(), 0);
        assert.equal(context.window.location.href, '/test-sessions/current/workspace');
    });
}

test('invalid refresh token expires credentials without navigating away from the editor', async () => {
    const context = setup(async () => ({ status: 401 }), jwt('old', true));
    await assert.rejects(context.apiClient.get('/protected'));
    assert.equal(context.storage.getItem('accessToken'), null);
    assert.equal(context.storage.getItem('refreshToken'), null);
    assert.equal(context.expiredEvents(), 1);
    assert.equal(context.window.location.href, '/test-sessions/current/workspace');
});

test('logout during refresh cannot resurrect the old session', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const context = setup(async () => { await gate; return refreshed(); });
    const pending = context.refreshAccessToken();
    context.clearAuthTokens(); release();
    await assert.rejects(pending);
    assert.equal(context.storage.getItem('accessToken'), null);
    assert.equal(context.storage.getItem('refreshToken'), null);
});

test('an older refresh response cannot overwrite a newer login', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const context = setup(async () => { await gate; return refreshed(); });
    const pending = context.refreshAccessToken();
    const newer = jwt('new-login');
    context.storeAuthTokens(newer, 'refresh-new-login');
    release();
    assert.equal(await pending, newer);
    assert.equal(context.storage.getItem('refreshToken'), 'refresh-new-login');
});

test('public login ignores expired credentials and never starts refresh', async () => {
    const context = setup(async config => {
        assert.equal(config.url, '/api/auth/login');
        assert.equal(config.headers.get('Authorization'), undefined);
        return {};
    }, jwt('old', true));
    await context.apiClient.post('/api/auth/login', { identifier: 'qa', password: 'synthetic' });
});

test('logout uses the rotated refresh token after renewing expired access', async () => {
    const context = setup(async config => {
        if (config.url === '/api/auth/refresh') return refreshed();
        assert.equal(JSON.parse(config.data).refreshToken, 'refresh-new');
        return {};
    }, jwt('old', true));
    await context.apiClient.post('/api/auth/logout', { refreshToken: 'refresh-old' });
});

test('missing access token can recover from a valid refresh token', async () => {
    let refreshes = 0;
    const context = setup(async config => {
        if (config.url === '/api/auth/refresh') { refreshes++; return refreshed(); }
        assert.equal(config.headers.get('Authorization'), 'Bearer ' + newAccess);
        return {};
    }, null);
    await context.apiClient.get('/protected');
    assert.equal(refreshes, 1);
});
