const apiKey = process.env.VIDEO_API_KEY;

function getVideoFromApi(title) {
  return fetch(
    `https://youtube.googleapis.com/youtube/v3/search?part=snippet&key=${apiKey}&maxResults=50&type=video&q=${title}`,
    {
      method: "GET",
    }
  )
    .then((res) => res.json())
    .then((res) => res);
}

module.exports = getVideoFromApi;
