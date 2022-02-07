<template>
  <v-container>
    <v-row justify="center" class="pa-2 mt-5">
      <v-col cols="12" id="title"> Youtube Comments Word Analyzer </v-col>
      <v-col md="8" xs="12">
        <v-form ref="form" lazy-validation @submit.prevent="newSearch">
          <v-text-field
            outlined
            v-model="url"
            label="Youtube Video URL"
            append-outer-icon="mdi-cloud-search"
            @click:append-outer="newSearch"
            :rules="[
              (v) => !!v || 'Please enter a valid URL',
              (v) =>
                !!v.match(
                  /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g
                ) || 'Not a valid Youtube URL',
            ]"
            hint="Example URL : https://www.youtube.com/watch?v=0PRu0PD1sQs"
            persistent-hint
          ></v-text-field>
        </v-form>
      </v-col>

      <!-- Loading till we get request -->
      <v-col v-if="loading === 1" cols="12">
        <v-container class="expand">
          <v-progress-circular
            :size="200"
            color="blue"
            indeterminate
            :width="10"
          >
          </v-progress-circular>
        </v-container>
      </v-col>

      <!-- Word Cloud -->
      <v-col v-if="loading === 2" cols="12" class="mt-6">
        <div id="progress"></div>
        <vue-word-cloud
          @update:progress="showPercentage"
          style="height: 50vh; width: 70vw; margin: auto"
          :words="commentsDataFrequencies"
          :color="() => colors[Math.floor(Math.random() * colors.length)]"
          font-family="Righteous"
          :font-size-ratio="20"
        >
          <template slot-scope="{ text, weight }">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <div v-bind="attrs" v-on="on" style="cursor: default">
                  {{ text }}
                </div>
              </template>
              <span>{{ text }}: {{ weight }}</span>
            </v-tooltip>
          </template>
        </vue-word-cloud>
      </v-col>
    </v-row>

    <!-- Snack Bar for errors -->
    <v-snackbar :timeout="3000" v-model="showSnackbar" absolute top color="red">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script>
import VueWordCloud from "vuewordcloud";
import api from "../api/index";

export default {
  name: "Home",
  components: {
    [VueWordCloud.name]: VueWordCloud,
  },
  data: () => ({
    url: "",
    loading: 0, // States 0 => Initial state nothing is showing, 1 => waiting for request, 2 => word cloud is processing, 3=> word cloud show
    commentsDataFrequencies: [],
    colors: [
      "DeepPink",
      "Indigo",
      "RoyalBlue",
      "#6ECB63",
      "#345B63",
      "#3DB2FF",
      "#E7E0C9",
      "#FFDEDE",
      "#261C2C",
      "#FF4848",
      "#B980F0",
      "#F5E79D",
    ],
    showSnackbar: false,
    errorMessage: "",
  }),
  methods: {
    async newSearch() {
      if (!this.$refs.form.validate()) {
        return;
      }
      let regExp =
        /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = this.url.match(regExp);
      const videoID = match[2];

      // Set Loading
      this.loading = 1;
      if (document.getElementById("progress")) {
        document.getElementById("progress").innerText = "";
      }
      this.getAllComments(videoID);
    },
    async getAllComments(videoID) {
      // Initialize next page token
      let nextPageToken = null;
      let retrievedComments = null;

      // Loop while there is a next page
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // Send the request to get the comments
        let data = await api.getVideoComments(videoID, nextPageToken); // "xgZGqD6DAAk"
        // Check errors
        if (data.error) {
          try {
            this.errorMessage = data.error.errors[0].reason;
          } catch (error) {
            this.errorMessage =
              "Error Unknown, Probably the Daily quota ended, Please check the Network tab for more details";
          }
          this.showSnackbar = true;
          retrievedComments = null;
          break;
        }
        // Data is recovered correctly
        else {
          // Add data to retrieved
          if (retrievedComments == null) {
            retrievedComments = data.items;
          } else {
            retrievedComments = retrievedComments.concat(data.items);
          }

          // Check if there is another page
          if (data.nextPageToken) {
            nextPageToken = data.nextPageToken;
          } else {
            break;
          }
        }
      }

      // Check retrieved comments state and set the app state
      if (retrievedComments == null) {
        this.commentsDataFrequencies = [];
        this.loading = 0;
      } else {
        // Concatenate all comments into a single string
        let concatenatedComments = this.concatenateComments(retrievedComments);

        // Calculte the word frequinces
        let wordFrequencies =
          this.calculateWordFrequencies(concatenatedComments);

        // Change the data to the format the word cloud needs
        let wordFreqArrays = this.dictToArrays(wordFrequencies);

        // Add the data to the word cloud
        this.commentsDataFrequencies = wordFreqArrays;

        // Show the word cloud
        this.loading = 2;
      }
    },
    concatenateComments(comments) {
      let result = "";
      for (let index = 0; index < comments.length; index++) {
        // Add the main comment
        result +=
          " " + comments[index].snippet.topLevelComment.snippet.textOriginal;

        // Add the replies comments
        // eslint-disable-next-line no-prototype-builtins
        if (comments[index].hasOwnProperty("replies")) {
          const replies = comments[index].replies.comments;
          for (let reply = 0; reply < replies.length; reply++) {
            result += " " + replies[0].snippet.textOriginal;
          }
        }
      }
      return result;
    },
    calculateWordFrequencies(searchString) {
      searchString = searchString.toLowerCase();
      searchString = searchString.replace(
        /[\.,-\/#!$%\^&\*;:{}=\-_`~()"]/g,
        " "
      );
      searchString = searchString.replace(/\n/g, " ");

      let frequinces = {};
      let words = searchString.split(" ");

      words.map((word) => {
        if (word.length >= 1) {
          if (frequinces[word]) {
            frequinces[word]++;
          } else {
            frequinces[word] = 1;
          }
        }
      });

      return frequinces;
    },
    dictToArrays(dict) {
      let result = [];
      for (const [key, value] of Object.entries(dict)) {
        result.push([key, value]);
      }
      return result;
    },
    showPercentage(e) {
      if (e) {
        const progressValue = e.completedWords + " of " + e.totalWords;
        if (document.getElementById("progress")) {
          document.getElementById("progress").innerText = progressValue;
        }
        if (e.completedWords === e.totalWords) {
          if (document.getElementById("progress")) {
            document.getElementById("progress").innerText = "";
          }
        }
      }
    },
  },
};
</script>

<style scoped>
#title {
  text-align: center;
  font-size: 64px;
  font-family: "Righteous", cursive !important;
}
@media screen and (max-width: 768px) {
  #title {
    font-size: 32px;
  }
}
.expand {
  height: 40vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
#progress {
  text-align: center;
  font-size: 24px;
  color: royalblue;
  font-family: "Righteous", cursive !important;
}
</style>
