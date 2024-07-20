const findRS = (queryString) => callJstage(getRSLookupURI(queryString), queryString, "RS");

const getRSLookupURI = (queryString) => getEntitySourceURI(queryString, null);

// note that this method is exposed on the npm module to simplify testing,
// i.e., to allow intercepting the HTTP call during testing, using sinon or similar.
const getEntitySourceURI = (queryString, type) => {
  // the wdk used below, actually uses the Jstage php api

  const LIMIT = 200;

  const url = `https://sukilam-educational-metadata.vercel.app/api/jstage/?q=${queryString}&page[limit]=${LIMIT}`;

  return url
};

const generateCitation = (item) => {
  const authors = item.author;
  const publisher = item.material.length > 0 ? item.material : [];

  const vol = item.volume.length > 0 ? item.volume[0] : ""
  const noStr = item.number.length > 0 ? `(${item.number[0]})` : ""

  const volAndNo = vol || no ? `, ${vol}${noStr}` : ""

  const ppStr = item.startingPage.length > 0 && item.endingPage.length > 0 ? `${item.startingPage[0]}-${item.endingPage[0]}` : ""

  const dateStr = item.pubyear.length > 0 ? `, ${item.pubyear.join(", ")}` : ""

  const publisherStr = publisher.length > 0 ? ` / ${publisher.join(", ")}` : "";

  return `${authors.join(", ")}${publisherStr}${volAndNo}${ppStr}${dateStr}`
}


const callJstage = async (url, queryString, nameType) => {

  const response = await fetchWithTimeout(url).catch((error) => {
    return error;
  });

  //if status not ok, through an error
  if (!response.ok)
    throw new Error(
      `Something wrong with the call to Jstage, possibly a problem with the network or the server. HTTP error: ${response.status}`
    );

  const data = await response.json()

  const results = [];

  for (const entry of data.data) {
    const attributes = entry.attributes;

    const id = entry.id
    const uriForDisplay = id;
    const uri = id;

    results.push({
      nameType,
      id,
      originalQueryString: queryString,
      uriForDisplay,
      uri,
      name: attributes.title.join(", "),
      repository: 'jstage',
      citation: generateCitation(attributes),
    })

  }

  return results;
};

/*
     config is passed through to fetch, so could include things like:
     {
         method: 'get',
         credentials: 'same-origin'
    }
*/
const fetchWithTimeout = (url, config = {}, time = 30000) => {
  /*
        the reject on the promise in the timeout callback won't have any effect, *unless*
        the timeout is triggered before the fetch resolves, in which case the setTimeout rejects
        the whole outer Promise, and the promise from the fetch is dropped entirely.
    */

  // Create a promise that rejects in <time> milliseconds
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject('Call to Jstage timed out');
    }, time);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([fetch(url, config), timeout]);
};

export default {
  findRS,
  getRSLookupURI,
  fetchWithTimeout,
};
