module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module',
    },
    env: {
        browser: true,
        // jquery: true,
    },
    extends: 'google',
    rules: {
        'max-len': ['error', 120, {ignoreComments: true, ignoreStrings: true}],
        'linebreak-style': 'off',
        'require-jsdoc': 'off',

        semi: ['error', 'never'],
    },
}
