import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "./",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // globals: {
  //   "ts-jest": {
  //     isolatedModules: true,
  //     tsconfig: "tsconfig.test.json",
  //   },
  // },
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/index.ts",
    "!src/**/types.ts",
    "!src/**/constants.ts",
    "!src/**/__tests__/**",
  ],
};

export default config;
