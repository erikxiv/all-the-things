const rdf = require("rdf-ext");
const Streamify = require("streamify-string");
const ParserJsonld = require("@rdfjs/parser-jsonld");
const parserJsonld = new ParserJsonld();
import { RDFS, RDF, SCHEMA } from './namespaces';

import jsonLdSchema from './schemas/schema.json';
const schema = rdf.dataset().import(parserJsonld.import(Streamify(JSON.stringify(jsonLdSchema))));

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

export {
  schema,
  getAllClasses,
  getProperties,
  getResources,
}
