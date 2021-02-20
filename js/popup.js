
let btnGetLinksSeason = document.getElementById('getLinksForSeason');
let btnShowLinksSeason = document.getElementById('showLinksForSeason');
/*let contentPort
chrome.runtime.onConnect.addListener(function(portFrom) {
if(portFrom.name === 'rezkaINFO') {
//This is how you add listener to a port.
portFrom.onMessage.addListener(function(message) {
alert(message);
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
chrome.tabs.executeScript(
tabs[0].id,{code: 'console.log("hi", message);'});
});
});
}
});
 */

let sendPort = null;
chrome.tabs.query({
    active: true,
    currentWindow: true
}, function (tabs) {
    if (tabs[0].url.match(/https:\/\/rezka\.ag/)) {
        sendPort = chrome.tabs.connect(tabs[0].id, {
                name: 'popupSendRezka'
            });
        getRezkaInfo('GET_CURRENT_VIDEO');
    } else {
        currentVideoRender();
    }
});

let bgPort = chrome.runtime.connect({
        name: 'BgSendPopup'
    });
bgPort.onMessage.addListener(function (msg) {
    if (msg.action === 'DATA_RECEIVED') {
    	currentVideoRender();
    }
});


let historyRendered = false,
    savedLinksRendered = false;

$('#headingTwo').on('click', function () {
	!historyRendered && historyRender();
    historyRendered = true;
});

$('#headingSaves').on('click', function () {
    !savedLinksRendered && savedLinksRender();
    savedLinksRendered = true;
});

$('#accordionExt').on('click', '.film_a', saveOpenedFilm);

function getRezkaInfo(type) {
    sendPort.postMessage({
        action: type
    });
}

function currentVideoRender() {
	chrome.storage.local.get('currentCDN', function (data) {
        let div = document.getElementById('contentForVideo');
        if (!data || !data.currentCDN) {
            div.innerHTML = '<center>Нет данных</center>';
            return;
        }
        let html = '<h5>' + data.currentCDN.payload.filmName + '</h5>';
        let qualityHtml = qualityRender(data.currentCDN.payload.CDNPlayerInfo.streams, data.currentCDN.payload.filmName, data.currentCDN.payload.urlPage);
        html += `<button class="btn btn-success" id="saveLink" data-name="${data.currentCDN.payload.filmName}" data-url="${data.currentCDN.payload.urlPage}">Сохранить ссылку</button>`;
        html += qualityRender(data.currentCDN.payload.CDNPlayerInfo.streams, data.currentCDN.payload.filmName, data.currentCDN.payload.urlPage);
        div.innerHTML = html;
        $('#saveLink').data('quality', qualityHtml);    

        
        $('#saveLink').on('click', saveLink);
    });
}

function savedLinksRender() {
    
    let html = '';
    chrome.storage.local.get(['savedLinks'], function (data) {
        let savedLinks = [];
        savedLinks = data.savedLinks;

    
        if (!savedLinks || savedLinks.length == 0) {
            html += '<center>пока пусто</center>'
        } else {
            html = '<ul><a class="clear-history" id="clearSavedLinks">Очистить</a>';
            
            for (i in savedLinks) {
                html += '<li><a href="'+savedLinks[i]['url']+'" target="_blank" class="page-url">'+savedLinks[i]['name']+'</a><br>'+savedLinks[i]['quality']+'<small>'+savedLinks[i]['date']+'</small><a data-id="'+i+'" class="deleteSavedLink">x</a></li>';//'<a href="'+savedLinks[i]['url']+'" target="_blank">'+savedLinks[i]['name']+'</a> <small>'+savedLinks[i]['date']+'</small><a data-id="'+i+'" class="deleteSavedLink">x</a></li>';
            }
            html += '</ul>';
        }
        $('#savedLinks').html(html);
        $('#clearSavedLinks').on('click', function () {
            chrome.storage.local.set({
                savedLinks: []
            });
            savedLinksRender();
        });
        $('.deleteSavedLink').on('click', function () {
            let id = parseInt($(this).data('id'));
            if (typeof id == "number") {
                savedLinks.splice(id, 1);
                chrome.storage.local.set({
                    savedLinks: savedLinks
                });
            }
            savedLinksRender();
        });
        
    });
    
    
    
}

