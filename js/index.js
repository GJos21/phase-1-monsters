const baseURL = "http://localhost:3000/monsters";
const navURL = baseURL + "/?_limit=50&_page=";

// determines which navigation method to use
//  true: nav by page#
//  false: nav by links returned in fetch header
const pageFlag = false;

// globals to store URLs for next and previous page of monsters 
//  used only when pageFlag is false
let nextURL = navURL + "1";
let prevURL = null;

const page = function () {
  // page returns an object with 2 functions 
  //  incr() to get the next page# 
  //  decr() to get the previous page# 
  let pageNumber = 1;
  return {
    incr: () => ++pageNumber,
    decr: () => pageNumber > 1 ? --pageNumber : pageNumber  // stop at 1
  }

}();

function handleNav(event) {
  const direction = event.target.id;
  let url;

  if (direction === "back") {
    pageFlag 
      ? url = `${navURL}${page.decr()}`
      : url = prevURL;
  }
  if (direction === "forward") {
    pageFlag
      ? url = `${navURL}${page.incr()}`
      : url = nextURL;
  }

  if (url) {  // prevURL will be null after page 1 fetch
    getMonsters(url);
  }

}

function getMonsters(url) {
  // this is the other version, which uses a link 
  //  stored from the "link" header of the last fetch

  console.log("FETCHING: ", url)
  fetch(url)
    .then(resp => {
      if (!pageFlag) {
        manageNavLinks(resp.headers);
      }
      return resp.json();
    })
    .then(items => {
      renderMonsters(items);
    });

}

function renderMonsters(monsters) {
  const div = document.querySelector("#monster-container");

  div.innerHTML = "";

  monsters.forEach(monster => {
    const p = document.createElement("p");

    p.innerHTML = 
    `<h2>${monster.name}</h2>
    <h3>Age: ${monster.age}</h3>
    ${monster.description}
    `
    div.append(p)

  })
}

function manageNavLinks(headers) {
  /* on fetch() json.server() returns a "link" header in the format:
    <url>; rel="first", <url>; rel="prev", <url>; rel="next", <url>; rel="last"
      rel indicates the relations to the page that was just fetched
      <url> indicates the url to fetch a related page
      the "prev" <url> does not appear in the first fetch
        (since there was no previous page)
    manageNavURls() lops through the header entries to find the link header
      and then calls extractNavURLs to get the "next" and "Prev" URLs
  */

  for (let pair of headers.entries()) {
    if (pair[0] === "link") {
      extractNavLinks( pair[1] );
    }
  }

}

function extractNavLinks(linkHeader) {
  // splits the link header into an array and calls findLink to get the related URL
  const links = linkHeader.split(", ");
  nextURL = findLink(links, "next");
  prevURL = findLink(links, "prev");

}

function findLink(links, rel) {
  // links items are in the format:
  //  <url>; rel="some rel value" 
  //  <> actully appear in the string, so have to remove them with slice(1, -1)
  const link = links.find(link => link.includes(rel))
  return link ? link.split("; ")[0].slice(1, -1) : null;

}

function postMonster(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById("name").value, 
    age: document.getElementById("age").value,
    description: document.getElementById("description").value
  };

  const configObj = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(formData),
  };

  fetch(baseURL, configObj)
    .then(function (response) {
      return response.json();
    })
    .catch(function (error) {
      alert(`Adding new monster failed with error: \n[${error.message}]`);
      console.log(error.message);
    });


  e.target.reset()
}

function renderInputForm() {
  const form = `<form id="input-form">
    <input id="name" type="text" placeholder="name..."/>
    <input id="age" type="text" placeholder="age..." />
    <input id="description" type="text" placeholder="description..." />
    <input type="submit" />
  </form>`
  const div = document.querySelector("#create-monster");
  div.innerHTML = form;
  document.getElementById("input-form").addEventListener("submit", postMonster);

}

document.addEventListener("DOMContentLoaded", () => {
  renderInputForm();
  getMonsters(nextURL); // nextURL is initialized to page 1
  document.getElementById("back").addEventListener("click", handleNav);
  document.getElementById("forward").addEventListener("click", handleNav);

});
