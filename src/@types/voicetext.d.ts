declare module 'voicetext' {
  export default class VoiceText {
    EMOTION: {
      NONE: undefined
      HAPPINESS: 'happiness'
      ANGER: 'anger'
      SADNESS: 'sadness'
    }

    EMOTION_LEVEL: {
      NONE: undefined
      EXTREME: '4'
      SUPER: '3'
      HIGH: '2'
      NORMAL: '1'
    }

    SPEAKER: {
      SHOW: 'show'
      HARUKA: 'haruka'
      HIKARI: 'hikari'
      TAKERU: 'takeru'
      SANTA: 'santa'
      BEAR: 'bear'
    }

    FORMAT: {
      OGG: 'ogg'
      WAV: 'wav'
      AAC: 'aac'
    }

    constructor(apiKey: string)
    public speaker(speaker: string): VoiceText
    public emotion(emotion: string): VoiceText
    public emotion_level(emotion_level: string): VoiceText
    public pitch(pitch: number): VoiceText
    public speed(speed: number): VoiceText
    public volume(volume: number): VoiceText
    public format(format: string): VoiceText
    public build_params(text: string): VoiceText
    public speak(text: string, callback: any): VoiceText
  }

  export const enum EMOTION_LEVEL {
    NONE = 'none',
    EXTREME = '4',
    SUPER = '3',
    HIGH = '2',
    NORMAL = '1',
  }
}
