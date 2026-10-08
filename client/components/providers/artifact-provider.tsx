"use client"

import React, { createContext, useContext, useState, useCallback, useMemo } from "react"
import { Artifact } from "@/types/artifact"

interface ArtifactContextType {
  isOpen: boolean
  isMaximized: boolean
  splitRatio: number
  activeArtifact: Artifact | null
  artifacts: Artifact[]
  openArtifact: (artifact: Artifact) => void
  closeCanvas: () => void
  toggleCanvas: () => void
  toggleMaximize: () => void
  setSplitRatio: (ratio: number) => void
  setActiveArtifact: (artifact: Artifact | null) => void
  registerArtifacts: (newArtifacts: Artifact[]) => void
  clearArtifacts: () => void
  currentIndex: number
  selectNextArtifact: () => void
  selectPrevArtifact: () => void
}

const ArtifactContext = createContext<ArtifactContextType | undefined>(undefined)

export function ArtifactProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isMaximized, setIsMaximized] = useState<boolean>(false)
  const [splitRatio, setSplitRatioState] = useState<number>(50) // percentage
  const [activeArtifact, setActiveArtifactState] = useState<Artifact | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])

  const setSplitRatio = useCallback((ratio: number) => {
    // Keep ratio within 25% to 75%
    const clamped = Math.max(25, Math.min(75, ratio))
    setSplitRatioState(clamped)
  }, [])

  const registerArtifacts = useCallback((newArtifacts: Artifact[]) => {
    if (!newArtifacts || newArtifacts.length === 0) return

    setArtifacts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id))
      const toAdd = newArtifacts.filter((a) => !existingIds.has(a.id))
      if (toAdd.length === 0) return prev
      return [...prev, ...toAdd]
    })
  }, [])

  const openArtifact = useCallback((artifact: Artifact) => {
    setActiveArtifactState(artifact)
    setIsOpen(true)
    setArtifacts((prev) => {
      const exists = prev.some((a) => a.id === artifact.id)
      if (exists) return prev
      return [...prev, artifact]
    })
  }, [])

  const closeCanvas = useCallback(() => {
    setIsOpen(false)
    setIsMaximized(false)
  }, [])

  const toggleCanvas = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && !activeArtifact && artifacts.length > 0) {
        setActiveArtifactState(artifacts[artifacts.length - 1])
      }
      return !prev
    })
  }, [activeArtifact, artifacts])

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => !prev)
  }, [])

  const clearArtifacts = useCallback(() => {
    setArtifacts([])
    setActiveArtifactState(null)
    setIsOpen(false)
    setIsMaximized(false)
  }, [])

  const currentIndex = useMemo(() => {
    if (!activeArtifact) return -1
    return artifacts.findIndex((a) => a.id === activeArtifact.id)
  }, [activeArtifact, artifacts])

  const selectNextArtifact = useCallback(() => {
    if (artifacts.length === 0) return
    const nextIdx = (currentIndex + 1) % artifacts.length
    setActiveArtifactState(artifacts[nextIdx])
  }, [artifacts, currentIndex])

  const selectPrevArtifact = useCallback(() => {
    if (artifacts.length === 0) return
    const prevIdx = (currentIndex - 1 + artifacts.length) % artifacts.length
    setActiveArtifactState(artifacts[prevIdx])
  }, [artifacts, currentIndex])

  const value = useMemo(
    () => ({
      isOpen,
      isMaximized,
      splitRatio,
      activeArtifact,
      artifacts,
      openArtifact,
      closeCanvas,
      toggleCanvas,
      toggleMaximize,
      setSplitRatio,
      setActiveArtifact: setActiveArtifactState,
      registerArtifacts,
      clearArtifacts,
      currentIndex,
      selectNextArtifact,
      selectPrevArtifact,
    }),
    [
      isOpen,
      isMaximized,
      splitRatio,
      activeArtifact,
      artifacts,
      openArtifact,
      closeCanvas,
      toggleCanvas,
      toggleMaximize,
      setSplitRatio,
      registerArtifacts,
      clearArtifacts,
      currentIndex,
      selectNextArtifact,
      selectPrevArtifact,
    ]
  )

  return <ArtifactContext.Provider value={value}>{children}</ArtifactContext.Provider>
}

export function useArtifact() {
  const context = useContext(ArtifactContext)
  if (!context) {
    throw new Error("useArtifact must be used within an ArtifactProvider")
  }
  return context
}
