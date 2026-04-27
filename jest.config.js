module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": "babel-jest"
  },
  testEnvironment: "node",
  verbose: true,
  transformIgnorePatterns: [
    "/node_modules/(?!react-native|expo-av)/"
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(png|jpg|jpeg|gif|webp|svg)$": "<rootDir>/test/__mocks__/fileMock.js"
  }
};