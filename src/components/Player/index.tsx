import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';

import { getSongUrl } from 'tools/song';
import { PlayMode } from 'constants/player';

import MiniPlayer from './MiniPlayer';
import NormalPlayer from './NormalPlayer';
import PlayList from './PlayList';
import StyledPlayer from './style';

interface PlayerProps {
  mode?: PlayMode;
  fullScreen?: boolean;
  playing?: boolean;
  currentSong: Data.SongListItem | null;
  currentSongIndex: number;
  playList: Data.SongListItem[];
  speed?: number;
  onPlayButtonClick?: (status: boolean) => void;
  onToggleFullScreen?: (status: boolean) => void;
  onChangePlayMode?: () => void;
  onDeleteItemSong?: (item: Data.SongListItem, index: number) => void;
  onSelectItemSong?: (item: Data.SongListItem, index: number) => void;
  onCleanList?: () => void;
  onSelectSpeed?: (speed: number) => void;
  onError?: (msg: string) => void;
}

function Player({
  mode = PlayMode.loop,
  fullScreen = false,
  playing = false,
  currentSong,
  currentSongIndex,
  playList,
  speed = 1,
  onPlayButtonClick,
  onToggleFullScreen,
  onChangePlayMode,
  onDeleteItemSong,
  onSelectItemSong,
  onCleanList,
  onSelectSpeed,
  onError,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const [duration, setDuration] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [showList, setShowList] = useState(false);

  const percent = useMemo(() => {
    const p = currentTime / duration;
    return p ? p : 0;
  }, [currentTime, duration]);

  const playLoop = useCallback(() => {
    onPlayButtonClick && onPlayButtonClick(true);
    audioRef.current?.play();
  }, [onPlayButtonClick]);

  const playNextSong = useCallback(() => {
    if (playList.length === 1) {
      playLoop();
      return;
    }

    let index = currentSongIndex + 1;
    if (index === playList.length) index = 0;
    if (!playing && onPlayButtonClick) onPlayButtonClick(true);
    onSelectItemSong && onSelectItemSong(playList[index], index);
  }, [playList, currentSongIndex, playing, playLoop, onPlayButtonClick, onSelectItemSong]);

  const handleMiniPlayerContainerClick = useCallback(() => {
    onToggleFullScreen && onToggleFullScreen(true);
  }, [onToggleFullScreen]);

  const handleNormalPlayerBackButtonClick = useCallback(() => {
    onToggleFullScreen && onToggleFullScreen(false);
  }, [onToggleFullScreen]);

  const handleAudioUpdateTime = useCallback((ev: any) => {
    setCurrentTime(ev.target.currentTime);
  }, []);

  const handleChangeProgress = useCallback(
    (p: number) => {
      const newTime = p * duration;
      if (!audioRef.current) return;
      audioRef.current.currentTime = newTime;
      if (!playing) {
        onPlayButtonClick && onPlayButtonClick(true);
      }
    },
    [duration, playing, onPlayButtonClick],
  );

  const handleAudioEnded = useCallback(() => {
    if (mode === PlayMode.loop) {
      playLoop();
    } else {
      playNextSong();
    }
  }, [mode, playLoop, playNextSong]);

  const handleAudioError = useCallback(() => {
    playNextSong();
    onError && onError('????????????');
  }, [playNextSong, onError]);

  const handleShowList = useCallback(() => {
    setShowList(true);
  }, []);

  const handleHideList = useCallback(() => {
    setShowList(false);
  }, []);

  const handleSelectPrevSong = useCallback(() => {
    if (playList.length === 1) {
      playLoop();
      return;
    }

    let index = currentSongIndex - 1;
    if (index < 0) index = playList.length - 1;

    onSelectItemSong && onSelectItemSong(playList[index], index);
  }, [currentSongIndex, playList, onSelectItemSong, playLoop]);

  const handleSelectNextSong = useCallback(() => {
    if (playList.length === 1) {
      playLoop();
      return;
    }

    let index = currentSongIndex + 1;
    if (index > playList.length - 1) index = 0;

    onSelectItemSong && onSelectItemSong(playList[index], index);
  }, [currentSongIndex, playList, onSelectItemSong, playLoop]);

  const handleSelectSpeed = useCallback(
    (p: number) => {
      onSelectSpeed && onSelectSpeed(p);
      if (!audioRef.current) return;
      audioRef.current.playbackRate = p;
    },
    [onSelectSpeed],
  );

  const handleCleanList = useCallback(() => {
    onPlayButtonClick && onPlayButtonClick(false);
    onToggleFullScreen && onToggleFullScreen(false);
    onCleanList && onCleanList();
    setShowList(false);
  }, [onCleanList, onPlayButtonClick, onToggleFullScreen]);

  useEffect(() => {
    if (!playList.length) return;
    if (!currentSong || !audioRef.current) return;

    audioRef.current.src = getSongUrl(currentSong.id);
    audioRef.current.autoplay = true;
    audioRef.current.playbackRate = speedRef.current;
    onPlayButtonClick && onPlayButtonClick(true);

    setCurrentTime(0);
    setDuration((currentSong.dt / 1000) | 0);
    // eslint-disable-next-line
  }, [currentSong, playList]);

  useEffect(() => {
    if (!audioRef.current) return;
    playing ? audioRef.current.play() : audioRef.current.pause();
  }, [playing]);

  return (
    <StyledPlayer>
      {currentSong && (
        <MiniPlayer
          show={!fullScreen}
          playing={playing}
          song={currentSong}
          percent={percent}
          onContainerClick={handleMiniPlayerContainerClick}
          onPlayButtonClick={onPlayButtonClick}
          onShowListButtonClick={handleShowList}
        />
      )}
      {currentSong && (
        <NormalPlayer
          mode={mode}
          show={fullScreen}
          playing={playing}
          song={currentSong}
          percent={percent}
          duration={duration}
          currentTime={currentTime}
          speed={speed}
          onChangeMode={onChangePlayMode}
          onPrevButtonClick={handleSelectPrevSong}
          onNextButtonClick={handleSelectNextSong}
          onPlayButtonClick={onPlayButtonClick}
          onShowListButtonClick={handleShowList}
          onBackButtonClick={handleNormalPlayerBackButtonClick}
          onPercentProgressBarChange={handleChangeProgress}
          onSelectSpeed={handleSelectSpeed}
        />
      )}
      <PlayList
        show={showList}
        mode={mode}
        song={currentSong}
        list={playList}
        onHideList={handleHideList}
        onChangePlayMode={onChangePlayMode}
        onDeleteItemSong={onDeleteItemSong}
        onSelectItemSong={onSelectItemSong}
        onCleanList={handleCleanList}
      />
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioUpdateTime}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
      />
    </StyledPlayer>
  );
}

export default React.memo(Player);
