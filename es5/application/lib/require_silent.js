"use strict";

module.exports = function (file) {
  try {
    return require(file);
  } catch (e) {
    return e;
  }
};