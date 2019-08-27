let getAllImages = () => {
  return fetch(`${chrome.runtime.getManifest().homepage_url}/api/extensionGif`)
    .then(res => res.json())
    .then(json => json.data);
}

let fetchAsBlob = url => fetch(url)
  .then(response => response.blob());

let convertBlobToBase64 = blob => new Promise((resolve, reject) => {
  const reader = new FileReader;
  reader.onerror = reject;

  reader.onload = () => {
    resolve(reader.result);
  };

  reader.readAsDataURL(blob);
});

(async() => {
  // chrome.browserAction.setBadgeText({ text: "..." });

  let images = _.shuffle(await getAllImages());

  chrome.storage.local.get(null, async chromeStorageData => {
    let imagesCount = (Object.keys(chromeStorageData).length - 1) || 0;

    // chrome.browserAction.setBadgeText({ text: imagesCount + '' });

    for (image of images) {
      let id = image._id;

      if (chromeStorageData[id]) continue;

      let req = await fetchAsBlob(`${chrome.runtime.getManifest().homepage_url}/storage/${image.media}`)
      let base64 = await convertBlobToBase64(req);

      chrome.storage.local.set({ 
        [id]: {
          ...image,
          media: base64
        } 
      }, () => {
        console.log(id);

        // chrome.browserAction.setBadgeText({ text: (++imagesCount) + '' });
      });
    }
  });
})();

let service = analytics.getService('platocat_extension');

let tracker = service.getTracker('UA-144199659-2');

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason == 'install') {
    console.log('This is the first install');

    chrome.tabs.create({ url: `${chrome.runtime.getManifest().homepage_url}/thank-you` });

    tracker.sendEvent('Install', 'Install', 'Install');
  }
});

console.log('It works');