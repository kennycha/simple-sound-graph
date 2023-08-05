const SOUND_FILE_URL = "assets/sounds/sample_track.mp3";
const VISUALIZER_BLOCK_COUNT = 70;

let isInitiated = false;
let isPlaying = false;

const getAudioBuffer = async (context: BaseAudioContext, url: string) => {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const audioBuffer = await context.decodeAudioData(arrayBuffer);

  return audioBuffer;
};

const filterChannelData = (channelData: Float32Array) => {
  const blockSize = Math.floor(channelData.length / VISUALIZER_BLOCK_COUNT);
  const filtered: number[] = [];
  for (let i = 0; i < VISUALIZER_BLOCK_COUNT; i += 1) {
    const startIndex = blockSize * i;
    const averageValue =
      channelData.slice(startIndex, startIndex + blockSize).reduce((arr, curr) => arr + Math.abs(curr), 0) / blockSize;
    filtered.push(averageValue);
  }

  return filtered;
};

const drawVisualizer = (audioBuffer: AudioBuffer) => {
  const filtered = filterChannelData(audioBuffer.getChannelData(0));
  const multiplier = 1 / Math.max(...filtered);
  const filteredAndNormalized = filtered.map((v) => v * multiplier);
  console.log(filteredAndNormalized);
};

const onWindowLoad = async () => {
  const audioContext = new AudioContext();
  const loadButton = document.querySelector("#loadButton") as HTMLButtonElement;
  loadButton.disabled = false;

  const playButton = document.querySelector("#playButton") as HTMLButtonElement;

  const audioBuffer = await getAudioBuffer(audioContext, SOUND_FILE_URL);
  drawVisualizer(audioBuffer);

  const sourceNode = new AudioBufferSourceNode(audioContext, { buffer: audioBuffer, loop: true });
  const sourceGainNode = new GainNode(audioContext);
  sourceNode.connect(sourceGainNode);
  sourceGainNode.connect(audioContext.destination);

  const onLoadButtonClick = () => {
    playButton.disabled = false;
    audioContext.resume();
    loadButton.disabled = true;
  };

  const onPlayButtonClick = () => {
    if (isPlaying) {
      audioContext.suspend();
      playButton.innerText = "play";
      isPlaying = false;
    } else {
      if (isInitiated) {
        audioContext.resume();
      } else {
        sourceNode.start(audioContext.currentTime);
        isInitiated = true;
      }
      playButton.innerText = "pause";
      isPlaying = true;
    }
  };

  loadButton.addEventListener("click", onLoadButtonClick);
  playButton.addEventListener("click", onPlayButtonClick);
};

window.addEventListener("load", onWindowLoad);
