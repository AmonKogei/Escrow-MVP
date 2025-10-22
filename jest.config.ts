import type { Config } from 'jest';

const config: Config = {
  rootDir: __dirname,
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.vscode/',
    '<rootDir>/../.vscode/',
    'C:/Users/USER/Downloads/node-v22.14.0/',
    'C:/Users/USER/Downloads/node-v22.14.0/.+',
    'C:/Users/USER/AppData/Local/Programs/Microsoft VS Code/resources/app/extensions/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.vscode/',
    'C:/Users/USER/Downloads/node-v22.14.0/',
  ],
  watchPathIgnorePatterns: [
    '<rootDir>/.vscode/',
    '<rootDir>/../.vscode/',
    'C:/Users/USER/Downloads/node-v22.14.0/',
    'C:/Users/USER/AppData/Local/Programs/Microsoft VS Code/resources/app/extensions/',
  ],
  cacheDirectory: '<rootDir>/.jest-cache',
};

export default config;


