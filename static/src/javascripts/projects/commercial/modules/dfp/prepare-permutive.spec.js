// @flow

import { _ } from './prepare-permutive';

jest.mock('lib/raven');

describe('Generating Permutive payload utils', () => {
    describe('isEmpty', () => {
        it('returns true for empty values', () => {
            const emptyValues = ['', undefined, null, [], {}];
            expect(true).toBe(true);
            emptyValues.forEach(emptyValue =>
                expect(_.isEmpty(emptyValue)).toBe(true)
            );
        });

        it('returns false for non empty values', () => {
            const values = [
                'word',
                -1,
                0,
                42,
                2.35,
                ['word'],
                { word: true },
                true,
                false,
            ];
            values.forEach(value => expect(_.isEmpty(value)).toBe(false));
        });
    });
    describe('removeEmpty', () => {
        it('returns a clean object without empty fields', () => {
            const emptyPayload = {
                content: {
                    pageId: '',
                    keywords: [],
                    webPublicationDate: null,
                    series: undefined,
                    empty: {},
                },
                user: {},
            };

            const filledPayload = {
                content: {
                    premium: false,
                    id: 'Some Id',
                    title: 'Title',
                    type: 'Article',
                    authors: ['The Author'],
                },
            };
            expect(
                _.removeEmpty({
                    content: {
                        ...emptyPayload.content,
                        ...filledPayload.content,
                    },
                })
            ).toEqual({ ...filledPayload });
        });
    });
    describe('generatePayload', () => {
        it('safely removes invalid authors or keywords', () => {
            const invalidValues = [undefined, null, '', {}, []];
            const expected = {};
            invalidValues.forEach(invalid =>
                expect(
                    _.generatePayload({ author: invalid, keywords: invalid })
                ).toEqual(expected)
            );
        });
        it('splits authors and keywords to an array correctly', () => {
            const valid = {
                author: 'author1,author2',
                keywords: 'environment,travel',
            };

            const expected = {
                content: {
                    authors: ['author1', 'author2'],
                    keywords: ['environment', 'travel'],
                },
            };
            expect(_.generatePayload(valid)).toEqual(expected);
        });
        it('splits authors and keywords to an array correctly and trims whitespace', () => {
            const valid = {
                author: 'author1, author2',
                keywords: 'environment , travel',
            };

            const expected = {
                content: {
                    authors: ['author1', 'author2'],
                    keywords: ['environment', 'travel'],
                },
            };
            expect(_.generatePayload(valid)).toEqual(expected);
        });
        it('removes invalid date', () => {
            const invalidDates = ['bad date', '', null, undefined, [], {}];
            const expected = {};
            invalidDates.forEach(invalid => {
                expect(
                    _.generatePayload({ webPublicationDate: invalid })
                ).toEqual(expected);
            });
        });
        it('generates payload with valid ISO date', () => {
            const validConfig = { webPublicationDate: 1575037372000 };
            const expected = {
                content: { publishedAt: '2019-11-29T14:22:52.000Z' },
            };
            expect(_.generatePayload(validConfig)).toEqual(expected);
        });
        it('generates valid payload', () => {
            const config1 = {
                isPaidContent: false,
                pageId: '',
                contentType: 'Network Front',
                section: 'uk',
            };
            const expected1 = {
                content: {
                    premium: false,
                    type: 'Network Front',
                    section: 'uk',
                },
            };
            const config2 = {
                pageId: 'world/2019/nov/29',
                headline: 'Headline',
                contentType: 'Article',
                section: 'world',
                author: 'author1',
                keywords: 'world/nato,World news,France',
                webPublicationDate: 1575048268000,
                series: 'politics series',
            };
            const expected2 = {
                content: {
                    id: 'world/2019/nov/29',
                    title: 'Headline',
                    type: 'Article',
                    section: 'world',
                    authors: ['author1'],
                    keywords: ['world/nato', 'World news', 'France'],
                    publishedAt: '2019-11-29T17:24:28.000Z',
                    series: 'politics series',
                },
            };

            expect(_.generatePayload(config1)).toEqual(expected1);
            expect(_.generatePayload(config2)).toEqual(expected2);
        });
    });
    describe('runPermutive', () => {
        it('catches errors and calls the logger correctly when no global permutive', () => {
            const logger = jest.fn();
            _.runPermutive({}, undefined, logger);
            const err = logger.mock.calls[0][0];
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe('Global Permutive setup error');
        });
        it('catches errors and calls the logger correctly when the payload is empty', () => {
            const logger = jest.fn();
            _.runPermutive({}, { addon: jest.fn() }, logger);
            const err = logger.mock.calls[0][0];
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe('Empty Permutive payload');
        });
        it('calles the permutive addon method with the correct payload', () => {
            const logger = jest.fn();
            const mockPermutive = { addon: jest.fn() };
            const config = { section: 'uk' };

            _.runPermutive(config, mockPermutive, logger);
            expect(mockPermutive.addon).toHaveBeenCalledWith('web', {
                page: { content: { section: 'uk' } },
            });
            expect(logger).not.toHaveBeenCalled();
        });
    });
});