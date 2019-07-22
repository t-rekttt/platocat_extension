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
  let images = await getAllImages();

  chrome.storage.local.get(null, async chromeStorageData => {
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
      }, () => console.log(id));
    }
  });
})();

console.log('It works');