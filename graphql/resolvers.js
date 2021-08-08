const { v4: uuidv4 } = require("uuid");
const _isEmpty = require("lodash/isEmpty");
const fetch = require("node-fetch");
const { database, firebaseClient } = require("../services/firebase");
const userProfile = require("./mapping/userProfile");
const movie = require("./mapping/movie");

const baseDBURL =
  process.env.NODE_ENV === "production"
    ? process.env.FB_PROD_DB_URL
    : process.env.FB_DEV_DB_URL;

const firebaseDB = firebaseClient.database();

const resolvers = {
  Query: {
    user: async (_, { uid }) => {
      const data = await fetch(`${baseDBURL}/users/${uid}.json`);
      const dataJson = await data.json();
      return userProfile(dataJson);
    },

    users: async () => {
      const data = await fetch(`${baseDBURL}/users.json`);
      const dataJson = await data.json();
      const keys = Object.keys(dataJson);
      const mapsKeys = keys.map(function (item) {
        const userData = dataJson[item];
        const graphqlUser = userProfile(userData);
        return graphqlUser;
      });
      return mapsKeys;
    },

    movies: async () => {
      const data = await fetch(`${baseDBURL}/movies.json`);
      const dataJson = await data.json();
      const keys = Object.keys(dataJson);
      const mapsKeys = keys.map(function (item) {
        const movieData = dataJson[item];
        const graphqlMovie = movie(movieData);
        return graphqlMovie;
      });
      return mapsKeys;
    },

    movie: async (_, { id }) => {
      const data = await fetch(`${baseDBURL}/movies/${id}.json`);
      const dataJson = await data.json();
      return movie(dataJson);
    },

    hotspot: async (_, { movieId, id }) => {
      const ref = firebaseDB.ref("movies").child(`/${movieId}/hotspots/${id}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          const hotspotData = snapshot.val();
          res = hotspotData;
        } else {
          // TODO : Sentry log - hotspot does not exist
        }
      });
      return res;
    },
  },

  Mutation: {
    createUser: async (parent, data, { models }) => {
      if (!data) {
        return "No data provided";
      }

      let uid = data.uid;
      if (_isEmpty(uid)) {
        uid = uuidv4();
        data.uid = uid;
      }

      let res;
      await firebaseDB.ref("users/" + uid).set(data, (error) => {
        if (error) {
        } else {
          res = data;
        }
      });
      return res;
    },

    addMovie: async (parent, data, { models }) => {
      if (!data) {
        return "No data provided";
      }

      const id = uuidv4();
      data.id = id;

      data.createdAt = new Date();

      await firebaseDB
        .ref("movies/" + id)
        .set(JSON.parse(JSON.stringify(data)), (error) => {
          if (error) {
            return error;
          } else {
            res = data;
          }
        });

      const editorId = data.editorId;
      let editorListRef = firebaseDB.ref("users/" + editorId + "/editedMovies");
      editorListRef.push(id);

      return res;
    },

    updateMovie: async (parent, { id, data }, { models }) => {
      if (!id || !data) {
        return "Invalid request";
      }

      const ref = firebaseDB.ref("movies").child(`/${id}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          data.id = id;
          ref.set(JSON.parse(JSON.stringify(data)), (error) => {
            if (error) {
              return error;
            }
          });
          res = data;
        } else {
          // TODO : Sentry log - movie does not exist
        }
      });
      return res;
    },

    addHotspot: async (parent, { movieId, data }, { models }) => {
      if (!movieId || !data) {
        return "Invalid request";
      }

      const ref = firebaseDB.ref("movies").child(`/${movieId}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          const id = uuidv4();
          data.id = id;

          ref
            .child("/hotspots/" + id)
            .set(JSON.parse(JSON.stringify(data)), (error) => {
              if (error) {
                return error;
              }
            });
          res = data;
        } else {
          // TODO : Sentry log - movie does not exist
        }
      });
      return res;
    },

    editHotspot: async (parent, { id, movieId, data }, { models }) => {
      if (!movieId || !id || !data) {
        return "Invalid request";
      }

      const ref = firebaseDB.ref("movies").child(`/${movieId}/hotspots/${id}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          data.id = id;
          ref.set(JSON.parse(JSON.stringify(data)), (error) => {
            if (error) {
              return error;
            }
          });
          res = data;
        } else {
          // TODO : Sentry log - hotspot does not exist
        }
      });
      return res;
    },

    deleteHotspot: async (parent, { id, movieId }, { models }) => {
      if (!movieId || !id) {
        return "Invalid request";
      }

      const ref = firebaseDB.ref("movies").child(`/${movieId}/hotspots/${id}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          ref.remove((error) => {
            if (error) {
              return error;
            }
          });
          res = id;
        } else {
          // TODO : Sentry log - hotspot does not exist
        }
      });
      return res;
    },
  },
};

module.exports = resolvers;
