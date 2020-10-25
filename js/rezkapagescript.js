
window.addEventListener('GET_CURRENT_VIDEO', function getInfoInPage(event) {
   let seria = '', season = '';
   try {
      seria = $('.b-simple_episode__item.active').data('episode_id') ?? '';
      season = $('.b-simple_episode__item.active').data('season_id') ?? '';
   }catch(e) {}
   payload = {
   	filmName: $('h1').html()+' '+season+(seria?'.':'')+seria,
   	CDNPlayerInfo: CDNPlayerInfo,
      urlPage: window.location.href
   };
   window.postMessage({action: 'GOT_CURRENT_VIDEO', payload: payload}, '*');
}, false); 

window.addEventListener('GET_ALL_VIDEOS', function getInfoInPage(event) {
   
   let translator_id = $('.b-translator__item.active').data('translator_id') ?? 1;
   var series = [];
   let t = new Date().getTime();
   $('.b-simple_episode__item').each(function() {
   	let episode_id = $(this).data('episode_id'),
   	season_id = $(this).data('season_id');
   	$.ajax({
   		type: "POST",
   		url: "/ajax/get_cdn_series/?t="+t,
   		async: false,
   		data: {
   			id: $(this).data('id'),
   			translator_id: translator_id,
   			season: $(this).data('season_id'),
   			episode: $(this).data('episode_id'),
   			action: 'get_stream'
   		},
   		success: function (response) {
   			if ('object' !== typeof response) {
   				response = $.parseJSON(response)
   			}
   			if (response.success == !0) {
   				series.push({
   					episode_id,
   					season_id,
   					urls: response.url,
   				});
   			} else {

   			}
   		}
   	});
   	

   });
   payload = {
   	series: series,
   	filmName: $('h1').html(),
   };
   window.postMessage({action: 'GOT_ALL_VIDEOS', payload: payload}, '*');
}, false); 