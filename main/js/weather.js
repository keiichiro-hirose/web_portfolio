'use strict';


// params -------------------------------------------------------------------
const GoogleMapsKey = Ignore_params.google_maps_key;
const upImagePath = "../images/weather_icon_up.png";
const downImagePath = "../images/weather_icon_down.png"
const testPoint = { point: { lat : 35.889, lng : 139.541 }, title:"saitama", content: "<p class=\"infowindow\"><b>THIS IS SAITAMA</b></p>",};
let map;

window.onload = function(){
  // 日付の指定（一ヶ月前から昨日まで）
  let yesterday = new this.Date();
  yesterday.setDate(yesterday.getDate() -1)
  let yesterdayString = this.dateToFormat(yesterday)
  let lastMonth = new this.Date();
  lastMonth.setMonth(lastMonth.getMonth() -1)
  let lastMonthString = dateToFormat(lastMonth);
  let dateEl = document.getElementById("selectDate");
  dateEl.value = yesterdayString;
  dateEl.max = yesterdayString;
  dateEl.min = lastMonthString;
  // データリロード
  reLoadData()

}

function koushinButton(){
  //ボタン
  reLoadData()
} 
 
function reLoadData(){
  //指定された日付のデータを読む
  let selectDate = document.getElementById("selectDate").value;
  getCsvData('../tool/calcResult_' + selectDate + '.csv');
}

function getCsvData(dataPath) {
  //csvファイルを読む
  const request = new XMLHttpRequest();
  request.addEventListener('load', (event) => {
    const response = event.target.responseText;
    //読んだら表示する
    indicateData(response)
  });
  request.open('GET', dataPath, true);
  request.send();
}

