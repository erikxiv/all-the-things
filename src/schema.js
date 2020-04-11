// Trusts that graphs are json-ld, compacted and flattened
import schema from './schemas/schema.json';
import jsonLdContext from './schemas/jsonLdContext.json';

const array = (n) => Array.isArray(n) ? n : typeof(n) === 'undefined' ? [] : [n];
const findById = (id) => schema["@graph"].find(n => n["@id"] === id);

const getAllClasses = (nodes) => {
  if (! nodes) {
    return [];
  }
  if (Array.isArray(nodes)) {
    return nodes.reduce((acc, curr) => {
      return [...acc, ...getAllClasses(curr)];
    }, []);
  }
  const next = array(findById(nodes)["rdfs:subClassOf"]).map(n => n["@id"])
  return [nodes, ...getAllClasses(next)];
}

const getProperties = (nodes) => {
  if (! nodes) {
    return [];
  }
  if (Array.isArray(nodes)) {
    return nodes.reduce((acc, curr) => {
      return [...acc, ...getProperties(curr)];
    }, []);
  }
  return schema["@graph"]
    .filter(n => n["@type"] === "rdf:Property")
    .filter(n => array(n["schema:domainIncludes"]).map(n => n["@id"]).includes(nodes));
}

const getSchemaForClass = (node) => {
  const allClasses = getAllClasses(node);
  const allProperties = getProperties(allClasses);
  return Object.assign({
    "@graph": [...allClasses.map(findById), ...allProperties]
  }, jsonLdContext);
}

export default {
  findById,
  getAllClasses,
  getProperties,
  getSchemaForClass,
}
