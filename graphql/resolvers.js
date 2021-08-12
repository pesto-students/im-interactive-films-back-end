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

<<<<<<< Updated upstream
    movies: async () => {
      const data = await fetch(`${baseDBURL}/movies.json`);
      const dataJson = await data.json();
      const keys = Object.keys(dataJson);
      const mapsKeys = keys.map(function (item) {
        const movieData = dataJson[item];
        const graphqlMovie = movie(movieData);
        return graphqlMovie;
=======
    movies: async (_, { userId, queryText }) => {
      let ref = firebaseDB.ref("movies");

      if (!_isEmpty(queryText)) {
        // Only case sensitive search on title supported for now as it is not supported by DB
        ref = ref
          .orderByChild("title")
          .startAt(queryText)
          .endAt(queryText + "\uf8ff");
      } else if (!_isEmpty(userId)) {
        ref = ref.orderByChild("editorId").equalTo(userId);
      }

      await ref.once("value", (snapshot) => {
        if (snapshot.empty) {
          console.log("No matching movies.");
          return;
        }
        res = snapshot.val();
      });
      return res && Object.values(res);
    },

    getNewReleases: async (_, params) => {
      let ref = firebaseDB.ref().child("movies").orderByChild("createdAt");

      if (params && params.limit) {
        ref = ref.limitToFirst(params.limit);
      }

      let res = [];
      await ref.once("child_added", (snapshot) => {
        if (snapshot.empty) {
          console.log("No matching movies.");
          return;
        }
        const movieData = snapshot.val();
        movieData.isPublished &&
          !movieData.isFeatured &&
          res.push(snapshot.val());
>>>>>>> Stashed changes
      });
      return mapsKeys;
    },

    movie: async (_, {id} ) => {

<<<<<<< Updated upstream
      const ref =  firebaseDB
                    .ref()
                    .child('movies');
=======
      if (params && params.limit) {
        ref = ref.limitToFirst(params.limit);
      }

      let res = [];
      await ref.once("child_added", (snapshot) => {
        if (snapshot.empty) {
          console.log("No matching movies.");
          return;
        }
        const movieData = snapshot.val();
        movieData.isPublished &&
          movieData.isFeatured &&
          res.push(snapshot.val());
      });
      return res;
    },

    // searchByTitle: async (_, { queryText }) => {
    //   const ref = firebaseDB.ref("movies");
    //   let res;
    //   await ref
    //     .orderByChild("title")
    //     .startAt(queryText)
    //     .endAt(queryText + "\uf8ff")
    //     .once("value", (snapshot) => {
    //       if (snapshot.empty) {
    //         console.log("No matching movies.");
    //         return;
    //       }
    //       res = snapshot.val();
    //     });
    //   return res && Object.values(res);
    // },

    movie: async (_, { id }) => {
      const ref = firebaseDB.ref().child("movies");
>>>>>>> Stashed changes
      let res;
      await ref
            .orderByChild("id")
            .equalTo(id)
            .once('value', (snapshot) => {
                if (snapshot.empty) {
                  console.log('No matching movies.');
                  return;
                }
                res = snapshot.val();
              });
      return res && movie(Object.values(res)[0]);
    },

    filterMovies: async (_, { filter }) => {
      const key = filter.key;
      let value;
      if (key === "isPublished" || key === "isFeatured") {
        value = JSON.parse(filter.value);
      } else {
        value = filter.value;
      }

      const ref = firebaseDB.ref().child("movies");
      let res;
      if (key) {
        await ref
          .orderByChild(key)
          .equalTo(value)
          .once("value", (snapshot) => {
            if (snapshot.empty) {
              console.log("No matching movies.");
              return;
            }
            res = snapshot.val();
          });
      }
      return (
        res &&
        Object.values(res).reduce((filterResult, movieData) => {
          filterResult.push(movie(movieData));
          return filterResult;
        }, [])
      );
    },

    hotspot: async (_, { movieId, id }) => {
      const ref = firebaseDB.ref("movies").child(`/${movieId}/hotspots/${id}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          res = snapshot.val();
        } else {
          // TODO : Sentry log - hotspot does not exist
        }
      });
      return res;
    },

    overlay: async (_, { movieId, id }) => {
      const ref = firebaseDB.ref("movies").child(`/${movieId}/overlays/${id}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          res = snapshot.val();
        } else {
          // TODO : Sentry log - hotspot does not exist
        }
      });
      return res;
    },

    trigger: async (_, { movieId, id }) => {
      const ref = firebaseDB.ref("movies").child(`/${movieId}/triggers/${id}`);

      let res;
      await ref.once("value", (snapshot) => {
        if (snapshot.exists()) {
          res = snapshot.val();
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

      // By default, keeping published and featured flag as false
      data.isPublished = false;
      data.isFeatured = false;

      await firebaseDB
        .ref("movies/" + id)
        .set(JSON.parse(JSON.stringify(data)), (error) => {
          if (error) {
            return error;
          } else {
            res = data;
          }
        });

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

      if (_isEmpty(data.id)) {
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
      } else {
        const refEdit = firebaseDB
          .ref("movies")
          .child(`/${movieId}/hotspots/${data.id}`);
        let resEdit;
        await refEdit.once("value", (snapshot) => {
          if (snapshot.exists()) {
            refEdit.set(JSON.parse(JSON.stringify(data)), (error) => {
              if (error) {
                return error;
              }
            });
            resEdit = data;
          } else {
            // TODO : Sentry log - hotspot does not exist
          }
        });
        return resEdit;
      }
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

    addOverlay: async (parent, { movieId, data }, { models }) => {
      if (!movieId || !data) {
        return "Invalid request";
      }

      if (_isEmpty(data.id)) {
        const ref = firebaseDB.ref("movies").child(`/${movieId}`);

        let res;
        await ref.once("value", (snapshot) => {
          if (snapshot.exists()) {
            const id = uuidv4();
            data.id = id;

            ref
              .child("/overlays/" + id)
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
      } else {
        const refEdit = firebaseDB
          .ref("movies")
          .child(`/${movieId}/overlays/${data.id}`);
        let resEdit;
        await refEdit.once("value", (snapshot) => {
          if (snapshot.exists()) {
            refEdit.set(JSON.parse(JSON.stringify(data)), (error) => {
              if (error) {
                return error;
              }
            });
            resEdit = data;
          } else {
            // TODO : Sentry log - hotspot does not exist
          }
        });
        return resEdit;
      }
    },

    deleteOverlay: async (parent, { id, movieId }, { models }) => {
      if (!movieId || !id) {
        return "Invalid request";
      }

      const ref = firebaseDB.ref("movies").child(`/${movieId}/overlays/${id}`);

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

    addTrigger: async (parent, { movieId, data }, { models }) => {
      if (!movieId || !data) {
        return "Invalid request";
      }

      if (_isEmpty(data.id)) {
        const ref = firebaseDB.ref("movies").child(`/${movieId}`);

        let res;
        await ref.once("value", (snapshot) => {
          if (snapshot.exists()) {
            const id = uuidv4();
            data.id = id;

            ref
              .child("/triggers/" + id)
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
      } else {
        const refEdit = firebaseDB
          .ref("movies")
          .child(`/${movieId}/triggers/${data.id}`);
        let resEdit;
        await refEdit.once("value", (snapshot) => {
          if (snapshot.exists()) {
            refEdit.set(JSON.parse(JSON.stringify(data)), (error) => {
              if (error) {
                return error;
              }
            });
            resEdit = data;
          } else {
            // TODO : Sentry log - hotspot does not exist
          }
        });
        return resEdit;
      }
    },

    deleteTrigger: async (parent, { id, movieId }, { models }) => {
      if (!movieId || !id) {
        return "Invalid request";
      }

      const ref = firebaseDB.ref("movies").child(`/${movieId}/triggers/${id}`);

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
