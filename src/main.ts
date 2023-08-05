import * as d3 from "d3";

const BASE_URL = "/simple-sound-graph/assets/sounds/";

const SOUND_FILE_URLS = [
  "01_bad_boy.mp3",
  "02_corruption.mp3",
  "03_easy_boost.mp3",
  "04_core.mp3",
  "05_cut_off.mp3",
  "06_overload.mp3",
  "07_jumping_out.mp3",
  "08_fill_in.mp3",
  "09_night_away.mp3",
  "10_happy_hype.mp3",
];

const VISUALIZER_BLOCK_COUNT = 140;

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

// @TODO 재생시간 이전에는 흰색 이후에는 주황색으로 바뀌도록 구현
// @TODO SVG 스타일 클래스로 주고 css 파일에서 수정하도록 변경
const drawVisualizer = (audioBuffer: AudioBuffer) => {
  const filtered = filterChannelData(audioBuffer.getChannelData(0));
  const multiplier = 1 / Math.max(...filtered);
  const filteredAndNormalized = filtered.map((v) => v * multiplier);

  const svgWidth = 720;
  const svgHeight = 100;
  const barSpacing = 1;
  const totalBarWidth = svgWidth / VISUALIZER_BLOCK_COUNT;
  const barWidth = totalBarWidth - barSpacing;

  const track = d3
    .select("#tracks")
    .append("li")
    .attr("width", svgWidth)
    .attr("height", (svgHeight * 3) / 2)
    .attr("class", "track");

  const svg = track
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .style("background-color", "rgb(51, 51, 51)");

  const barChart = svg
    .selectAll("rect")
    .data(filteredAndNormalized)
    .enter()
    .append("rect")
    .attr("y", (d) => (1 - d * 0.9) * svgHeight)
    .attr("height", (d) => d * 0.9 * svgHeight)
    .attr("width", barWidth)
    .style("fill", "rgb(255, 84, 0)")
    .attr("transform", (d, i) => {
      const translate = [totalBarWidth * i, 0];
      return `translate(${translate})`;
    });

  const reverseSvg = track
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight / 2)
    .style("background-color", "rgb(51, 51, 51)");

  const reverseChart = reverseSvg
    .selectAll("rect")
    .data(filteredAndNormalized)
    .enter()
    .append("rect")
    .attr("y", (_) => 0)
    .attr("height", (d) => (d * 0.9 * svgHeight) / 2)
    .attr("width", barWidth)
    .style("fill", "rgb(254, 191, 153)")
    .attr("transform", (_, i) => {
      const translate = [totalBarWidth * i, 0];
      return `translate(${translate})`;
    });
};

const onWindowLoad = async () => {
  const audioContext = new AudioContext();
  const loadButton = document.querySelector("#loadButton") as HTMLButtonElement;
  loadButton.disabled = false;

  const playButton = document.querySelector("#playButton") as HTMLButtonElement;

  const audioBuffers: AudioBuffer[] = [];
  for (const url of SOUND_FILE_URLS) {
    const audioBuffer = await getAudioBuffer(audioContext, `${BASE_URL}${url}`);
    drawVisualizer(audioBuffer);
    audioBuffers.push(audioBuffer);
  }

  // @TODO 선택한 트랙을 재생 + 이미지를 그리도록 변경
  const sourceNode = new AudioBufferSourceNode(audioContext, { buffer: audioBuffers[0], loop: true });
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
