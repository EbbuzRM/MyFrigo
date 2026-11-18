import { act, renderHook } from '@testing-library/react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ocrSpaceRecognize, convertOcrSpaceToTextBlocks } from '@/utils/ocr/ocrSpaceService';
import { usePhotoOCR } from '../usePhotoOCR';

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  __esModule: true,
  default: { recognize: jest.fn() },
  TextRecognitionScript: { LATIN: 'latin' },
}));
jest.mock('@/utils/ocr/ocrSpaceService', () => ({
  ocrSpaceRecognize: jest.fn(),
  convertOcrSpaceToTextBlocks: jest.fn(),
}));
jest.mock('@/utils/ocr/parsing', () => ({
  findAllMatches: jest.fn(() => ({ matches: [{}], anchors: [] })),
}));
jest.mock('@/utils/ocr/spatial', () => ({
  findSpatiallyAnchoredMatches: jest.fn(() => []),
}));
jest.mock('@/utils/ocr/scoring', () => ({
  selectBestDate: jest.fn((_matches, _anchors, rawText: string) => ({
    success: rawText.startsWith('valid'),
    extractedDate: rawText.startsWith('valid') ? '2027-12-25' : null,
    confidence: rawText.startsWith('valid') ? 1 : 0,
    rawText,
  })),
}));
jest.mock('@/i18n', () => ({ getCurrentLanguage: () => 'en' }));
jest.mock('@/services/LoggingService', () => ({
  LoggingService: { info: jest.fn(), warning: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const imageUri = 'file://expiry.jpg';
const localRecognize = TextRecognition.recognize as jest.Mock;
const remoteRecognize = ocrSpaceRecognize as jest.Mock;
const convertRemoteBlocks = convertOcrSpaceToTextBlocks as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  localRecognize.mockResolvedValue({ blocks: [{ text: 'no date' }] });
  remoteRecognize.mockResolvedValue(null);
  convertRemoteBlocks.mockImplementation((response: { text: string }) => [{ text: response.text }]);
});

async function runOcr() {
  const { result } = renderHook(() => usePhotoOCR());
  let outcome: Awaited<ReturnType<typeof result.current.extractExpirationDate>> | undefined;
  await act(async () => {
    outcome = await result.current.extractExpirationDate(imageUri);
  });
  return outcome;
}

it('uses one local recognition and no remote call when the local date is valid', async () => {
  localRecognize.mockResolvedValue({ blocks: [{ text: 'valid local date' }] });

  const result = await runOcr();

  expect(result?.success).toBe(true);
  expect(localRecognize).toHaveBeenCalledTimes(1);
  expect(remoteRecognize).not.toHaveBeenCalled();
});

it('stops after one remote call when the active language finds a date', async () => {
  remoteRecognize.mockResolvedValueOnce({ text: 'valid English date' });

  const result = await runOcr();

  expect(result?.success).toBe(true);
  expect(localRecognize).toHaveBeenCalledTimes(1);
  expect(remoteRecognize).toHaveBeenCalledTimes(1);
  expect(remoteRecognize).toHaveBeenCalledWith(imageUri, 'en', expect.any(Number));
  expect(localRecognize.mock.invocationCallOrder[0]).toBeLessThan(remoteRecognize.mock.invocationCallOrder[0]);
});

it('tries the other language only after the first remote result has no date', async () => {
  remoteRecognize
    .mockResolvedValueOnce({ text: 'no date' })
    .mockResolvedValueOnce({ text: 'valid Italian date' });

  const result = await runOcr();

  expect(result?.success).toBe(true);
  expect(localRecognize).toHaveBeenCalledTimes(1);
  expect(remoteRecognize).toHaveBeenCalledTimes(2);
  expect(remoteRecognize).toHaveBeenNthCalledWith(1, imageUri, 'en', expect.any(Number));
  expect(remoteRecognize).toHaveBeenNthCalledWith(2, imageUri, 'it', expect.any(Number));
});

it('gives each remote call only the time left before the OCR deadline', async () => {
  let now = 1_000_000;
  const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
  localRecognize.mockImplementation(async () => {
    now += 3000;
    return { blocks: [{ text: 'no date' }] };
  });
  remoteRecognize.mockImplementationOnce(async () => {
    now += 4000;
    return { text: 'no date' };
  });

  await runOcr();

  expect(remoteRecognize).toHaveBeenNthCalledWith(1, imageUri, 'en', 12000);
  expect(remoteRecognize).toHaveBeenNthCalledWith(2, imageUri, 'it', 8000);
  nowSpy.mockRestore();
});

it('skips the second remote call once the OCR deadline has passed', async () => {
  let now = 1_000_000;
  const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
  remoteRecognize.mockImplementationOnce(async () => {
    now += 16000;
    return { text: 'no date' };
  });

  const result = await runOcr();

  expect(result?.success).toBe(false);
  expect(remoteRecognize).toHaveBeenCalledTimes(1);
  nowSpy.mockRestore();
});

it('caps a complete failure at one local and two sequential remote attempts', async () => {
  const result = await runOcr();

  expect(result?.success).toBe(false);
  expect(localRecognize).toHaveBeenCalledTimes(1);
  expect(remoteRecognize).toHaveBeenCalledTimes(2);
  expect(remoteRecognize).toHaveBeenNthCalledWith(1, imageUri, 'en', expect.any(Number));
  expect(remoteRecognize).toHaveBeenNthCalledWith(2, imageUri, 'it', expect.any(Number));
});
