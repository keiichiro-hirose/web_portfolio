
from datetime import date
import urllib.request
import lxml.html
import csv
import mysql.connector
import statistics
import datetime
import sys
# pip install lxml
# pip install cssselect


def encode_data(data):
    return urllib.parse.urlencode(data).encode(encoding='ascii')

def get_phpsessid():
    URL="http://www.data.jma.go.jp/gmd/risk/obsdl/index.php"
    xml = urllib.request.urlopen(URL).read().decode("utf-8")
    tree = lxml.html.fromstring(xml)
    return tree.cssselect("input#sid")[0].value
    

# 観測地点選択
def get_station(pd=0):
    assert type(pd) is int and pd >= 0
    
    URL="http://www.data.jma.go.jp/gmd/risk/obsdl/top/station"
    data = encode_data({"pd": "%02d" % pd})
    xml = urllib.request.urlopen(URL, data=data).read().decode("utf-8")
    tree = lxml.html.fromstring(xml)

    def kansoku_items(bits):
        return dict(rain=(bits[0] == "1"),
                    wind=(bits[1] == "1"),
                    temp=(bits[2] == "1"),
                    sun =(bits[3] == "1"),
                    snow=(bits[4] == "1"))

    def parse_station(dom):
        stitle = dom.get("title").replace("：", ":")
        title = dict(filter(lambda y: len(y) == 2,
                            map(lambda x: x.split(":"), stitle.split("\n"))))
                                
        name    = title["地点名"]
        stid    = dom.cssselect("input[name=stid]")[0].value
        stname  = dom.cssselect("input[name=stname]")[0].value
        kansoku = kansoku_items(dom.cssselect("input[name=kansoku]")[0].value)
        assert name == stname
        return (stname, dict(id=stid, flags=kansoku))

    def parse_prefs(dom):
        name = dom.text
        prid = int(dom.cssselect("input[name=prid]")[0].value)
        return (name, prid)
    
    if pd > 0:
        stations = dict(map(parse_station, tree.cssselect("div.station")))
    else:
        stations = dict(map(parse_prefs, tree.cssselect("div.prefecture")))
    return stations


# 観測項目選択
def get_aggrgPeriods():
    URL="http://www.data.jma.go.jp/gmd/risk/obsdl/top/element"
    xml = urllib.request.urlopen(URL).read().decode("utf-8")  # HTTP GET
    tree = lxml.html.fromstring(xml)

    def parse_periods(dom):
        if dom.find("label") is not None:
            val = dom.find("label/input").attrib["value"]
            key = dom.find("label/span").text
            rng = None
        else:
            val = dom.find("input").attrib["value"]
            key = dom.find("span/label").text
            rng = list(map(lambda x: int(x.get("value")),
                           dom.find("span/select").getchildren()))
        return (key, (val, rng))

    perdoms = tree.cssselect("#aggrgPeriod")[0].find("div/div").getchildren()
    periods = dict(map(parse_periods, perdoms))
    return periods

def get_elements(aggrgPeriods=9, isTypeNumber=1):
    URL="http://www.data.jma.go.jp/gmd/risk/obsdl/top/element"
    data = encode_data({"aggrgPeriod": aggrgPeriods,
                        "isTypeNumber": isTypeNumber})
    xml = urllib.request.urlopen(URL, data=data).read().decode("utf-8")
    open("tmp.html", "w").write(xml)
    tree = lxml.html.fromstring(xml)

    boxes = tree.cssselect("input[type=checkbox]")
    options, items = boxes[0:4], boxes[4:]

    def parse_items(dom):
        if "disabled" in dom.attrib: return None
        if dom.name == "kijiFlag": return None
        name     = dom.attrib["id"]
        value    = dom.attrib["value"]
        options  = None
        select = dom.getnext().find("select")
        if select is not None:
            options = list(map(lambda x: int(x.get("value")),
                               select.getchildren()))
        return (name, (value, options))
    
    items = dict(filter(lambda x: x, map(parse_items, items)))
    return items


