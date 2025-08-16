import { useState, useRef, useEffect, useCallback } from 'react'

interface GestureState {
  isGestureActive: boolean
  gestureType: 'pinch' | 'rotate' | 'swipe' | 'tap' | 'longPress' | null
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  scale: number
  rotation: number
  velocity: { x: number; y: number }
}

interface GestureCallbacks {
  onPinch?: (scale: number, center: { x: number; y: number }) => void
  onRotate?: (rotation: number, center: { x: number; y: number }) => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void
  onTap?: (position: { x: number; y: number }) => void
  onLongPress?: (position: { x: number; y: number }) => void
  onDrag?: (startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => void
}

export function useGestureRecognition(callbacks: GestureCallbacks) {
  const [gestureState, setGestureState] = useState<GestureState>({
    isGestureActive: false,
    gestureType: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    velocity: { x: 0, y: 0 }
  })

  const touchStartTime = useRef<number>(0)
  const touchStartPositions = useRef<Touch[]>([])
  const lastTouchPositions = useRef<Touch[]>([])
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)
  const velocityTracker = useRef<{ x: number[]; y: number[]; timestamps: number[] }>({
    x: [],
    y: [],
    timestamps: []
  })

  const calculateDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const calculateAngle = useCallback((touch1: Touch, touch2: Touch) => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX)
  }, [])

  const calculateCenter = useCallback((touches: ArrayLike<Touch>) => {
    const list = Array.from(touches)
    const centerX = list.reduce((sum, touch) => sum + touch.clientX, 0) / list.length
    const centerY = list.reduce((sum, touch) => sum + touch.clientY, 0) / list.length
    return { x: centerX, y: centerY }
  }, [])

  const updateVelocity = useCallback((x: number, y: number) => {
    const now = Date.now()
    velocityTracker.current.x.push(x)
    velocityTracker.current.y.push(y)
    velocityTracker.current.timestamps.push(now)

    // Keep only last 5 velocity points
    if (velocityTracker.current.x.length > 5) {
      velocityTracker.current.x.shift()
      velocityTracker.current.y.shift()
      velocityTracker.current.timestamps.shift()
    }

    // Calculate velocity from last 2 points
    if (velocityTracker.current.x.length >= 2) {
      const dt = velocityTracker.current.timestamps[velocityTracker.current.timestamps.length - 1] - 
                 velocityTracker.current.timestamps[velocityTracker.current.timestamps.length - 2]
      const dx = velocityTracker.current.x[velocityTracker.current.x.length - 1] - 
                 velocityTracker.current.x[velocityTracker.current.x.length - 2]
      const dy = velocityTracker.current.y[velocityTracker.current.y.length - 1] - 
                 velocityTracker.current.y[velocityTracker.current.y.length - 2]

      setGestureState(prev => ({
        ...prev,
        velocity: {
          x: dt > 0 ? dx / dt : 0,
          y: dt > 0 ? dy / dt : 0
        }
      }))
    }
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault()
    
    touchStartTime.current = Date.now()
    touchStartPositions.current = Array.from(e.touches)
    lastTouchPositions.current = Array.from(e.touches)
    
    const center = calculateCenter(e.touches)
    
    setGestureState(prev => ({
      ...prev,
      isGestureActive: true,
      startPosition: center,
      currentPosition: center,
      scale: 1,
      rotation: 0
    }))

    // Start long press timer
    if (e.touches.length === 1) {
      longPressTimeout.current = setTimeout(() => {
        callbacks.onLongPress?.(center)
      }, 500)
    }

    // Initialize velocity tracking
    velocityTracker.current = { x: [], y: [], timestamps: [] }
    updateVelocity(center.x, center.y)
  }, [calculateCenter, updateVelocity, callbacks])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    
    const currentTouches = Array.from(e.touches)
    const center = calculateCenter(currentTouches)
    
    // Clear long press timer
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }

    // Update velocity
    updateVelocity(center.x, center.y)

    if (currentTouches.length === 1) {
      // Single touch - drag or swipe
      const touch = currentTouches[0]
      const startTouch = touchStartPositions.current[0]
      
      if (startTouch) {
        const dx = touch.clientX - startTouch.clientX
        const dy = touch.clientY - startTouch.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 10) { // Minimum distance for drag
          callbacks.onDrag?.(
            { x: startTouch.clientX, y: startTouch.clientY },
            { x: touch.clientX, y: touch.clientY }
          )
        }
      }
    } else if (currentTouches.length === 2) {
      // Two touches - pinch or rotate
      const currentDistance = calculateDistance(currentTouches[0], currentTouches[1])
      const startDistance = calculateDistance(
        touchStartPositions.current[0], 
        touchStartPositions.current[1]
      )
      
      const currentAngle = calculateAngle(currentTouches[0], currentTouches[1])
      const startAngle = calculateAngle(
        touchStartPositions.current[0], 
        touchStartPositions.current[1]
      )
      
      const scale = currentDistance / startDistance
      const rotation = (currentAngle - startAngle) * (180 / Math.PI)
      
      setGestureState(prev => ({
        ...prev,
        currentPosition: center,
        scale,
        rotation
      }))
      
      callbacks.onPinch?.(scale, center)
      callbacks.onRotate?.(rotation, center)
    }

    lastTouchPositions.current = currentTouches
  }, [calculateCenter, calculateDistance, calculateAngle, updateVelocity, callbacks])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault()
    
    const touchDuration = Date.now() - touchStartTime.current
    const center = calculateCenter(lastTouchPositions.current)
    
    // Clear long press timer
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }

    if (e.touches.length === 0) {
      // All touches ended
      if (lastTouchPositions.current.length === 1 && touchDuration < 300) {
        // Single tap
        callbacks.onTap?.(center)
      } else if (lastTouchPositions.current.length === 1 && touchDuration > 300) {
        // Swipe detection
        const startPos = touchStartPositions.current[0]
        const endPos = lastTouchPositions.current[0]
        const dx = endPos.clientX - startPos.clientX
        const dy = endPos.clientY - startPos.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const velocity = distance / (touchDuration / 1000)
        
        if (distance > 50 && velocity > 0.3) {
          let direction: 'left' | 'right' | 'up' | 'down'
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left'
          } else {
            direction = dy > 0 ? 'down' : 'up'
          }
          callbacks.onSwipe?.(direction, velocity)
        }
      }
      
      setGestureState(prev => ({
        ...prev,
        isGestureActive: false,
        gestureType: null
      }))
    }
  }, [calculateCenter, callbacks])

  useEffect(() => {
    const element = document.getElementById('design-canvas') || document.body
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return gestureState
}
