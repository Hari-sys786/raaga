import { initializeAudio, playAudio, pauseAudio, stopAudio, resumeAudio } from '../audioManager';
import { Audio } from 'expo-av';

jest.mock('expo-av');

let mockPlaybackInstance;

beforeEach(() => {
  mockPlaybackInstance = {
    loadAsync: jest.fn(),
    playAsync: jest.fn(),
    stopAsync: jest.fn(),
    pauseAsync: jest.fn(),
    unloadAsync: jest.fn(),
    setOnPlaybackStatusUpdate: jest.fn(),
  };

  Audio.Sound.mockImplementation(() => mockPlaybackInstance);
});

describe('Audio Manager', () => {
  test('initializeAudio initializes playback instance', async () => {
    await initializeAudio();
    expect(Audio.Sound).toHaveBeenCalled();
    expect(mockPlaybackInstance.setOnPlaybackStatusUpdate).toHaveBeenCalled();
  });

  test('playAudio loads and plays audio', async () => {
    const source = { uri: 'test-audio.mp3' };
    await playAudio(source);
    expect(mockPlaybackInstance.loadAsync).toHaveBeenCalledWith(source, {}, true);
    expect(mockPlaybackInstance.playAsync).toHaveBeenCalled();
  });

  test('pauseAudio pauses the playback', async () => {
    await playAudio({ uri: 'test-audio.mp3' });
    await pauseAudio();
    expect(mockPlaybackInstance.pauseAsync).toHaveBeenCalled();
  });

  test('stopAudio stops and unloads the playback', async () => {
    await playAudio({ uri: 'test-audio.mp3' });
    await stopAudio();
    expect(mockPlaybackInstance.stopAsync).toHaveBeenCalled();
    expect(mockPlaybackInstance.unloadAsync).toHaveBeenCalled();
  });

  test('resumeAudio resumes playback if paused', async () => {
    await playAudio({ uri: 'test-audio.mp3' });
    await pauseAudio();
    await resumeAudio();
    expect(mockPlaybackInstance.playAsync).toHaveBeenCalled();
  });
});