module.exports = {
  preset: '@vue/vue3-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
  },
};