import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

type StatusCallback = (status: AVPlaybackStatusSuccess) => void;

class PlayerService {
  private sound: Audio.Sound | null = null;
  private onStatusUpdate: StatusCallback | null = null;
  private onPlaybackFinished: (() => void) | null = null;
  private isLoading = false;

  setOnStatusUpdate(cb: StatusCallback) {
    this.onStatusUpdate = cb;
  }

  setOnPlaybackFinished(cb: () => void) {
    this.onPlaybackFinished = cb;
  }

  private handleStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[PlayerService] Playback error:', status.error);
      }
      return;
    }

    this.onStatusUpdate?.(status);

    // Song ended naturally
    if (status.didJustFinish && !status.isLooping) {
      this.onPlaybackFinished?.();
    }
  };

  async loadAndPlay(uri: string): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // Unload previous
      await this.unloadCurrent();

      // Configure audio session
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      console.log('[PlayerService] Loading:', uri);

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        this.handleStatus
      );

      this.sound = sound;
    } catch (error) {
      console.error('[PlayerService] Load error:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async pause(): Promise<void> {
    try {
      await this.sound?.pauseAsync();
    } catch (error) {
      console.error('[PlayerService] Pause error:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      await this.sound?.playAsync();
    } catch (error) {
      console.error('[PlayerService] Resume error:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.sound?.stopAsync();
    } catch (error) {
      console.error('[PlayerService] Stop error:', error);
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    try {
      await this.sound?.setPositionAsync(positionMs);
    } catch (error) {
      console.error('[PlayerService] Seek error:', error);
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    try {
      await this.sound?.setRateAsync(rate, true);
    } catch (error) {
      console.error('[PlayerService] Rate error:', error);
    }
  }

  private async unloadCurrent(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch {
        // Ignore unload errors
      }
      this.sound = null;
    }
  }

  async cleanup(): Promise<void> {
    await this.unloadCurrent();
    this.onStatusUpdate = null;
    this.onPlaybackFinished = null;
  }
}

// Singleton
export const playerService = new PlayerService();
