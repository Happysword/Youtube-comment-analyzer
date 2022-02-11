export default {
  getVideoComments(videoId, pageToken) {
    return fetch(
      "https://youtube.googleapis.com/youtube/v3/commentThreads?" +
        new URLSearchParams({
          maxResults: "100",
          part: "snippet",
          videoId: videoId,
          key: "", // Key should be your API key from youtube
          order: "relevance",
          ...(pageToken && { pageToken }),
        })
    )
      .then((response) => response.json())
      .catch((err) => err);
  },
};
