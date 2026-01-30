// Mock for Expo Winter APIs (structuredClone, fetch, etc.)
// This prevents "import outside test scope" errors in Jest

// Mock installGlobal module
const installGlobal = {
  installGlobal: jest.fn((name, getValue) => {
    // Don't actually install globals, just mock the function
  }),
};

// Mock TextDecoder
const TextDecoder = jest.fn();
const TextDecoderStream = jest.fn();
const TextEncoderStream = jest.fn();

// Mock URL
const URL = jest.fn();
const URLSearchParams = jest.fn();

// Mock ImportMetaRegistry
const ImportMetaRegistry = jest.fn();

// Mock FormData patch
const installFormDataPatch = jest.fn();

// Mock structuredClone
const structuredClone = jest.fn((obj) => JSON.parse(JSON.stringify(obj)));

// Default export for the main winter module
module.exports = {
  // For installGlobal.ts
  installGlobal: installGlobal.installGlobal,
  
  // For TextDecoder.ts
  TextDecoder,
  
  // For TextDecoderStream.ts  
  TextDecoderStream,
  TextEncoderStream,
  
  // For url.ts
  URL,
  URLSearchParams,
  
  // For ImportMetaRegistry.ts
  ImportMetaRegistry,
  
  // For FormData.ts
  installFormDataPatch,
  
  // Direct export for structuredClone
  structuredClone,
  
  // Default export
  default: {
    structuredClone,
    installGlobal: installGlobal.installGlobal,
  },
};

// Also set up global mocks
if (typeof global !== 'undefined') {
  global.structuredClone = global.structuredClone || structuredClone;
}
