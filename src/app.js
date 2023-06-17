'use strict';

// State
const state = {
  workouts: [
    {
      id: 23,
      type: 'running',
      duration: 2,
      distance: 2,
      cadence: 2,
      timestamp: Date.now(),
    },
  ],
  coords: {},
};

// DOM
const formEl = document.querySelector('.form');
const workoutsContainerEl = document.querySelector('.workouts');

// Config
const MAPBOX_STYLE = 'outdoors-v11';
mapboxgl.accessToken =
  'pk.eyJ1IjoiYXltYW5lY2hhYWJhMSIsImEiOiJjbGdpMHNrNm4wcjZoM2h0MWozeGcyanZwIn0.cUx85D1sHiOEwkltH8p0UQ';

// Helpers
const render = (markup, parent, pos = 'afterbegin') => {
  parent.insertAdjacentHTML(pos, markup);
};

const clear = (parent) => {
  parent.innerHTML = '';
};

const getJSON = async (url, errMsg = 'Something went wrong.') => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${errMsg} (${res.status})`);
    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

const postJSON = async (data, url, errMsg = 'Something went wrong.') => {
  try {
    const dataCopy = window.structuredClone(data);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataCopy),
    });
    if (!res.ok) throw new Error(`${errMsg} (${res.status})`);
    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

// Components
const Workout = ({
  id,
  type,
  duration,
  distance,
  cadence,
  elevationGain,
  timestamp,
}) => {
  const currentDate = new Intl.DateTimeFormat(navigator.location, {
    month: 'long',
    day: '2-digit',
  }).format(new Date(timestamp));

  const formattedType = `${type[0].toUpperCase()}${type.slice(1)}`;

  return `
    <div
      class="workout border-l border-${
        type === 'running' ? 'green' : 'orange'
      }-600 rounded-md py-3 px-5 space-y-2 bg-gray-800"
      data-id="${id}"
      >
      <div class="text-white">${formattedType} on ${currentDate}</div>
      <div class="flex items-center gap-3 text-white">
        <div class="">
          <span class="mr-1">${type === 'running' ? '🏃' : '🚵‍♀️'}</span>
          <span class="uppercase text-xs">${distance} km</span>
        </div>
        <div>
          <span class="mr-1">⏱</span>
          <span class="uppercase text-xs">${duration} min</span>
        </div>
        <div>
          <span class="mr-1">${type === 'running' ? '👣' : ''}</span>
          <span class="uppercase text-xs">${cadence} spm</span>
        </div>
      </div>
    </div>
  `;
};

const Workouts = state.workouts
  .map((workout) =>
    Workout({
      id: workout.id,
      type: workout.type,
      duration: workout.duration,
      distance: workout.distance,
      cadence: workout.cadence,
      timestamp: workout.timestamp,
    })
  )
  .join('');

// Handlers
const showForm = (e) => {
  formEl.classList.toggle('hidden');
  formEl.classList.toggle('grid');

  // add coords to state
  state.coords = { ...e.lngLat };
};

const addWorkout = (e) => {
  e.preventDefault();

  const dataArr = [...new FormData(e.target)];
  const data = Object.fromEntries(dataArr);

  const {
    type,
    distance,
    duration,
    cadence,
    elevation_gain: elevationGain,
  } = data;

  let workout = {
    id: Math.floor(Math.random() * 100) + 1,
    type,
    distance: +distance,
    duration: +duration,
    coords: state.coords,
    timestamp: Date.now(),
  };

  if (type === 'running') workout = { ...workout, cadence: +cadence };

  if (type === 'cycling')
    workout = { ...workout, elevationGain: +elevationGain };

  state.workouts.push(workout);

  console.log(workout);

  const WorkoutEl = Workout({
    id: workout.id,
    type: workout.type,
    duration: workout.duration,
    distance: workout.distance,
    cadence: workout.cadence,
    timestamp: Date.now(),
    ...(elevationGain && { elevationGain }), // Optional
  });

  render(WorkoutEl, workoutsContainerEl);
};

// Init
// Get current location
const mapToCurrentPosition = (pos) => {
  const { latitude: lat, longitude: lng } = pos.coords;

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: `mapbox://styles/mapbox/${MAPBOX_STYLE}`, // style URL
    center: [lng, lat], // starting position [lng, lat]
    zoom: 9, // starting zoom
  });

  map.on('click', showForm);
};

if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(mapToCurrentPosition);

formEl.addEventListener('submit', addWorkout);