def download_hourly_csv(phpsessid, station, element, begin_date, end_date):
    params = {
        "PHPSESSID": phpsessid,
        # 共通フラグ
        "rmkFlag": 1,        # 利用上注意が必要なデータを格納する
        "disconnectFlag": 1, # 観測環境の変化にかかわらずデータを格納する
        "csvFlag": 1,        # すべて数値で格納する
        "ymdLiteral": 1,     # 日付は日付リテラルで格納する
        "youbiFlag": 0,      # 日付に曜日を表示する
        "kijiFlag": 0,       # 最高・最低（最大・最小）値の発生時刻を表示
        # 時別値データ選択
        "aggrgPeriod": 9,    # 時別値
        "stationNumList": '["%s"]' % station,      # 観測地点IDのリスト
        # "elementNumList": '[["%s",""]]' % element, # 項目IDのリスト
        "elementNumList": element,
        "ymdList": '["%d", "%d", "%d", "%d", "%d", "%d"]' % (
            begin_date.year,  end_date.year,
            begin_date.month, end_date.month,
            begin_date.day,   end_date.day),       # 取得する期間
        "jikantaiFlag": 0,        # 特定の時間帯のみ表示する
        "jikantaiList": '[1,24]', # デフォルトは全部
        "interAnnualFlag": 1,     # 連続した期間で表示する
        # 以下、意味の分からないフラグ類
        "optionNumList": [],
        "downloadFlag": "true",   # CSV としてダウンロードする？
        "huukouFlag": 0,
    }

    URL="http://www.data.jma.go.jp/gmd/risk/obsdl/show/table"
    data = encode_data(params)
    
    csv = urllib.request.urlopen(URL, data=data).read().decode("shift-jis")
    return csv


# ==========コピペここまで=============


def download_daily_csv(phpsessid, station, element, begin_date, end_date):
    params = {
        "PHPSESSID": phpsessid,
        # 共通フラグ
        "rmkFlag": 1,        # 利用上注意が必要なデータを格納する
        "disconnectFlag": 1, # 観測環境の変化にかかわらずデータを格納する
        "csvFlag": 1,        # すべて数値で格納する
        "ymdLiteral": 1,     # 日付は日付リテラルで格納する
        "youbiFlag": 0,      # 日付に曜日を表示する
        "kijiFlag": 0,       # 最高・最低（最大・最小）値の発生時刻を表示
        # 時別値データ選択
        "aggrgPeriod": 1,    # 日別値
        "stationNumList": '["%s"]' % station,      # 観測地点IDのリスト
        
        #"elementNumList": '[["%s",""]]' % element, # 項目IDのリスト
        "elementNumList": element,
        "ymdList": '["%d", "%d", "%d", "%d", "%d", "%d"]' % (
            begin_date.year,  end_date.year,
            begin_date.month, end_date.month,
            begin_date.day,   end_date.day),       # 取得する期間
        # "jikantaiFlag": 0,        # 特定の時間帯のみ表示する
        # "jikantaiList": '[1,24]', # デフォルトは全部
        "interAnnualFlag": 1,     # 連続した期間で表示する
        # 以下、意味の分からないフラグ類
        "optionNumList": [],
        "downloadFlag": "true",   # CSV としてダウンロードする？
        "huukouFlag": 0,
    }

    URL="http://www.data.jma.go.jp/gmd/risk/obsdl/show/table"
    data = encode_data(params)
    
    csv = urllib.request.urlopen(URL, data=data).read().decode("shift-jis")
    return csv


def writeStationListId():
    #観測所一覧ファイルにサイト内IDを追記するだけ
    #一回のみ使用
    stations = csv.reader(open('station_name2.csv'))
    stationNameList = []
    stationNameDict = {}
    for s in stations: 
        stationNameList.append(s[0])
        stationNameDict[s[0]] = s[1]
    data = []
    for i in get_station(0).keys():
        try:

            stInfo = get_station(get_station(0)[i])
            for st in stInfo:
                if st in stationNameList:
                    print(get_station(stInfo[st]['id']))
                    #print(st, stationNameDict[st], stInfo[st]['id'],stInfo[st])
                    data.append([st, stationNameDict[st], stInfo[st]['id']])        
        except :
            pass
    print(data)        

    # with open('station_names2.csv', 'w') as n:
    #     csvWriter = csv.writer(n)
    #     csvWriter.writerows(data)   

        
