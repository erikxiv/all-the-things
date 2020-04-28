const rdf = require("rdf-ext");
const Streamify = require("streamify-string");
const toString = require('stream-to-string')
const formats = require('@rdfjs/formats-common')
import { RDFS, RDF, SCHEMA } from './namespaces';
import { wrap } from './convenient-dataset';

const byPrefix = {}

// Returns an array of terms
const getAllClasses = (dataset, terms) => {
  if (! terms) {
    return [];
  }
  if (Array.isArray(terms)) {
    return terms.reduce((acc, curr) => {
      return [...acc, ...getAllClasses(curr)];
    }, []);
  }
  const next = dataset.match(terms, RDFS.subClassOf).toArray().map(q => q.object);
  return [terms, ...getAllClasses(dataset, next)];
}

// Returns an array of terms
const getProperties = (dataset, terms) => {
  if (Array.isArray(terms)) {
    return terms.reduce((acc, curr) => {
      return [...acc, ...getProperties(curr)];
    }, []);
  }
  return dataset.match(null, SCHEMA.domainIncludes, terms).toArray().map(q => q.subject);
}

// Returns an array of terms
const getResources = (dataset) => {
  return dataset.toArray().reduce((acc, curr) => {
    if (curr.subject.termType === "NamedNode" && !acc.includes(curr.subject)) {
      acc.push(curr.subject);
    }
    return acc;
  }, []);
}

const getDocumentByPrefix = (prefix) => {
  return byPrefix[prefix];
}

const load = async (prefix, mediaType, input, options) => {
  byPrefix[prefix] = wrap(rdf.dataset()).import(formats.parsers.import(mediaType, input, options));
  byPrefix[prefix] = await byPrefix[prefix];
  console.log(`Loaded ${prefix}`, byPrefix[prefix]);
};

const save = async (prefix) => {
  const doc = byPrefix[prefix];
  const serializer = formats.serializers.get('application/ld+json');
  const stream = serializer.import(doc.toStream());
  toString(stream).then(txt => localStorage.setItem(prefix, txt));
}

export default {
  getAllClasses,
  getProperties,
  getResources,

  getDocumentByPrefix,
  load,
  save,
}
