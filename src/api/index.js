export default {
  getVideoComments(videoId, pageToken) {
    return fetch(
      "https://youtube.googleapis.com/youtube/v3/commentThreads?" +
        new URLSearchParams({
          maxResults: "100",
          part: "snippet,replies",
          videoId: videoId,
          key: "AIzaSyDJcLStft03LfAqFz1IZJr7NT2xvuDjVH8",
          order: "relevance",
          ...(pageToken && { pageToken }),
        })
    )
      .then((response) => response.json())
      .catch((err) => err);
  },
};
