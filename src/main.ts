import axios from 'axios'
import crypto from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import Speaker from 'speaker'

const speakeds: string[] = []
let speakingSpeaker: Speaker | null = null

export interface Result {
  status: string
  message: string
  is_auth: boolean
}

export interface Security {
  realm: string
  hash: string
}

export interface EEW {
  result: Result
  report_time: string
  region_code: string
  request_time: string
  region_name: string
  longitude: string
  is_cancel: boolean
  depth: string
  calcintensity: string
  is_final: boolean
  is_training: boolean
  latitude: string
  origin_time: string
  security: Security
  magunitude: string
  report_num: string
  request_hypo_type: string
  report_id: string
  alertflg: string
}

async function getAudioFile(message: string): Promise<string> {
  if (!fs.existsSync('audio/')) {
    fs.mkdirSync('audio/')
  }
  const path =
    'audio/' + crypto.createHash('md5').update(message).digest('hex') + '.wav'
  if (fs.existsSync(path)) {
    return path
  }

  const request = new URLSearchParams()
  request.append('text', message)
  request.append('speaker', 'haruka')
  request.append('pitch', '110')
  request.append('speed', '110')
  request.append('volume', '50')
  const ttsResponse = await axios.post(
    'https://api.voicetext.jp/v1/tts',
    Buffer.from(request.toString()),
    {
      auth: {
        username: '97rs88consqjrr1e',
        password: '',
      },
      responseType: 'stream',
      timeout: 10000,
    }
  )
  if (ttsResponse.status !== 200) {
    throw new Error('Failed to get audio file')
  }
  ttsResponse.data.pipe(fs.createWriteStream(path))

  return path
}

async function getConcatAudioFiles(
  messages: string[],
  files: string[]
): Promise<string> {
  const base = ffmpeg(files[0])
  for (let i = 1; i < files.length; i++) {
    base.input(files[i])
  }
  const path =
    'audio/' +
    crypto.createHash('md5').update(messages.join('-')).digest('hex') +
    '.wav'
  console.log('getConcatAudioFiles', path)
  await new Promise<void>((resolve, reject) => {
    base
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .mergeToFile(path)
      .output(path)
      .run()
  })
  return path
}

function formatDate(date: Date, format: string): string {
  format = format.replace(/yyyy/g, String(date.getFullYear()))
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
  format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2))
  format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2))
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2))
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2))
  format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3))
  return format
}

/*
条件:
・震度が不明ではない場合、震度4以上
・震度が不明の場合、マグニチュード5以上
・報告は第一報と震度変化のみ
*/

async function main(): Promise<void> {
  const Axios = axios.create({
    validateStatus: () => true,
  })

  const date = new Date()
  const datetime = formatDate(date, 'yyyyMMddHHmmss')
  // const datetime = '20220318232612'
  const response = await Axios.get(
    `http://www.kmoni.bosai.go.jp/webservice/hypo/eew/${datetime}.json`
  )
  if (response.status !== 200) {
    console.error('Failed to get earthquake data')
    return
  }
  console.log(date, JSON.stringify(response.data))

  const data: EEW = response.data
  if (data.result.message.length > 0) {
    console.log(date, data.result.message)
    return
  }
  const calcintensity: string = data.calcintensity
  if (
    calcintensity !== '不明' &&
    parseInt(calcintensity.substring(0, 1), 10) < 4
  ) {
    // 不明以外で、震度4より小さい場合は除外
    return
  }
  const magunitude: string = data.magunitude
  if (calcintensity === '不明' && parseFloat(magunitude.substring(0, 1)) < 5) {
    // 不明で、マグニチュード5より小さい場合は除外
    return
  }

  // → 震度4以上 or 震度不明マグニチュード5以上

  const eqId = data.report_id + '-' + data.calcintensity
  if (speakeds.includes(eqId)) {
    console.log('Already spoken', eqId)
    return
  }
  speakeds.push(eqId)

  const messages = [
    '緊急地震速報。',
    data.region_name,
    'で',
    data.calcintensity,
    'の地震がはっせい。',
  ]
  const files = await Promise.all(messages.map(getAudioFile))
  const concatAudioFiles = await getConcatAudioFiles(messages, files)
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 44100,
  })
  if (speakingSpeaker) {
    speakingSpeaker.destroy()
    speakingSpeaker = null
  }
  speakingSpeaker = fs.createReadStream(concatAudioFiles).pipe(speaker)
}

;(async (): Promise<void> => {
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 44100,
  })
  fs.createReadStream(
    await getAudioFile('earthquake-voicetextを起動しました。')
  ).pipe(speaker)

  setInterval(async () => {
    try {
      await main()
    } catch (e) {
      console.error(e)
    }
  }, 1000)
})().catch((e) => console.error(e))