def calcSigma(data_list):
    # data_list : list(float)
    # data_listの最後の数が平均±標準偏差*sigma_factorから外れているかどうかを比較するための数字を出す
    # return [today_data, mean, sigma]

    if None in data_list:
        return [None]
    else:
        today_data = data_list.pop(-1)
        mean_data = statistics.mean(data_list)#平均
        stdev_data = statistics.stdev(data_list)#標準偏差
        return[today_data, mean_data, stdev_data]

def getDataOfDay(ref_date):
    #指定された日付分のcalcResultファイルを作成する

    stations = csv.reader(open('station_name3.csv'))
    # 観測地点の情報ファイルを読み込む
    phpsessid = get_phpsessid()
    element = '[["202",""],["201",""],["203",""],["101",""],["301",""],["302",""]]'
    # JMAのサイトのチェックボックスについているID
    # 日平均気温=201、日最高気温=202、日最低気温=203、降水量の日合計=101、日平均風速=301、日最大風速=302
    csv_lines = []
    csv_line_one = '"station_name","lat","lng","date","max_temp_today","max_temp_mean","max_temp_stdev","min_temp_today","min_temp_mean","min_temp_stdev","ave_temp_today","ave_temp_mean","ave_temp_stdev","kousui_today","kousui_mean","kousui_stdev","ave_kaze_today","ave_kaze_mean","ave_kaze_stdev","max_kaze_today","max_kaze_mean","max_kaze_stdev"'
    
    def toFloat(str):
        try:
            return float(str)
        except ValueError:
            return None

    for s in stations:
        #ステーションごとにリクエストをおこなう
        if(s[0] == 'stn_name'):
            continue
        start_date = ref_date - datetime.timedelta(days=31)
        x = 0
        while x == 0:
            try:
                print(s)
                downloadData = download_daily_csv(phpsessid, s[2], element, date(start_date.year, start_date.month, start_date.day), date(ref_date.year, ref_date.month, ref_date.day)).split('\n')
                x = 1
            except UnicodeDecodeError as e:
                #ときどきエラーメッセージのHTMLが返されるため
                print(s[0] + "download failed. try again")
                print(e)

        date_list, max_temp_list, ave_temp_list, min_temp_list, kousui_list, ave_kaze_list, max_kaze_list = [[],[],[],[],[],[],[]]

        #帰ってきたデータを整理
        for l in range(len(downloadData) - 1):
            # データは6行目から
            if(l <= 5):
                pass
            else:
                oneDayData = downloadData[l].split(',')
                date_list.append(oneDayData[0])
                max_temp_list.append(toFloat(oneDayData[1]))
                ave_temp_list.append(toFloat(oneDayData[4]))
                min_temp_list.append(toFloat(oneDayData[7]))
                kousui_list.append(toFloat(oneDayData[10]))
                ave_kaze_list.append(toFloat(oneDayData[14]))
                max_kaze_list.append(toFloat(oneDayData[17]))

        # データリストから平均と標準偏差をとる。本日分のデータは比較用。
        csv_lines.append(','.join([s[0], s[3], s[4], str(ref_date) , *map(lambda x: str(x), calcSigma(max_temp_list)) , *map(lambda x: str(x), calcSigma(min_temp_list)), *map(lambda x: str(x),calcSigma(ave_temp_list)) , *map(lambda x: str(x),calcSigma(kousui_list)) , *map(lambda x: str(x),calcSigma(ave_kaze_list)) , *map(lambda x: str(x),calcSigma(max_kaze_list))]))

 
    #CSVに書き出す
    with open('calcResult_' + str(ref_date) +'.csv', mode='w') as resultFile:
        resultFile.write(csv_line_one + '\n')
        resultFile.write('\n'.join(csv_lines))
        print('calcResult_' + str(ref_date) +'.csv' + ' has completed')

if __name__ == "__main__":
    # 引数：int 何日前のデータを計算するか
    # 過去データなので本日分のデータが取れるわけないのだが、なぜか取れてしまう
    # 基本的には一日以上前を指定して使用すべき
    ref_date = date.today()
    if(len(sys.argv) >= 2):
        ref_date = ref_date - datetime.timedelta(days=int(sys.argv[1]))
    else:
        pass
    print('calculating' + str(ref_date))
    getDataOfDay(ref_date)

                