function indicateData(dataCsv){
  //読んだデータを表示する

  let alartPointList = [];
  let dataList = dataCsv.split("\n");
  dataList.forEach(dataLine => {
    //地点ごとに、平均±標準偏差と当日数値を比較する。
    //閾値を超えていた場合、alartPointListに追加する
    let selectType = document.getElementById("selectType").value;
    let threshold = document.getElementById("threshold").value;
    let data = dataLine.split(",")
    if(data[0] != "\"station_name\""){
      let [station_name, lat, lng, dataDate ,max_temp_today, max_temp_mean, max_temp_stdev, min_temp_today, min_temp_mean, min_temp_stdev, ave_temp_today, ave_temp_mean, ave_temp_stdev, kousui_today, kousui_mean, kousui_stdev, ave_kaze_today, ave_kaze_mean, ave_kaze_stdev, max_kaze_today, max_kaze_mean, max_kaze_stdev] = data;

      switch (selectType) {
        case "max_temp":
          if(parseFloat(max_temp_today) < parseFloat(max_temp_mean) - (parseFloat(max_temp_stdev) * parseFloat(threshold))){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'down','最高気温がいつもより低くなっています<br>一ヶ月平均:' + max_temp_mean.substring(0,4) + ' 現在:' + max_temp_today))

          }else if(parseFloat(max_temp_mean) + (parseFloat(max_temp_stdev) * parseFloat(threshold)) < parseFloat(max_temp_today)){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'up','最高気温がいつもより高くなっています<br>一ヶ月平均:' + max_temp_mean.substring(0,4) + ' 現在:' + max_temp_today))
          }
          break;
        case "min_temp":
          if(parseFloat(min_temp_today) < parseFloat(min_temp_mean) - (parseFloat(min_temp_stdev) * parseFloat(threshold))){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'down','最低気温がいつもより低くなっています<br>一ヶ月平均:' + min_temp_mean.substring(0,4) + ' 現在:' + min_temp_today))

          }else if(parseFloat(min_temp_mean) + (parseFloat(min_temp_stdev) * parseFloat(threshold)) < parseFloat(min_temp_today)){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'up','最低気温がいつもより高くなっています<br>一ヶ月平均:' + min_temp_mean.substring(0,4) + ' 現在:' + min_temp_today))
          }
          break;
        case "ave_temp":
          if(parseFloat(ave_temp_today) < parseFloat(ave_temp_mean) - (parseFloat(ave_temp_stdev) * parseFloat(threshold))){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'down','平均気温がいつもより低くなっています<br>一ヶ月平均:' + ave_temp_mean.substring(0,4) + ' 現在:' + ave_temp_today))

          }else if(parseFloat(ave_temp_mean) + (parseFloat(ave_temp_stdev) * parseFloat(threshold)) < parseFloat(ave_temp_today)){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'up','平均気温がいつもより高くなっています<br>一ヶ月平均:' + ave_temp_mean.substring(0,4) + ' 現在:' + ave_temp_today))
          }
          break;
        case "kousui":
          if(parseFloat(kousui_today) < parseFloat(kousui_mean) - (parseFloat(kousui_stdev) * parseFloat(threshold))){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'down','降水量がいつもより低くなっています<br>一ヶ月平均:' + kousui_mean.substring(0,4) + ' 現在:' + kousui_today))

          }else if(parseFloat(kousui_mean) + (parseFloat(kousui_stdev) * parseFloat(threshold)) < parseFloat(kousui_today)){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'up','降水量がいつもより高くなっています<br>一ヶ月平均:' + kousui_mean.substring(0,4) + ' 現在:' + kousui_today))
          }
          break;
        case "ave_kaze":
          if(parseFloat(ave_kaze_today) < parseFloat(ave_kaze_mean) - (parseFloat(ave_kaze_stdev) * parseFloat(threshold))){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'down','風速がいつもより低くなっています<br>一ヶ月平均:' + ave_kaze_mean.substring(0,4) + ' 現在:' + ave_kaze_today))

          }else if(parseFloat(ave_kaze_mean) + (parseFloat(ave_kaze_stdev) * parseFloat(threshold)) < parseFloat(ave_kaze_today)){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'up','風速がいつもより高くなっています<br>一ヶ月平均:' + ave_kaze_mean.substring(0,4) + ' 現在:' + ave_kaze_today))
          }
          break;    
        case "max_kaze":
          if(parseFloat(max_kaze_today) < parseFloat(max_kaze_mean) - (parseFloat(max_kaze_stdev) * parseFloat(threshold))){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'down','風速がいつもより低くなっています<br>一ヶ月平均:' + max_kaze_mean.substring(0,4) + ' 現在:' + max_kaze_today))

          }else if(parseFloat(max_kaze_mean) + (parseFloat(max_kaze_stdev) * parseFloat(threshold)) < parseFloat(max_kaze_today)){
            alartPointList.push(makeAlartMarker(station_name, lat, lng,'up','風速がいつもより高くなっています<br>一ヶ月平均:' + max_kaze_mean.substring(0,4) + ' 現在:' + max_kaze_today))
          }
          break;    
        default:
          break;
      }
    }
  });

  //mapを更新し、地点を追加する
  initMap()
  alartPointList.forEach(a => {
    a.setMap(map)
  });

}

function makeAlartMarker(station_name, lat, lng, updown, msg){
  //GoogleMapのMarkerオブジェクトを生成する
  let markerImage;
  if(updown == 'down'){
    markerImage = downImagePath;
  }else{
    markerImage = upImagePath;
  }
  let image = {
    url : markerImage,
  }
  let marker = new google.maps.Marker({
    position : { lat : parseFloat(lat), lng : parseFloat(lng) },
    map : map,
    icon : image,
    title: station_name,
    content : "<p class=\"infowindow\"><b>" + station_name +"</b><br>" + msg +"</p>"
  })
  let infowindow = new google.maps.InfoWindow({
    content: marker.content,
  });
  marker.addListener("click", () => {
    infowindow.open(map, marker);
  });
  return marker;
}

function initMap() {
  // GoogleMapの初期化
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 38, lng: 140 },
        zoom: 6,
    });
}

function dateToFormat(d){
  //YYYY-MM-DDに変換
  return d.getFullYear() + "-" + ("0"+ (d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2)
}

let mapSrc = document.createElement("script");
mapSrc.src="https://maps.googleapis.com/maps/api/js?key=" + GoogleMapsKey + "&callback=initMap&libraries=&v=weekly"
mapSrc.async = true;
document.body.appendChild(mapSrc);
