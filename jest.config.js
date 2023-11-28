/** @format */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    reporters: ['default', 'jest-junit' /*, 'jest-sonar'*/],
    modulePathIgnorePatterns: ['/dist'],
    transformIgnorePatterns: ['/node_modules/(?!@youwol)'],
    moduleNameMapper: [
        'd3-selection',
        'd3-drag',
        'd3-dispatch',
        'd3-zoom',
        'd3-interpolate',
        'd3-color',
        'd3-transition',
        'd3-timer',
        'd3-ease',
        'd3-scale',
        'd3-array',
        'd3-format',
        'd3-time',
    ].reduce(
        (acc, e) => ({
            ...acc,
            [e]: `<rootDir>/node_modules/${e}/dist/${e}.min.js`,
        }),
        {},
    ),
}
