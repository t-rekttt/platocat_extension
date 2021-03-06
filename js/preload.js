let service = analytics.getService('platocat_extension');

let tracker = service.getTracker('UA-144199659-2');

tracker.sendEvent('pageview');

let getRandomImage = async(lastIds) => {
  return new Promise(resolve => {
    chrome.storage.local.get(null, chromeStorageData => {
      let images = Object.values(chromeStorageData);

      images = images.filter(image => typeof image == 'object' && image && image._id);

      resolve(
        _.sample(
          _.differenceWith(images, lastIds, (image, id) => {
            return image._id == id;
          })
        )
      );
    });
  });
}

let getLastIds = () => {
  let lastIds = [];

  if (localStorage.hasOwnProperty('lastIds') && localStorage.getItem('lastIds') !== 'undefined') {
    lastIds = localStorage.getItem('lastIds').split(',');
  }

  return lastIds;
}

let pushLastId = (id) => {
  let lastIds = getLastIds();

  if (lastIds.length >= 3) {
    lastIds.shift();
  }

  lastIds.push(id);

  localStorage.setItem('lastIds', lastIds.join(','));
}

let chooseRandomImage = async() => {
  let lastIds = getLastIds();

  let json = null;

  if (localStorage.hasOwnProperty('nextImage') && localStorage.getItem('nextImage') !== 'undefined') {
    json = JSON.parse(localStorage.getItem('nextImage'));
    localStorage.removeItem('nextImage');
  } else {
    json = await getRandomImage(lastIds);
  }

  console.log(json);

  pushLastId(json._id);

  return json;
}

let getFeedPostsCount = async() => {
  return fetch(`${chrome.runtime.getManifest().homepage_url}/api/post/count`)
    .then(res => res.json())
    .then(json => json.data);
}

let resetNotificationCount = () => {
  chrome.storage.local.set({ notificationCount: 0 });
  document.querySelector('#notificationDiv').hidden = true;
}

let img = document.querySelector('#catImageImg');
let hiddenImg = document.querySelector('#hiddenImage');
let main = document.querySelector('#main');
let caption = document.querySelector('#caption');
document.querySelector('#moreCatsAnchor').href = chrome.runtime.getManifest().homepage_url;
console.log(analytics);

chooseRandomImage().then(async json => {
  caption.innerText = _.sample(json.captions);

  let { r, g, b, a } = json.backgroundColor;

  img.src = json.media;

  img.onload = async () => {
    let nextImage = await chooseRandomImage();

    localStorage.setItem('nextImage', JSON.stringify(nextImage));
    
    hiddenImg.src = nextImage.media;
  }

  main.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
});

chrome.topSites.get(data => {
  sites = Array.from(new Set(data.map(site => new URL(site.url).origin)));
  sites = _.take(sites, 8);

  let elems  = '';

  sites.map(site => {
    elems += `
      <div class="col" v-for="site in topSites">
        <a href="${site}" target="_blank">
          <img src="chrome://favicon/size/35/${site}">
        </a>
      </div>
    `;
  });

  $('#mostVisitedRow').append($(elems));
});

chrome.storage.local.get(['lastPostsCount', 'notificationCount'], async data => {
  try {
    if (data.notificationCount && typeof data.notificationCount == 'number') {
      let notificationElem = document.querySelector('#notificationDiv');

      notificationElem.innerText = data.notificationCount;
      notificationElem.hidden = false;
    }

    let count = (await getFeedPostsCount()).count;

    if (typeof count != 'number') return;

    if (!data.notificationCount) data.notificationCount = 0;

    if (data.lastPostsCount) data.notificationCount += count - data.lastPostsCount;

    if (data.notificationCount && typeof data.notificationCount == 'number') {
      let notificationElem = document.querySelector('#notificationDiv');

      notificationElem.innerText = data.notificationCount;
      notificationElem.hidden = false;
    }

    data.lastPostsCount = count;

    chrome.storage.local.set(data, () => {
      console.log(data);
    });
  } catch (err) {
    console.log(err);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('moreCatsAnchor').addEventListener("click", resetNotificationCount);
});