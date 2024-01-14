'use client'
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react'
import { Howl } from 'howler'
import { PauseButton, PlayButton, StopButton } from './ControlButtons'
import { formatTime } from './utils/playerUtils'

const MultiPlayer = ({
  assets,
  selectedPlayerState
}: {
  assets: Map<string, string>
  selectedPlayerState?: [number, Dispatch<SetStateAction<number>>]
}): JSX.Element => {
  const playersRef = useRef<Howl[]>(
    Array.from(assets.entries()).map(
      ([name, assetPath]) =>
        new Howl({
          src: [assetPath],
          volume: 0.0,
          loop: true,
          preload: true,
          onend: () => {
            setStatus('stopped')
          }
        })
    )
  )

  const getPlayerLength = (player: Howl): number => player.duration() ?? 0

  // This won't cause changing hooks on re-render because it's specific for each component
  const [selectedPlayer, setSelectedPlayer] =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    selectedPlayerState ?? useState<number>(0)

  useEffect(() => {
    playersRef.current.forEach((player, idx) => {
      if (idx === selectedPlayer) {
        player.volume(0.1)
      } else {
        player.volume(0.0)
      }
    })
  }, [selectedPlayer])

  const [progress, setProgress] = useState(0)
  const length = Math.round(
    Math.min(...playersRef.current.map(getPlayerLength))
  )
  const [status, setStatus] = useState<'stopped' | 'playing' | 'paused'>(
    'stopped'
  )
  const progressUpdater: React.MutableRefObject<NodeJS.Timeout | null> =
    useRef(null)

  const startUpdating = (): void => {
    if (progressUpdater.current == null) {
      progressUpdater.current = setInterval(() => {
        setProgress(Math.round(playersRef.current[0].seek() ?? 0))
      }, 100)
    }
  }
  const stopUpdating = (): void => {
    if (progressUpdater.current != null) {
      clearInterval(progressUpdater.current)
      progressUpdater.current = null
    }
  }

  const seekAllPlayers = (time: number): void => {
    playersRef.current.forEach((player) => player.seek(time))
  }

  useEffect(() => {
    const allPlayers = playersRef.current
    switch (status) {
      case 'playing':
        allPlayers.forEach((player) => player.play())
        startUpdating()
        break
      case 'paused':
        allPlayers.forEach((player) => player.pause())
        stopUpdating()
        break
      case 'stopped':
        allPlayers.forEach((player) => player.stop())
        stopUpdating()
        setProgress(Math.round(allPlayers[0].seek() ?? 0))
        break
    }

    return () => {
      allPlayers.forEach((player) => player.stop())
      stopUpdating()
    }
  }, [playersRef, status])

  return (
    <div className="flex flex-col items-center min-w-[16rem]">
      <input
        type="range"
        min="0"
        max={length}
        value={progress}
        onChange={(e) => {
          seekAllPlayers(parseInt(e.target.value))
          setProgress(parseInt(e.target.value))
        }}
        className="w-full appearance-none bg-blue-100 rounded-full"
      />
      <div className="w-full flex justify-end text-sm font-light">
        {formatTime(progress)}/{formatTime(length)}
      </div>
      <div className="flex gap-sm justify-center">
        <PlayButton
          onClick={() => {
            setStatus('playing')
          }}
        />
        <PauseButton
          onClick={() => {
            setStatus('paused')
          }}
        />
        <StopButton
          onClick={() => {
            setStatus('stopped')
          }}
        />
      </div>
      <div className="flex mt-sm gap-sm w-full">
        {Array.from(assets.keys()).map((name, index) => (
          <button
            key={`asset-selector-${index}`}
            onClick={() => {
              setSelectedPlayer(index)
            }}
            className={`w-full rounded-md text-white font-semibold px-xs
            ${selectedPlayer === index ? 'bg-blue-500' : 'bg-blue-300'}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MultiPlayer
