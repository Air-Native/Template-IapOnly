import TrackPlayer, {
	Capability,
	AppKilledPlaybackBehavior,
	Event,
	State,
    RepeatMode
} from 'react-native-track-player';

addArtwork = (track) => {
    return {
        artwork: require('../sources/icon.png'),
        ...track
    }
}

class Player {
	constructor() {
		this.status = '';
		this.queue = [];
		this.currentTrack = {};
		this.event = (name) => console.warn('Function is not defined');
		this.state = (name, value) => console.warn('Function is not defined');
		this.invoke = null;
		this.trackChangeListener = null;
	}

	async setupPlayer() {
		await TrackPlayer.setupPlayer();
		this.updateOptions();
		TrackPlayer.addEventListener(Event.PlaybackState, this.onStateChange);
	}

	onTrackChange = (state) => {
		console.log('Track change: ', state)
		if (state.nextTrack !== null && state.nextTrack !== undefined) {
            TrackPlayer.getTrack(state.nextTrack).then( track => {
                console.log('New Track', track)
                this.state('currentTrack', track?.id || '');
                this.event('trackchanged');
            })
        }
	};

	onStateChange = ({ state }) => {
		switch (state) {
			case State.Ready: {
				if (!this.trackChangeListener) {
					this.trackChangeListener = TrackPlayer.addEventListener(
						Event.PlaybackTrackChanged,
						this.onTrackChange
					);
				}

				this.state('playing', false);
				this.event('ready');
				break;
			}
			case State.Playing: {
				this.state('playing', true);
				this.event('play');
				break;
			}
			case State.Paused: {
				this.state('playing', false);
				this.event('pause');
				break;
			}
		}
	};

    async getCurrentState() {
        try {
            console.log('run getCurrentState')
            const trackIndex = await TrackPlayer.getCurrentTrack()
            let track = ''
            if (trackIndex !== null && trackIndex !== undefined) {
                track = (await TrackPlayer.getTrack(trackIndex))?.id || ""
            }
            console.log('getCurrentState track', track)
            const state = await TrackPlayer.getState()

            console.log('getCurrentState',state === State.Playing, track)

            return { isPlaying: state === State.Playing, track };
        } catch (err) {
            console.warn(err)
            console.error('getCurrentState Error: ', err.message)
        }
    }

	updateOptions(options) {
		TrackPlayer.updateOptions({
			capabilities: [
				Capability.Play,
				Capability.Pause,
				Capability.SkipToNext,
				Capability.SkipToPrevious,
				Capability.Stop,
			],
			compactCapabilities: [
				Capability.Play,
				Capability.Pause,
				Capability.SkipToNext,
				Capability.SkipToPrevious,
			],
			android: {
				// This is the default behavior
				appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
			},
		});
	}

	async play(track) {
		if (track) {
            await TrackPlayer.pause()
            await TrackPlayer.reset()
			await TrackPlayer.add([addArtwork(track)]);
            this.state('currentTrack', track?.id || '');
		}
		await TrackPlayer.play();
		this.event('play');
	}

	async pause() {
		await TrackPlayer.pause();
		this.event('pause');
	}

	addToQueue(track) {
		return TrackPlayer.add([addArtwork(track)]);
	}

	async removeFromQueue(track) {
		await TrackPlayer.remove();
	}

	async setQueue(queue) {
		await TrackPlayer.reset();
		await TrackPlayer.add(queue.map(addArtwork));
	}

	clearQueue() {
		return TrackPlayer.reset();
	}

	playNext() {
		return TrackPlayer.skipToNext();
	}

	playPrevious() {
		return TrackPlayer.skipToPrevious();
	}

	setVolume(volume) {
		return TrackPlayer.setVolume(volume);
	}

    async getCurrentTrack() {
        const trackNum = await TrackPlayer.getCurrentTrack()
        if (!trackNum) return false

        const track = await TrackPlayer.getTrack(trackNum)
        console.log('getCurrentTrack', track)
        return track.id
    }

    async setRepeatMode (mode) {
        switch (mode) {
            case 'Track': {
                const repeatMode = await TrackPlayer.setRepeatMode(RepeatMode.Track)
                console.log('New Repeat mode: ', repeatMode)
                return 1
            }
            case 'Queue': {
                const repeatMode = await TrackPlayer.setRepeatMode(RepeatMode.Queue)
                console.log('New Repeat mode: ', repeatMode)
                return 2
            }
            default: {
                const repeatMode = await TrackPlayer.setRepeatMode(RepeatMode.Off)
                console.log('New Repeat mode: ', repeatMode)
                return 0
            }
        }
    }

	bindFunctions(invoke) {
		this.invoke = invoke;
		this.event = (name) => {
			const fn = this.invoke.bind('triggerEventPlayer');
			fn(name);
		};
		this.state = (name, value) => {
			const fn = this.invoke.bind('publishStatePlayer');
			fn(name, value);
		};
	}
}

module.exports = Player;