function historyRender() {
	
	let html = '';
	chrome.storage.local.get(['history'], function (data) {
		let history = [];
		history = data.history;

	
		if (!history || history.length == 0) {
			html += '<center>пока пусто</center>'
		} else {
			html = '<ul><a class="clear-history" id="clearHistory">Очистить</a>';
			history = history.reverse();
			for (i in history) {
				html += '<li>'+'<a href="'+history[i]['url']+'" target="_blank">'+history[i]['name']+'</a> <small>'+history[i]['date']+'</small></li>';
			}
			html += '</ul>';
		}
		document.getElementById('history').innerHTML = html;
		$('#clearHistory').on('click', function () {
			chrome.storage.local.set({
	            history: []
	        });
            historyRender();
		});
	});
	
	
	
}


function qualityRender(urls, name = '', urlPage) {
    let html = '';
    let lines = urls.split('[');
    let player_url = chrome.extension.getURL('player.html') + '?title=' + encodeURIComponent(name) + '&streams=' + encodeURIComponent(urls);
    
    html += '<ul class="quiality">';
    //html += `<li><a class="film_a" data-urlpage="${urlPage}" data-url="${player_url}" data-name="${name}">Player</a></li>`;
    for (i of lines) {
        let label = i.match(/(^\d+p[^\]]*)/);
        let url = i.match(/https:\/\/.*\.m3u8 or ([^,]+)(,|$)/)
            if (label == null || url == null) {
                continue;
            }
            let link = player_url+'&quality='+encodeURIComponent(label[0]);
            html += `<li><a class="film_a" data-urlpage="${urlPage}" data-url="${link}" data-name="${name}">${label[0]}</a></li>`;
          
            //html += '<li><a class="film_a" data-urlpage="'+urlPage+'" data-url="'+url[1]+'" data-name="' + name + '">' + label[0] + '</a></li>'
    }
    html += '</ul>';
    
    return html;
}

async function saveOpenedFilm(e) {
	let name = $(this).data('name'); 
	let url = $(this).data('url'); 
	let urlPage = $(this).data('urlpage'); 
    if (name) {
  
    	let data = await getStorage(['history'])
		let history = data.history;
		let now = new Date();
		history = history ?? []; 
		history.push({name: name, date: now.toLocaleString(), url: urlPage});
		let p = new Promise(function(resolve, reject){
	        chrome.storage.local.set({history: history}, function(){
	            resolve(true);
	        })
	    });
	    let s = await p;
        
    	
    	
    }
    historyRendered = false;
    window.open(url, '_blank');
}


async function saveLink(e) {
    let name = $(this).data('name'); 
    let url = $(this).data('url'); 
    let quality = $(this).data('quality'); 

    if (name) {
  
        let data = await getStorage(['savedLinks'])
        let savedLinks = data.savedLinks;
        let now = new Date();
        savedLinks = savedLinks ?? []; 
        savedLinks.push({name: name, date: now.toLocaleString(), quality: quality, url: url});
        let p = new Promise(function(resolve, reject){
            chrome.storage.local.set({savedLinks: savedLinks}, function(){
                resolve(true);
            })
        });
        let s = await p;
            
    }
    savedLinksRendered = false;
    $('#saveLink').attr('disabled', true);
    $('#saveLink').html('Сохранено');
}


function getStorage(keys) {
    var p = new Promise(function(resolve, reject){
        chrome.storage.local.get(keys, function(options){
            resolve(options);
        })
    });
    
    return p;
}

/*
btnGetLinksSeason.onclick = function (element) {
    getRezkaInfo('GET_ALL_VIDEOS');
    chrome.storage.local.get(['serialCDN', 'lastFilm'], function (data) {
        let html = '<h5>last: ' + data.lastFilm + '</h5>';
        html += '<h5>' + data.serialCDN.payload.filmName + '</h5>';

        for (i of data.serialCDN.payload.series) {

            html += '<div class="seria"><b>' + i.season_id + '.' + i.episode_id + '</b>' + qualityRender(i.urls, data.serialCDN.payload.filmName + ' ' + i.season_id + '.' + i.episode_id) + '</div>';
        }

        var div = document.getElementById('contentForSeason');
        div.innerHTML = html;
        $('.film_a').on('auxclick click', saveOpenedFilm);
    });

};


btnShowLinksSeason.onclick = function (element) {
    chrome.storage.local.get(['serialCDN', 'lastFilm'], function (data) {
        let html = '<h5>last: ' + data.lastFilm + '</h5>';
        html += '<h5>' + data.serialCDN.payload.filmName + '</h5>';

        for (i of data.serialCDN.payload.series) {

            html += '<div class="seria"><b>' + i.season_id + '.' + i.episode_id + '</b>' + qualityRender(i.urls, data.serialCDN.payload.filmName + ' ' + i.season_id + '.' + i.episode_id) + '</div>';
        }

        var div = document.getElementById('contentForSeason');
        div.innerHTML = html;
        $('.film_a').on('click', saveOpenedFilm);
    });
};

*/
