'use strict';

var hasOwnProperty = Object.hasOwnProperty;

/**
 *
 * @param item
 * @returns {*|boolean}
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

/**
 *
 * @param objectA
 * @param objectB
 * @returns {*}
 */
function diff(objectA, objectB) {
  if (!isObject(objectA) || !isObject(objectB)) return null;
  var output = null;

  for (var key in objectB) {
    var aProp = objectA[key];
    var bProp = objectB[key];

    if (aProp !== bProp && !isObject(aProp) && !isObject(bProp)) {
      if (!output) output = {};
      output[key] = bProp;
    } else if (isObject(aProp) && isObject(bProp)) {
      var deepObjDif = diff(aProp, bProp);
      if (deepObjDif) {
        if (!output) output = {};
        output[key] = deepObjDif;
      }
    }
  }

  return output;
}

/**
 *
 * @param object
 * @param keys
 * @param parent
 * @param joiner
 * @returns {*}
 * @private
 */
function _valuesChild(object, keys, parent, joiner) {
  for (var key in object) {
    if (isObject(object[key])) _valuesChild(object[key], keys, parent + joiner + key, joiner);
    else keys.push(object[key]);
  }
}

/**
 * Same as Object.keys except deeply
 * @param object
 * @param joiner
 * @returns {{}}
 */
function values(object, joiner) {
  if (!isObject(object)) return null;
  var values = [];
  var _joiner = joiner || '.';

  for (var key in object) {
    if (isObject(object[key])) _valuesChild(object[key], values, key, _joiner);
    else values.push(object[key]);
  }

  return values;
}


/**
 *
 * @param object
 * @param keys
 * @param parent
 * @param joiner
 * @returns {*}
 * @private
 */
function _keysChild(object, keys, parent, joiner) {
  for (var key in object) {
    if (isObject(object[key])) _keysChild(object[key], keys, parent + joiner + key, joiner);
    else keys.push(parent + joiner + key);
  }
}

/**
 * Same as Object.keys except deeply
 * @param object
 * @param joiner
 * @returns {{}}
 */
function keys(object, joiner) {
  if (!isObject(object)) return null;
  var keys = [];
  var _joiner = joiner || '.';

  for (var key in object) {
    if (isObject(object[key])) _keysChild(object[key], keys, key, _joiner);
    else keys.push(key);
  }

  return keys;
}


/**
 *
 * @param object
 * @param stack
 * @param parent
 * @param joiner
 * @returns {*}
 * @private
 */
function _flattenChild(object, stack, parent, joiner) {
  for (var key in object) {
    if (isObject(object[key])) {
      var p = parent + joiner + key;
      _flattenChild(object[key], stack, p, joiner);
    } else {
      stack[parent + joiner + key] = object[key];
    }
  }
  return stack;
}

/**
 * Deeply flattens an object into a 1 level deep object.
 * @param object
 * @param joiner
 * @returns {{}}
 */
function flatten(object, joiner) {
  var _joiner = joiner || '.';
  if (!isObject(object)) return null;

  var stack = {};

  for (var key in object) {
    if (isObject(object[key])) {
      _flattenChild(object[key], stack, key, _joiner);
    } else {
      stack[key] = object[key];
    }
  }

  return stack;
}

/**
 * Unflattens an previously flattened object  back into deep nested object.
 * @param object
 * @param joiner
 * @returns {{}}
 */
function unflatten(object, joiner) {
  var _joiner = joiner || '.';
  if (!isObject(object)) return null;

  var stack = {};

  for (var key in object) {
    if (key.indexOf(_joiner) === -1) stack[key] = object[key];
    else set(stack, key, object[key], true, _joiner);
  }

  return stack;
}


/**
 * Deep get a value from an object.
 * @param object
 * @param path
 * @param joiner
 * @returns {*}
 */
function get(object, path, joiner) {
  var keys = path.split(joiner || '.');

  var i = 0;
  var tmp = object;
  var len = keys.length;

  while (i < len) {
    var key = keys[i++];
    if (!tmp || !hasOwnProperty.call(tmp, key)) {
      return tmp = undefined;
    }
    tmp = tmp[key];
  }

  return tmp;
}

/**
 * Deep set a value
 * @param object
 * @param path
 * @param value
 * @param initPaths
 * @param joiner
 */
function set(object, path, value, initPaths, joiner) {
  if (!isObject(object)) return false;
  var keys = path.split(joiner || '.');

  var i = 0;
  var len = keys.length - 1;

  while (i < len) {
    var key = keys[i++];
    if (initPaths && !hasOwnProperty.call(object, key)) object[key] = {};
    object = object[key];
  }

  if (isObject(object)) object[keys[i]] = value;
  else return false;
  return true;
}

/**
 *
 * @param object
 * @param source
 * @param noUndef
 * @param joiner
 */
function mapToProps(object, source, noUndef, joiner) {
  if (!isObject(object)) return object;
  var _joiner = typeof noUndef === 'string' ? noUndef : joiner;
  var _noUndef = typeof noUndef === 'boolean' ? noUndef : true;
  var _object = flatten(object, _joiner);
  var _source = flatten(source, _joiner);

  for (var key in _object) {
    var value = _source[_object[key]];
    if (_noUndef && value !== undefined) _object[key] = value;
    else if (_noUndef) delete _object[key];
    else _object[key] = value;
  }

  return unflatten(_object, _joiner);
}

/**
 *
 * @param target
 * @param source
 * @returns {*}
 */
function merge(target, source) {
  if (isObject(target) && isObject(source)) {
    for (var key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}

module.exports.get = get;
module.exports.set = set;
module.exports.diff = diff;
module.exports.keys = keys;
module.exports.merge = merge;
module.exports.values = values;
module.exports.flatten = flatten;
module.exports.expand = unflatten;
module.exports.collapse = flatten;
module.exports.isObject = isObject;
module.exports.unflatten = unflatten;
module.exports.mapToProps = mapToProps;

// // todo tests for keys, values, unflatten, mapToProps
// //
// const test = unflatten({
//   'a.b.c.d.e.f.g': 1,
//   'a.b.f': 2,
//   'a.k.j': 4,
// });
//
// console.dir(test);
//
// const mappy = mapToProps({
//   1: 'a.b.c.d.e.f.g',
//   2: 'a.b.f',
//   4: 'a.k.j',
//   5: 'a.k.j.k.l.m.n.o',
//   6: {
//     7: 'a.b.f',
//     8: 'a.b.f.b.c.d'
//   }
// }, test);
//
// console.dir(mappy);
