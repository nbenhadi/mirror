import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useStdout } from 'ink'

interface Size {
  width: number
  height: number
}

function readSize(stdout: NodeJS.WriteStream): Size {
  return {
    width: (stdout.columns as number | undefined) ?? 80,
    height: (stdout.rows as number | undefined) ?? 24,
  }
}

const TerminalSizeContext = createContext<Size>({ width: 80, height: 24 })

export function TerminalSizeProvider({ children }: { children: ReactNode }) {
  const { stdout } = useStdout()
  const [size, setSize] = useState(() => readSize(stdout))

  useEffect(() => {
    function onResize() {
      stdout.write('\x1b[2J\x1b[3J\x1b[H')
      setSize(readSize(stdout))
    }
    stdout.on('resize', onResize)
    return () => {
      stdout.off('resize', onResize)
    }
  }, [stdout])

  return <TerminalSizeContext.Provider value={size}>{children}</TerminalSizeContext.Provider>
}

export function useTerminalSize(): Size {
  return useContext(TerminalSizeContext)
}
