const apiKey = process.env.IMAGES_API_KEY;

function getImagesFromApi(title) {
  return fetch(`https://api.pexels.com/v1/search?query=${title}&per_page=8`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: apiKey,
    },
  })
    .then((res) => res.json())
    .then((res) => res);
}

module.exports = getImagesFromApi;
