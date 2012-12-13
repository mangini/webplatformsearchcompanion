// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//
// based on the Chromium search sample code - http://developer.chrome.com/extensions/samples.html

var currentRequest = null;
const BASE_URL = "http://docs.webplatform.org/wiki/";
const BASE_API_SEARCH_URL = "http://docs.webplatform.org/w/api.php?format=json&action=webplatformsearch&search=";
const BASE_GENERIC_SEARCH_URL = "http://docs.webplatform.org/w/index.php?search=";

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    if (currentRequest != null) {
      currentRequest.onreadystatechange = null;
      currentRequest.abort();
      currentRequest = null;
    }

    updateDefaultSuggestion(text);
    if (text == '' || text == 'help')
      return;

    currentRequest = search(text, function(resultJson) {
      if (resultJson && resultJson.result) {
        results = [];
        for (var i=0; i<resultJson.result.length; i++) {
          for (var j=0; j<resultJson.result[i].items.length; j++) {
            var item = resultJson.result[i].items[j];
            var description = resultJson.result[i].cssClass+': <url>' + item.subPageName + '</url>';
            results.push({
              content: BASE_URL+item.fullPageName,
              description: description
            });
          }
        }
        suggest(results);
     }

    });
  }
);

function resetDefaultSuggestion() {
  chrome.omnibox.setDefaultSuggestion({
    description: '<match><url>Search WebPlatform for </url></match>'
  });
}

resetDefaultSuggestion();

function updateDefaultSuggestion(text) {
  var isTag = /^tag:/.test(text);
  var isHelp = (text == 'help');
  var isPlaintext = text.length && !isTag && !isHelp;

  var description = '<match><url>Search WebPlatform for </url></match><dim> [';
  description +=
      isPlaintext ? ('</dim><match><url>' + text + '</url></match><dim>') : 'plaintext-search';
  description += ' | ';
  description += isTag ? ('</dim><match><url>' + text + '</url></match><dim>') : 'tag:tag-search';
  description += ' | ';
  description += isHelp ? '</dim><match><url>help</url></match><dim>' : 'help';
  description += ' ]</dim>';

  chrome.omnibox.setDefaultSuggestion({
    description: description
  });
}

chrome.omnibox.onInputStarted.addListener(function() {
  updateDefaultSuggestion('');
});

chrome.omnibox.onInputCancelled.addListener(function() {
  resetDefaultSuggestion();
});

function search(query, callback) {
  if (query == 'halp')
    return;

  var url = BASE_API_SEARCH_URL + query;

  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.setRequestHeader("GData-Version", "2");
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      callback(JSON.parse(req.responseText));
    }
  }
  req.send(null);
  return req;
}

function navigate(url) {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.update(tab.id, {url: url});
  });
}

chrome.omnibox.onInputEntered.addListener(function(text) {
  if (text.indexOf(BASE_URL)!=0) {
    text=BASE_GENERIC_SEARCH_URL+text;
  }
  navigate(text);
});
