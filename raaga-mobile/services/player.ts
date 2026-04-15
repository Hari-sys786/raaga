import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioStatus } from 'expo-audio';

type StatusCallback = (status: {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
}) => void;

class PlayerService {
  private player: AudioPlayer | null = null;
  private onStatusUpdate: StatusCallback | null = null;
  private onPlaybackFinished: (() => void) | null = null;
  private isLoading = false;
  private currentMetadata: { title?: string; artist?: string; artworkUrl?: string } = {};

  setOnStatusUpdate(cb: StatusCallback) {
    this.onStatusUpdate = cb;
  }

  setOnPlaybackFinished(cb: () => void) {
    this.onPlaybackFinished = cb;
  }

  private handleStatus = (status: AudioStatus) => {
    this.onStatusUpdate?.({
      isLoaded: status.isLoaded,
      isPlaying: status.playing,
      positionMillis: (status.currentTime ?? 0) * 1000,
      durationMillis: (status.duration ?? 0) * 1000,
      didJustFinish: status.didJustFinish,
    });

    if (status.didJustFinish) {
      this.onPlaybackFinished?.();
    }
  };

  async loadAndPlay(uri: string, metadata?: { title?: string; artist?: string; artwork?: string }): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // Configure audio session for background playback
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });

      // Clean up previous player
      if (this.player) {
        this.player.remove();
        this.player = null;
      }

      // Create new player
      this.player = createAudioPlayer({ uri }, { updateInterval: 500 });

      // Set lock screen controls with metadata
      if (metadata) {
        this.currentMetadata = {
          title: metadata.title,
          artist: metadata.artist,
          artworkUrl: metadata.artwork,
        };
      }

      // Wait for the player to load before playing
      const player = this.player;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio load timeout (15s)'));
        }, 15000);

        const onStatus = (status: AudioStatus) => {
          // Forward status updates
          this.handleStatus(status);

          if (status.isLoaded) {
            clearTimeout(timeout);
            player.removeListener('playbackStatusUpdate', onStatus);
            // Re-attach the normal listener
            player.addListener('playbackStatusUpdate', this.handleStatus);
            resolve();
          }
        };

        // If already loaded (e.g. cached), resolve immediately
        if (player.isLoaded) {
          clearTimeout(timeout);
          player.addListener('playbackStatusUpdate', this.handleStatus);
          resolve();
        } else {
          player.addListener('playbackStatusUpdate', onStatus);
        }
      });

      // Now play
      player.play();

      // Set lock screen after play starts
      try {
        player.setActiveForLockScreen(true, this.currentMetadata, {
          showSeekForward: true,
          showSeekBackward: true,
        });
      } catch {
        // lock screen controls optional
      }

      console.log('[PlayerService] Playing:', uri);
    } catch (error) {
      console.error('[PlayerService] Load error:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async pause(): Promise<void> {
    try {
      this.player?.pause();
    } catch (error) {
      console.error('[PlayerService] Pause error:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      this.player?.play();
    } catch (error) {
      console.error('[PlayerService] Resume error:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      this.player?.pause();
      this.player?.seekTo(0);
    } catch (error) {
      console.error('[PlayerService] Stop error:', error);
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    try {
      await this.player?.seekTo(positionMs / 1000);
    } catch (error) {
      console.error('[PlayerService] Seek error:', error);
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    try {
      this.player?.setPlaybackRate(rate);
    } catch (error) {
      console.error('[PlayerService] Rate error:', error);
    }
  }

  updateMetadata(metadata: { title?: string; artist?: string; artwork?: string }) {
    this.currentMetadata = {
      title: metadata.title,
      artist: metadata.artist,
      artworkUrl: metadata.artwork,
    };
    try {
      this.player?.updateLockScreenMetadata(this.currentMetadata);
    } catch {
      // ignore if player not active
    }
  }

  async cleanup(): Promise<void> {
    if (this.player) {
      try {
        this.player.clearLockScreenControls();
        this.player.remove();
      } catch {
        // ignore cleanup errors
      }
      this.player = null;
    }
    this.onStatusUpdate = null;
    this.onPlaybackFinished = null;
  }
}

// Singleton
export const playerService = new PlayerService();
