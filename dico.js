exports.action = function(data, callback, config, SARAH){
var config = config.modules.dico;
  
  if (!data.dictation){
    return callback({'tts': "Je n'ai pas compris la demande, veillez la reformuler"});
  }
  
  var dictation = data.dictation;
  var wiki = false;
  var syn = false;
  if(dictation.match('Wikipédia')){wiki = true;}
  if(dictation.match('synonyme')){syn = true;}
  
  console.log('Phrase prononcée : ' + dictation);
  var search = dictation;
  if(wiki == false){search = search.replace(/'/g,' ').replace(/-/g,' ');}
  search = search.split(' ');
  var words = config.Mots_à_filtrer.split(' ');
  for(i=0;i<search.length;i++){
    for(e=0;e<words.length;e++){
      if(search[i] == words[e]){
        search[i] = '*';}}}
  var a = []; var l = 0;
  for(i=0;i<search.length;i++){if(search[i] != '*'){a[l] = search[i]; l++;}}
  search = a;
  if(search.length > 1 && wiki == false){
    return callback({'tts': "Il y a une erreur dans la demande, veillez la reformuler"});}
  if(search.length > 1){search = search.join(' ');}
  if (search.length == 1){
    search = search.toString();
    if (wiki == false){
      search = search.replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e').replace(/à/g,'a');}}
  console.log('Sujet de la recherche : ' + search);
  if(search.length < 1){
    return callback({'tts': "Il y a une erreur dans la demande, veillez la reformuler"});}
      
  if(wiki == true){Wiki(search, callback);}
  else {Dico(syn, search, callback);}
}

var Dico = function(syn, search, callback){
  var url = 'http://linternaute.com/dictionnaire/fr/definition/'+search+'/';
  var request = require('request');
  var iconv = require('iconv-lite-master');
  request({ uri: url, encoding: null }, function (err, response, body){

    if (err || response.statusCode != 200) {
      callback({'tts': "L'action a échoué"});
      return;
    }
	
    body = iconv.decode(body, 'iso-8859-1');
		
    var answer = '';
    var $ = require('cheerio').load(body);
    
    if (syn == false){
      var list = $('FONT.fiche_mot_lien_sens').map(function(){ return $(this).text(); });
      answer = "J'ai trouvé " + list.length + " définitions, , , ";
      if(list.length == 1){answer = "J'ai trouvé une définition. " + list[0];}
      else {for(i=0;i<list.length;i++){answer = answer + "Sens "+(i+1)+" : "+list[i]+" , , ";}}
      if(list.length == 0){answer = "Je n'ai pas trouvé de définition pour le mot "+search+".";}
    }
    
    if (syn == true){
      var list = $('A.fiche_mot_lien_synonyme').map(function(){ return $(this).text(); });
      list = list.sort(); var result = []; var k = 0;
      for(i=0;i<list.length;i++){
        var m = 0;
        for(e=0;e<result.length;e++){
          if(list[i] == result[e]){m++;}}
        if(m == 0){result[k] = list[i]; k++;}
      }
      answer = "J'ai trouvé " + result.length + " synonymes, , , ";
      if(result.length == 1){answer = answer + result[0];}
      else {answer = answer + result.join(", , ");}
      if(result.length == 0){answer = "Je n'ai pas trouvé de synonyme pour le mot "+search+".";}
    }
    
    if (answer == '') {return callback({'tts': "L'action a échoué"});}
	callback({'tts': answer });
  });
}

var Wiki = function(search, callback){
  var url = 'https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&titles='+search+'&format=json';
  var request = require('request');
  request({ 'uri' : url, 'json' : true }, function (err, response, body){
    
    if (err || response.statusCode != 200) {
      callback({'tts': "L'action a échoué"});
      return;
    }
    
    var txt = '';
    var extract = getFirst(body.query.pages).extract;
	
	if(!extract){return callback({'tts': "Je n'ai rien trouvé sur Wikipédia pour "+search+"."});}
	
	var list = extract.replace(/</g,'*').replace(/>/g,'*').split('*');
    for(i=0;i<list.length;i=i+2){txt = txt + list[i];}
    txt = txt.split('. ')[0] + '.';

    if(txt.length < 1){return callback({'tts': "L'action a échoué" });}
    else{callback({'tts': txt });}
  });
}

var getFirst = function(obj){
  return obj[Object.keys(obj)[0]];
}