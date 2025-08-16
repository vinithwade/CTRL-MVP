import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceCommand {
  command: string
  action: (params?: any) => void
  description: string
}

interface VoiceRecognitionState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  confidence: number
  error: string | null
}

// Minimal ambient typings for SpeechRecognition to satisfy TS when DOM lib lacks it

export function useVoiceCommands(commands: VoiceCommand[]) {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0,
    error: null
  })

  // Use any for broad browser support without lib.dom SpeechRecognition types
  const recognitionRef = useRef<any>(null)
  const isInitialized = useRef(false)

  const initializeSpeechRecognition = useCallback(() => {
    if (isInitialized.current) return

    const SpeechRecognition: any | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Speech recognition not supported in this browser'
      }))
      return
    }

    recognitionRef.current = SpeechRecognition ? new SpeechRecognition() : null
    const recognition = recognitionRef.current

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null
      }))
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const confidence = event.results[i][0].confidence

        if (event.results[i].isFinal) {
          finalTranscript += transcript
          maxConfidence = Math.max(maxConfidence, confidence)
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript + interimTranscript

      setState(prev => ({
        ...prev,
        transcript: fullTranscript,
        confidence: maxConfidence
      }))

      // Process commands when we have final results
      if (finalTranscript) {
        processVoiceCommand(finalTranscript.toLowerCase())
      }
    }

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error'
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected'
          break
        case 'audio-capture':
          errorMessage = 'Audio capture failed'
          break
        case 'not-allowed':
          errorMessage = 'Microphone access denied'
          break
        case 'network':
          errorMessage = 'Network error'
          break
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed'
          break
        case 'bad-grammar':
          errorMessage = 'Bad grammar'
          break
        case 'language-not-supported':
          errorMessage = 'Language not supported'
          break
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        error: errorMessage
      }))
    }

    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false
      }))
    }

    setState(prev => ({
      ...prev,
      isSupported: true
    }))

    isInitialized.current = true
  }, [])

  const processVoiceCommand = useCallback((transcript: string) => {
    console.log('Processing voice command:', transcript)

    // Common voice command patterns
    const commandPatterns = [
      // Add component commands
      {
        pattern: /add\s+(button|input|text|image|form|list|table|chart|map|video|audio|container)\s+(?:here|at\s+this\s+position)/i,
        action: (match: RegExpMatchArray) => {
          const componentType = match[1].toLowerCase()
          commands.find(cmd => cmd.command.includes('add') && cmd.command.includes(componentType))?.action()
        }
      },
      // Move component commands
      {
        pattern: /move\s+(?:the\s+)?(button|input|text|image|form|list|table|chart|map|video|audio|container)\s+(up|down|left|right|forward|backward)/i,
        action: (match: RegExpMatchArray) => {
          const componentType = match[1].toLowerCase()
          const direction = match[2].toLowerCase()
          commands.find(cmd => cmd.command.includes('move') && cmd.command.includes(direction))?.action({ componentType, direction })
        }
      },
      // Resize component commands
      {
        pattern: /(resize|make\s+(?:it\s+)?(?:bigger|smaller|larger|wider|taller|narrower|shorter))\s+(?:the\s+)?(button|input|text|image|form|list|table|chart|map|video|audio|container)/i,
        action: (match: RegExpMatchArray) => {
          const resizeAction = match[1].toLowerCase()
          const componentType = match[2].toLowerCase()
          commands.find(cmd => cmd.command.includes('resize'))?.action({ componentType, resizeAction })
        }
      },
      // Delete component commands
      {
        pattern: /(delete|remove)\s+(?:the\s+)?(button|input|text|image|form|list|table|chart|map|video|audio|container)/i,
        action: (match: RegExpMatchArray) => {
          const componentType = match[1].toLowerCase()
          commands.find(cmd => cmd.command.includes('delete') || cmd.command.includes('remove'))?.action({ componentType })
        }
      },
      // Style commands
      {
        pattern: /(change\s+color|make\s+(?:it\s+)?(red|blue|green|yellow|purple|orange|pink|gray|black|white))\s+(?:the\s+)?(button|input|text|image|form|list|table|chart|map|video|audio|container)/i,
        action: (match: RegExpMatchArray) => {
          const color = match[2] || 'blue'
          const componentType = match[3].toLowerCase()
          commands.find(cmd => cmd.command.includes('color'))?.action({ componentType, color })
        }
      },
      // Layout commands
      {
        pattern: /(center|align\s+(left|right|center|top|bottom))\s+(?:the\s+)?(button|input|text|image|form|list|table|chart|map|video|audio|container)/i,
        action: (match: RegExpMatchArray) => {
          const alignment = match[1] === 'center' ? 'center' : match[2]
          const componentType = match[3].toLowerCase()
          commands.find(cmd => cmd.command.includes('align'))?.action({ componentType, alignment })
        }
      },
      // General commands
      {
        pattern: /(save|export|preview|undo|redo|clear|reset)/i,
        action: (match: RegExpMatchArray) => {
          const action = match[1].toLowerCase()
          commands.find(cmd => cmd.command.includes(action))?.action()
        }
      }
    ]

    // Try to match patterns
    for (const pattern of commandPatterns) {
      const match = transcript.match(pattern.pattern)
      if (match) {
        pattern.action(match)
        return
      }
    }

    // Fallback: try exact command matching
    for (const command of commands) {
      if (transcript.includes(command.command.toLowerCase())) {
        command.action()
        return
      }
    }

    console.log('No matching command found for:', transcript)
  }, [commands])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      initializeSpeechRecognition()
      return
    }

    try {
      recognitionRef.current.start()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start speech recognition'
      }))
    }
  }, [initializeSpeechRecognition])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: ''
    }))
  }, [])

  useEffect(() => {
    initializeSpeechRecognition()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [initializeSpeechRecognition])

  return {
    ...state,
    startListening,
    stopListening,
    clearTranscript
  }
}
