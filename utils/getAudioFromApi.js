function getAudioFromApi(title) {
  return fetch(
    `https://deezerdevs-deezer.p.rapidapi.com/search?q=${title}`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.AUDIO_API_KEY,
        "X-RapidAPI-Host": process.env.AUDIO_API_HOST,
      },
    }
  )
    .then((res) => res.json())
    .then((res) => res);
}



module.exports = getAudioFromApi;
