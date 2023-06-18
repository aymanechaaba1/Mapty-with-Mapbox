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
  coords: [],
  currentCoords: [],
};

// DOM
const formEl = document.querySelector('.form');
const workoutsContainerEl = document.querySelector('.workouts');

// Config
const MAPBOX_STYLE = 'streets-v12' || 'dark-v11';
mapboxgl.accessToken =
  'pk.eyJ1IjoiYXltYW5lY2hhYWJhMSIsImEiOiJjbGdpMHNrNm4wcjZoM2h0MWozeGcyanZwIn0.cUx85D1sHiOEwkltH8p0UQ';

// Helpers
const render = (markup, parent, pos = 'afterbegin') => {
  parent.insertAdjacentHTML(pos, markup);
};

const clear = (parent) => {
  parent.innerHTML = '';
};

const toggleFields = (className, ...elements) => {
  elements.forEach((el) => {
    el.classList.toggle(className);
  });
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

  const pace = duration / distance;
  const speed = distance / duration / 60;

  return `
    <div
      class="workout border-l border-${
        type === 'running' ? 'green' : 'orange'
      }-600 rounded-md py-3 px-5 space-y-2 bg-gray-800 cursor-pointer"
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
        ${
          type === 'running'
            ? `
          <div>
            <span class="mr-1">⚡️</span>
            <span class="uppercase text-xs">${pace.toFixed(2)}</span>
          </div>
          <div>
            <span class="mr-1">👣</span>
            <span class="uppercase text-xs">${cadence} spm</span>
          </div>
        `
            : ''
        }
        ${
          type === 'cycling'
            ? `
              <div>
                <span class="mr-1">⚡️</span>
                <span class="uppercase text-xs">${speed.toFixed(2)}</span>
              </div>
              <div>
                <span class="mr-1">🌀</span>
                <span class="uppercase text-xs">${elevationGain}</span>
              </div>
              `
            : ''
        }
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

// Init

// Get current location
if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;

    const map = new mapboxgl.Map({
      container: 'map', // container ID
      style: `mapbox://styles/mapbox/${MAPBOX_STYLE}`, // style URL
      center: [lng, lat], // starting position [lng, lat]
      zoom: 9, // starting zoom
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      state.coords = [lng, lat];
      formEl.classList.remove('hidden');
      formEl.classList.add('grid');
    });

    formEl.addEventListener('submit', (e) => {
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

      if (type === 'running') {
        const pace = (duration / distance).toFixed(2);
        workout = { ...workout, cadence: +cadence, pace: +pace };
      }

      if (type === 'cycling') {
        const speed = (distance / (duration / 60)).toFixed(2);
        workout = {
          ...workout,
          elevationGain: +elevationGain,
          speed: +speed,
        };
      }

      // Check if id already exists in state
      const workoutExist = state.workouts.some(({ id }) => id === workout.id);
      if (workoutExist) return; // LATER: show an error msg

      state.workouts.push(workout);

      console.log(workout);

      const WorkoutEl = Workout({
        id: workout.id,
        type: workout.type,
        duration: workout.duration,
        distance: workout.distance,
        timestamp: Date.now(),
        cadence: workout.cadence,
        elevationGain: workout.elevationGain,
      });

      render(WorkoutEl, workoutsContainerEl);

      // Reset form
      e.target.reset();

      // Create new marker
      const typeFormatted = `${workout.type[0].toUpperCase()}${workout.type.slice(
        1
      )}`;
      const date = new Intl.DateTimeFormat(navigator.location, {
        month: 'long',
        day: '2-digit',
      }).format(workout.timestamp);

      const marker = new mapboxgl.Marker({
        color: `${workout.type === 'running' ? '#166534' : '#9a3412'}`,
      })
        .setLngLat(workout.coords)
        .setPopup(
          new mapboxgl.Popup({
            maxWidth: 'none',
            closeButton: false,
            closeOnClick: true,
            // className: `border-l border-${
            //   workout.type === 'running' ? 'green' : 'orange'
            // }-800 rounded-sm text-sm`,
          }).setHTML(
            `<h1>
              <span>${workout.type === 'running' ? '🏃‍♂️' : '🚵‍♀️'}</span>
              <span class="font-bold text-${
                workout.type === 'running' ? 'green' : 'orange'
              }-800">${typeFormatted}</span>
              <span>on ${date}</span>
            </h1>`
          )
        )
        .addTo(map);

      // Hide form
      formEl.classList.add('hidden');
      formEl.classList.remove('grid');
    });
  });
