

import fetch from "lib/fetch";
import reqwest_ from "reqwest";

jest.mock('reqwest', () => jest.fn());

const reqwest: JestMockFn<any, any> = (reqwest_ as any);

describe('Fetch util', () => {
  afterEach(() => {
    reqwest.mockReset();
  });

  it('returns a promise which rejects on network errors', () => {
    reqwest.mockImplementationOnce(() => Promise.resolve({
      status: 0
    }));

    return fetch('error-path').catch(ex => {
      expect(ex instanceof Error).toBe(true);
      expect(ex.message).toMatch(/fetch error/i);
    });
  });

  it('returns a promise which resolves on error responses', () => {
    reqwest.mockImplementationOnce(() => Promise.resolve({
      status: 404,
      responseText: 'Error response',
      statusText: 'Not Found'
    }));

    return fetch('404-error-response').then(resp => {
      expect(resp.ok).toBe(false);
      expect(resp.status).toBe(404);
      expect(resp.statusText).toBe('Not Found');

      return resp.text();
    }).then(responseText => {
      expect(responseText).toBe('Error response');
    });
  });

  it('rejects if response is not correct json', () => {
    reqwest.mockImplementationOnce(() => Promise.resolve({
      status: 200,
      responseText: 'Plain text',
      statusText: 'OK'
    }));

    return fetch('invalid-json').then(resp => {
      expect(resp.ok).toBe(true);
      expect(resp.status).toBe(200);
      expect(resp.statusText).toBe('OK');

      return resp.json();
    }).catch(ex => {
      expect(ex instanceof Error).toBe(true);
      expect(ex.message).toMatch(/json/i);
    });
  });

  it('rejects if trying to consume the body multiple times', () => {
    reqwest.mockImplementationOnce(() => Promise.resolve({
      status: 200,
      responseText: '{}',
      statusText: 'OK'
    }));

    return fetch('multiple-body').then(resp => Promise.all([resp.text(), resp.json()])).catch(ex => {
      expect(ex instanceof TypeError).toBe(true);
      expect(ex.message).toBe('Already read');
    });
  });

  it('resolves a correct response in plain text', () => {
    reqwest.mockImplementationOnce(() => Promise.resolve({
      status: 200,
      responseText: '{"json":true}',
      statusText: 'OK'
    }));

    return fetch('correct-json').then(resp => {
      expect(resp.ok).toBe(true);
      expect(resp.status).toBe(200);
      expect(resp.statusText).toBe('OK');

      return resp.text();
    }).then(responseText => {
      expect(responseText).toBe('{"json":true}');
    });
  });

  it('resolves a correct response in json', () => {
    reqwest.mockImplementationOnce(() => Promise.resolve({
      status: 200,
      responseText: '{"json":true}',
      statusText: 'OK'
    }));

    return fetch('correct-json').then(resp => {
      expect(resp.ok).toBe(true);
      expect(resp.status).toBe(200);
      expect(resp.statusText).toBe('OK');

      return resp.json();
    }).then(json => {
      expect(json).toEqual({
        json: true
      });
    });
  });
});